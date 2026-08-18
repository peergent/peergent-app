/**
 * PX-50.22 / PX-58 — bridges Office step approvals to durable Project Engine approval + resume.
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
import { mergeCampaignStepApprovalIntoProject } from "./live-campaign-context-store";
import {
  emitApprovalBridgeDiagnostic,
  safeApprovalBridgeError,
} from "./approval-bridge-diagnostics";
import { freezeApprovedExecutionHandoff } from "@/lib/brain/approval/approved-execution-handoff";
import { commitEpisodeCritical } from "@/lib/brain/project-runtime/episode-durable-persistence";
import { getActiveDurablePersistence } from "@/lib/brain/persistence/layer/active-durable-persistence";

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
  | {
      ok: true;
      project: MarketingProject;
      episodeResumed: boolean;
      approvalPersisted: boolean;
      resumeError?: string;
    }
  | {
      ok: false;
      error:
        | "episode_not_found"
        | "checkpoint_mismatch"
        | "persist_failed"
        | "not_approved"
        | "approval_persistence_failed"
        | "invalid_project";
    };

export async function submitLiveCampaignStepApprovalServer(
  input: SubmitLiveCampaignStepApprovalServerInput
): Promise<SubmitLiveCampaignStepApprovalServerResult> {
  emitApprovalBridgeDiagnostic({
    event: "approval_submission_requested",
    organizationId: input.organizationId,
    projectId: input.projectId,
    bridgeStepId: input.stepId,
    decision: input.status,
  });

  if (input.status !== "approved") {
    return { ok: false, error: "not_approved" };
  }

  if (input.project.id !== input.projectId || !input.project.campaignSetup) {
    return { ok: false, error: "invalid_project" };
  }

  const updatedProject = mergeCampaignStepApprovalIntoProject(
    input.project,
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
    emitApprovalBridgeDiagnostic({
      event: "approval_bridge_resolved",
      organizationId: input.organizationId,
      projectId: input.projectId,
      bridgeStepId: input.stepId,
      decision: "approved",
      errorCode: "episode_not_found",
    });
    return { ok: true, project: updatedProject, episodeResumed: false, approvalPersisted: false };
  }

  const expectedCheckpoint = STEP_TO_CHECKPOINT[input.stepId];
  const activeCheckpoint = episode.snapshot.approvalCheckpoint?.kind;

  emitApprovalBridgeDiagnostic({
    event: "approval_bridge_resolved",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    episodeVersion: episode.durableVersion,
    checkpointKind: activeCheckpoint,
    bridgeStepId: input.stepId,
    decision: "approved",
  });

  if (
    expectedCheckpoint &&
    activeCheckpoint &&
    activeCheckpoint !== expectedCheckpoint &&
    episode.snapshot.state === "waiting_for_approval"
  ) {
    emitApprovalBridgeDiagnostic({
      event: "approval_checkpoint_resolution_failed",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      episodeVersion: episode.durableVersion,
      checkpointKind: activeCheckpoint,
      bridgeStepId: input.stepId,
      errorCode: "checkpoint_mismatch",
    });
    return { ok: false, error: "checkpoint_mismatch" };
  }

  if (episode.snapshot.approvalCheckpoint?.satisfied) {
    emitApprovalBridgeDiagnostic({
      event: "approval_already_satisfied",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      episodeVersion: episode.durableVersion,
      checkpointKind: activeCheckpoint,
      bridgeStepId: input.stepId,
    });
    return {
      ok: true,
      project: updatedProject,
      episodeResumed: false,
      approvalPersisted: true,
    };
  }

  if (episode.snapshot.state !== "waiting_for_approval" && !episode.snapshot.approvalCheckpoint) {
    return {
      ok: true,
      project: updatedProject,
      episodeResumed: false,
      approvalPersisted: false,
    };
  }

  await resolveDurableOrganizationNameServer(input.supabase, input.organizationId);
  const campaignContext = buildCampaignContext({
    project: updatedProject,
    domainInput: input.domainInput,
    locale: input.locale,
    organizationId: input.organizationId,
  });

  emitApprovalBridgeDiagnostic({
    event: "approval_persistence_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    episodeVersion: episode.durableVersion,
    checkpointKind: activeCheckpoint ?? expectedCheckpoint,
    bridgeStepId: input.stepId,
    decision: "approved",
  });

  const approvalId = `office-${input.stepId}-${Date.now()}`;
  const persistStartedMs = Date.now();
  try {
    await submitProjectApprovalDurable({
      organizationId: input.organizationId,
      projectId: input.projectId,
      approvalId,
      decision: "approved",
      actor: input.actor,
      comment: `Office approval: ${input.stepId}`,
    });
  } catch (error) {
    const safe = safeApprovalBridgeError(error);
    emitApprovalBridgeDiagnostic({
      event: "approval_persistence_failed",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      episodeVersion: episode.durableVersion,
      checkpointKind: activeCheckpoint ?? expectedCheckpoint,
      bridgeStepId: input.stepId,
      decision: "approved",
      errorCode: safe.errorCode,
      errorClass: safe.errorClass,
      durationMs: Date.now() - persistStartedMs,
    });
    return { ok: false, error: "approval_persistence_failed" };
  }

  const repo = getDefaultProjectEpisodeRepository();
  let episodeAfterApproval = repo.get({
    organizationId: input.organizationId,
    projectId: input.projectId,
  });
  if (episodeAfterApproval) {
    episodeAfterApproval = freezeApprovedExecutionHandoff({
      episode: episodeAfterApproval,
      approvalId,
      campaignName: updatedProject.title,
      campaignContext,
      locale: input.locale,
    });
    repo.save(episodeAfterApproval);
    const durable = getActiveDurablePersistence();
    if (durable) {
      await commitEpisodeCritical(episodeAfterApproval, durable);
    }
    emitApprovalBridgeDiagnostic({
      event: "approved_package_handoff_resolved",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episodeAfterApproval.snapshot.episodeId,
      checkpointKind: activeCheckpoint ?? expectedCheckpoint,
      bridgeStepId: input.stepId,
      packageId: episodeAfterApproval.approvedExecutionHandoff?.packageId,
      packageVersion: episodeAfterApproval.approvedExecutionHandoff?.packageVersion,
    });
  }

  emitApprovalBridgeDiagnostic({
    event: "approval_persistence_completed",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    episodeVersion: episode.durableVersion,
    checkpointKind: activeCheckpoint ?? expectedCheckpoint,
    bridgeStepId: input.stepId,
    decision: "approved",
    durationMs: Date.now() - persistStartedMs,
  });

  emitApprovalBridgeDiagnostic({
    event: "approval_checkpoint_resolution_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    episodeVersion: episode.durableVersion,
    checkpointKind: activeCheckpoint ?? expectedCheckpoint,
    bridgeStepId: input.stepId,
  });

  emitApprovalBridgeDiagnostic({
    event: "post_approval_resume_requested",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    episodeVersion: episode.durableVersion,
    checkpointKind: activeCheckpoint ?? expectedCheckpoint,
    bridgeStepId: input.stepId,
  });

  const adapter = createProductionBrainExecutionAdapter({
    peerId: input.peerId,
    project: updatedProject,
    domainInput: input.domainInput,
    workflowOptions: { requireRealContext: true },
  });
  const runner = createProjectEpisodeRunner(undefined, undefined, adapter);

  const resumeStartedMs = Date.now();
  emitApprovalBridgeDiagnostic({
    event: "post_approval_resume_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    episodeVersion: episode.durableVersion,
    checkpointKind: activeCheckpoint ?? expectedCheckpoint,
    bridgeStepId: input.stepId,
  });

  try {
    await runner.resumeEpisode({
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      peerRole: input.peerRole,
      approvalSatisfied: true,
      locale: input.locale ?? "en",
      useRealContext: true,
      supabase: input.supabase,
      campaignContext,
    });

    emitApprovalBridgeDiagnostic({
      event: "approval_checkpoint_resolved",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      checkpointKind: activeCheckpoint ?? expectedCheckpoint,
      bridgeStepId: input.stepId,
    });

    emitApprovalBridgeDiagnostic({
      event: "post_approval_resume_completed",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      checkpointKind: activeCheckpoint ?? expectedCheckpoint,
      bridgeStepId: input.stepId,
      durationMs: Date.now() - resumeStartedMs,
    });

    return {
      ok: true,
      project: updatedProject,
      episodeResumed: true,
      approvalPersisted: true,
    };
  } catch (error) {
    const safe = safeApprovalBridgeError(error);
    emitApprovalBridgeDiagnostic({
      event: "post_approval_resume_failed",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      checkpointKind: activeCheckpoint ?? expectedCheckpoint,
      bridgeStepId: input.stepId,
      errorCode: safe.errorCode,
      errorClass: safe.errorClass,
      durationMs: Date.now() - resumeStartedMs,
    });

    // Approval is durably persisted — do not report approval failure when resume/execution fails.
    return {
      ok: true,
      project: updatedProject,
      episodeResumed: false,
      approvalPersisted: true,
      resumeError: safe.errorCode,
    };
  }
}
