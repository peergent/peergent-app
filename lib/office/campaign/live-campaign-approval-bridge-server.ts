/**
 * PX-50.22 — bridges Office step approvals to durable Project Engine approval + resume.
 */

import "server-only";

import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { DemoStepApprovalStatus } from "@/lib/office/demo/demo-workflow-simulation";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { ApprovalCheckpointKind } from "@/lib/brain/project-engine/types";
import { submitProjectApprovalDurable } from "@/lib/brain/project-runtime/approval-service";
import { createProjectEpisodeRunner } from "@/lib/brain/project-runtime/project-episode-runner";
import { createProductionBrainExecutionAdapter } from "@/lib/brain/project-runtime/production-brain-adapter";
import { getDefaultProjectEpisodeRepository } from "@/lib/brain/project-runtime/project-episode-repository";
import { prepareBrainServerPersistence } from "@/lib/brain/persistence/server/prepare-brain-server-persistence";
import { buildCampaignContext } from "./campaign-context";
import { resolveDurableOrganizationNameServer } from "./resolve-organization-name-server";
import { persistLiveCampaignStepApproval } from "./live-campaign-context-store";

const STEP_TO_CHECKPOINT: Partial<Record<CampaignWorkflowStepId, ApprovalCheckpointKind>> = {
  strategy_determined: "strategy_review",
  channels_selected: "channel_review",
  deliverables_created: "deliverable_review",
  waiting_for_approval: "campaign_approval",
  published: "publication_confirm",
};

export type SubmitLiveCampaignStepApprovalServerInput = {
  peerId: string;
  projectId: string;
  stepId: CampaignWorkflowStepId;
  status: DemoStepApprovalStatus;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  organizationId: string;
  actor: string;
  supabase: AppSupabaseClient;
  peerRole?: string;
  locale?: "nl" | "en";
};

export type SubmitLiveCampaignStepApprovalServerResult =
  | { ok: true; project: MarketingProject; episodeResumed: boolean }
  | { ok: false; error: "episode_not_found" | "checkpoint_mismatch" | "persist_failed" | "not_approved" };

export async function submitLiveCampaignStepApprovalServer(
  input: SubmitLiveCampaignStepApprovalServerInput
): Promise<SubmitLiveCampaignStepApprovalServerResult> {
  if (input.status !== "approved") {
    return { ok: false, error: "not_approved" };
  }

  const updatedProject = persistLiveCampaignStepApproval(
    input.peerId,
    input.projectId,
    input.stepId,
    input.status
  );
  if (!updatedProject) {
    return { ok: false, error: "persist_failed" };
  }

  await prepareBrainServerPersistence({
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
  });

  const episode = getDefaultProjectEpisodeRepository().get({
    organizationId: input.organizationId,
    projectId: input.projectId,
  });
  if (!episode) {
    return { ok: true, project: updatedProject, episodeResumed: false };
  }

  const expectedCheckpoint = STEP_TO_CHECKPOINT[input.stepId];
  const activeCheckpoint = episode.snapshot.approvalCheckpoint?.kind;
  if (
    expectedCheckpoint &&
    activeCheckpoint &&
    activeCheckpoint !== expectedCheckpoint &&
    episode.snapshot.state === "waiting_for_approval"
  ) {
    return { ok: false, error: "checkpoint_mismatch" };
  }

  if (episode.snapshot.state !== "waiting_for_approval" && !episode.snapshot.approvalCheckpoint) {
    return { ok: true, project: updatedProject, episodeResumed: false };
  }

  await resolveDurableOrganizationNameServer(input.supabase, input.organizationId);
  buildCampaignContext({
    project: updatedProject,
    domainInput: input.domainInput,
    locale: input.locale,
    organizationId: input.organizationId,
  });

  await submitProjectApprovalDurable({
    organizationId: input.organizationId,
    projectId: input.projectId,
    approvalId: `office-${input.stepId}-${Date.now()}`,
    decision: "approved",
    actor: input.actor,
    comment: `Office approval: ${input.stepId}`,
  });

  const adapter = createProductionBrainExecutionAdapter({
    peerId: input.peerId,
    project: updatedProject,
    domainInput: input.domainInput,
    workflowOptions: { requireRealContext: true },
  });
  const runner = createProjectEpisodeRunner(undefined, undefined, adapter);

  await runner.resumeEpisode({
    organizationId: input.organizationId,
    projectId: input.projectId,
    approvalSatisfied: true,
    locale: input.locale ?? "en",
    maxSteps: 120,
  });

  return { ok: true, project: updatedProject, episodeResumed: true };
}
