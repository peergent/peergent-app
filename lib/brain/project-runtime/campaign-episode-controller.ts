import "server-only";

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { BrainRepositoryBundle } from "../persistence/repository-factory";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { BrainRunResult } from "../runtime/run-result";
import type { ProjectBrainId } from "../project-engine/types";
import { prepareBrainServerPersistence } from "../persistence/server/prepare-brain-server-persistence";
import { prepareBrainServerContext } from "../context-acquisition/server/prepare-brain-server-context";
import {
  assertLiveBrainServerContext,
  assertProductionEpisodeRealContext,
} from "../context-acquisition/server/context-acquisition-config";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { createProjectEpisodeRunner } from "./project-episode-runner";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";
import type { EpisodeRunResult, EpisodeRunTarget } from "./types";
import { createProductionBrainExecutionAdapter } from "./production-brain-adapter";
import { emitOrchestrationDiagnostic } from "./orchestration-diagnostics";
import type { ContextGap } from "./types";

/**
 * PX-50 production episode boundary.
 *
 * Authority model:
 * - ProjectEngineSnapshot / ProjectEpisodeRecord = lifecycle truth (canonical)
 * - MarketingProject.campaignSetup = UX projection / cache (not lifecycle authority)
 */

export type StartOrResumeCampaignEpisodeInput = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId: string;
  peerId: string;
  peerRole: string;
  campaignContext: CampaignContext;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: "nl" | "en";
  target?: EpisodeRunTarget;
  repositories?: BrainRepositoryBundle;
  contextAssembly?: ContextAssemblyResult;
  onProgress?: (label: string) => void;
};

export type CampaignEpisodeResult = EpisodeRunResult & {
  orchestrationAuthority: "project_engine";
  episodeResumed: boolean;
  /** Strategy capability run when targetBrain is strategy — for Office output compatibility. */
  strategyCapabilityRun?: BrainRunResult | null;
  /** Safe gap metadata for Office when paused for context. */
  blockingContextGaps?: readonly ContextGap[];
};

export async function startOrResumeCampaignEpisode(
  input: StartOrResumeCampaignEpisodeInput
): Promise<CampaignEpisodeResult> {
  assertLiveBrainServerContext({ peerId: input.peerId, supabase: input.supabase });
  assertProductionEpisodeRealContext({
    peerId: input.peerId,
    useRealContext: true,
    supabase: input.supabase,
    campaignContext: input.campaignContext,
  });

  await prepareBrainServerPersistence({
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
  });

  const locale = input.locale ?? "en";
  const contextPrep =
    input.contextAssembly ??
    (
      await prepareBrainServerContext({
        supabase: input.supabase,
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        peerRole: input.peerRole,
        campaignContext: input.campaignContext,
        locale,
        phase: input.target?.targetBrain ?? "project_start",
      })
    ).assembly;

  const existingEpisode = getDefaultProjectEpisodeRepository().get({
    organizationId: input.organizationId,
    projectId: input.projectId,
  });
  const episodeResumed = existingEpisode != null;

  emitOrchestrationDiagnostic({
    event: episodeResumed ? "episode_resumed" : "episode_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    episodeId: existingEpisode?.snapshot.episodeId,
  });

  const adapter = createProductionBrainExecutionAdapter({
    peerId: input.peerId,
    project: input.project,
    domainInput: input.domainInput,
    workflowOptions: {
      repositories: input.repositories,
      contextAssembly: contextPrep,
      requireRealContext: true,
      onProgress: input.onProgress,
    },
  });

  const runner = createProjectEpisodeRunner(undefined, undefined, adapter);
  const result = await runner.runUntilPause({
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    peerRole: input.peerRole,
    locale,
    useRealContext: true,
    supabase: input.supabase,
    campaignContext: input.campaignContext,
    target: input.target,
  });

  if (result.status === "waiting_for_context") {
    emitOrchestrationDiagnostic({
      event: "episode_paused",
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      episodeId: result.episode.snapshot.episodeId,
      episodeStatus: result.status,
      reason: result.reason ?? "context_gap",
    });
  }

  const strategyCapabilityRun =
    input.target?.targetBrain === "strategy" || result.episode.snapshot.completedBrains.includes("strategy")
      ? adapter.lastCapabilityRun ?? null
      : null;

  return {
    ...result,
    orchestrationAuthority: "project_engine",
    episodeResumed,
    strategyCapabilityRun,
    blockingContextGaps: result.missingContext.filter((gap) => gap.blocking),
  };
}

/** Demo-safe episode entry — uses registry layers, not production capability adapter. */
export async function startOrResumeDemoCampaignEpisode(input: {
  organizationId: string;
  projectId: string;
  peerId: string;
  target?: EpisodeRunTarget;
  locale?: "nl" | "en";
}): Promise<CampaignEpisodeResult> {
  if (!isDemoPeer(input.peerId)) {
    throw new Error("Demo episode entry requires demo peer.");
  }

  const existingEpisode = getDefaultProjectEpisodeRepository().get({
    organizationId: input.organizationId,
    projectId: input.projectId,
  });

  const runner = createProjectEpisodeRunner();
  const result = await runner.runUntilPause({
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    locale: input.locale ?? "en",
    target: input.target,
  });

  return {
    ...result,
    orchestrationAuthority: "project_engine",
    episodeResumed: existingEpisode != null,
    blockingContextGaps: result.missingContext.filter((gap) => gap.blocking),
  };
}

export function episodeAuthorityNote(): string {
  return "ProjectEngineSnapshot (via ProjectEpisodeRecord) is lifecycle authority; MarketingProject fields are projection/cache.";
}
