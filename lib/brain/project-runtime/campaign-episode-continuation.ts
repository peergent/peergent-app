import "server-only";

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { usesProjectEngineLifecycleAuthority } from "@/lib/office/campaign/live-strategy-run-service";
import { requiresPublicationApproval } from "../policy/campaign-approval-policy";
import { prepareBrainServerPersistence } from "../persistence/server/prepare-brain-server-persistence";
import { assertLiveBrainServerContext } from "../context-acquisition/server/context-acquisition-config";
import { resolveEpisodeStepBudget } from "./episode-step-budget";
import { createProjectEpisodeRunner } from "./project-episode-runner";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";
import { createProductionBrainExecutionAdapter } from "./production-brain-adapter";
import { emitOrchestrationDiagnostic } from "./orchestration-diagnostics";
import type { CampaignEpisodeResult } from "./campaign-episode-controller";
import type { EpisodeRunResult, ProjectEpisodeRecord } from "./types";

export type EpisodeContinuationTrigger =
  | "strategy_target_complete"
  | "explicit_resume"
  | "duplicate_invocation";

export type ContinueCampaignEpisodeInput = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId: string;
  peerId: string;
  peerRole: string;
  campaignContext: CampaignContext;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: "nl" | "en";
  trigger: EpisodeContinuationTrigger;
  /** When provided, skip eligibility re-check (caller already validated episode). */
  episodeResult?: EpisodeRunResult;
};

export type ContinueCampaignEpisodeSkipReason =
  | "not_automatic"
  | "guided_checkpoint_mode"
  | "episode_not_found"
  | "episode_not_running"
  | "strategy_incomplete"
  | "pipeline_complete"
  | "waiting_for_context"
  | "waiting_for_approval"
  | "already_continued";

const inFlightByKey = new Map<string, Promise<CampaignEpisodeResult>>();

function continuationKey(organizationId: string, projectId: string): string {
  return `${organizationId}:${projectId}`;
}

function resolveApprovalMode(
  project: MarketingProject,
  episode: ProjectEpisodeRecord
): CampaignApprovalMode {
  return (
    project.campaignSetup?.approvalMode ??
    episode.campaignApprovalMode ??
    "approval_before_publication"
  );
}

function postStrategyPipelineComplete(
  episode: ProjectEpisodeRecord,
  approvalMode: CampaignApprovalMode
): boolean {
  if (approvalMode === "no_approval_required") {
    return (
      episode.episodeStatus === "completed" ||
      episode.episodeStatus === "waiting_for_outcomes" ||
      episode.snapshot.completedBrains.includes("execution")
    );
  }
  if (requiresPublicationApproval(approvalMode)) {
    return (
      episode.episodeStatus === "waiting_for_approval" ||
      episode.snapshot.state === "waiting_for_approval" ||
      episode.snapshot.completedBrains.includes("validation")
    );
  }
  return episode.snapshot.completedBrains.includes("planning");
}

/** Whether automatic campaign lifecycle should resume after a bounded strategy target run. */
export function shouldAutoContinueCampaignEpisode(input: {
  project: MarketingProject;
  episodeResult: EpisodeRunResult;
}): boolean {
  if (!usesProjectEngineLifecycleAuthority(input.project)) return false;

  const episode = input.episodeResult.episode;
  const approvalMode = resolveApprovalMode(input.project, episode);

  if (approvalMode === "approval_before_generation" || approvalMode === "blocked_manual_only") {
    return false;
  }

  if (input.episodeResult.status === "waiting_for_context") return false;
  if (episode.episodeStatus !== "running") return false;
  if (!episode.snapshot.completedBrains.includes("strategy")) return false;
  if (postStrategyPipelineComplete(episode, approvalMode)) return false;
  if ((episode.snapshot.pendingBrains?.length ?? 0) === 0) {
    return false;
  }

  return true;
}

export function evaluateCampaignEpisodeContinuation(input: {
  project: MarketingProject;
  episode: ProjectEpisodeRecord;
}): { eligible: true } | { eligible: false; reason: ContinueCampaignEpisodeSkipReason } {
  if (!usesProjectEngineLifecycleAuthority(input.project)) {
    return { eligible: false, reason: "not_automatic" };
  }

  const approvalMode = resolveApprovalMode(input.project, input.episode);

  if (approvalMode === "approval_before_generation" || approvalMode === "blocked_manual_only") {
    return { eligible: false, reason: "guided_checkpoint_mode" };
  }

  if (input.episode.episodeStatus === "waiting_for_context") {
    return { eligible: false, reason: "waiting_for_context" };
  }
  if (input.episode.episodeStatus === "waiting_for_approval") {
    return { eligible: false, reason: "waiting_for_approval" };
  }
  if (input.episode.episodeStatus !== "running") {
    return { eligible: false, reason: "episode_not_running" };
  }
  if (!input.episode.snapshot.completedBrains.includes("strategy")) {
    return { eligible: false, reason: "strategy_incomplete" };
  }
  if (postStrategyPipelineComplete(input.episode, approvalMode)) {
    return { eligible: false, reason: "already_continued" };
  }
  if (input.episode.snapshot.pendingBrains?.length === 0) {
    return { eligible: false, reason: "pipeline_complete" };
  }

  return { eligible: true };
}

function toCampaignEpisodeResult(
  result: EpisodeRunResult,
  episodeResumed: boolean
): CampaignEpisodeResult {
  return {
    ...result,
    orchestrationAuthority: "project_engine",
    episodeResumed,
    strategyCapabilityRun: null,
    blockingContextGaps: result.missingContext.filter((gap) => gap.blocking),
  };
}

function emitContinuationDiagnostic(
  event:
    | "episode_continuation_requested"
    | "episode_continuation_started"
    | "episode_continuation_completed"
    | "episode_continuation_skipped",
  input: {
    organizationId: string;
    projectId: string;
    peerId: string;
    episode: ProjectEpisodeRecord;
    trigger: EpisodeContinuationTrigger;
    reason?: string;
    durationMs?: number;
  }
): void {
  emitOrchestrationDiagnostic({
    event,
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    episodeId: input.episode.snapshot.episodeId,
    snapshotState: input.episode.snapshot.state,
    episodeStatus: input.episode.episodeStatus,
    durableVersion: input.episode.durableVersion,
    reason: input.reason,
    correlationId: input.trigger,
    ...(input.durationMs !== undefined ? { step: input.durationMs } : {}),
  });
}

async function executeCampaignEpisodeContinuation(
  input: ContinueCampaignEpisodeInput
): Promise<CampaignEpisodeResult> {
  const startedAt = Date.now();
  const locale = input.locale ?? "en";

  assertLiveBrainServerContext({ peerId: input.peerId, supabase: input.supabase });

  await prepareBrainServerPersistence({
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
  });

  const episode =
    input.episodeResult?.episode ??
    getDefaultProjectEpisodeRepository().get({
      organizationId: input.organizationId,
      projectId: input.projectId,
    });

  if (!episode) {
    emitOrchestrationDiagnostic({
      event: "episode_continuation_skipped",
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      reason: "episode_not_found",
      correlationId: input.trigger,
    });
    throw new Error(`Episode not found for continuation: ${input.projectId}`);
  }

  emitContinuationDiagnostic("episode_continuation_requested", {
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    episode,
    trigger: input.trigger,
  });

  const eligibility = evaluateCampaignEpisodeContinuation({
    project: input.project,
    episode,
  });

  if (!eligibility.eligible) {
    emitContinuationDiagnostic("episode_continuation_skipped", {
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      episode,
      trigger: input.trigger,
      reason: eligibility.reason,
    });
    return toCampaignEpisodeResult(
      {
        episode,
        status: episode.episodeStatus,
        missingContext: episode.contextGaps,
        reason: eligibility.reason,
        events: [],
        observability: {
          episodeId: episode.snapshot.episodeId,
          organizationId: episode.snapshot.organizationId,
          projectId: episode.snapshot.projectId,
          peerId: episode.snapshot.peerId,
          correlationId: episode.correlationId,
          currentProjectState: episode.snapshot.state,
          currentBrain: null,
          startedAt: episode.startedAt,
          updatedAt: episode.updatedAt,
          completedAt: episode.completedAt,
          brainOutputRefs: {},
          eventCount: 0,
          approvalState: episode.snapshot.approvalCheckpoint?.satisfied ? "satisfied" : "none",
          observationState: episode.performanceObservationsAvailable ? "available" : "none",
          lastError: episode.lastError,
        },
      },
      true
    );
  }

  emitContinuationDiagnostic("episode_continuation_started", {
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    episode,
    trigger: input.trigger,
  });

  const approvalMode = resolveApprovalMode(input.project, episode);
  const adapter = createProductionBrainExecutionAdapter({
    peerId: input.peerId,
    project: input.project,
    domainInput: input.domainInput,
    workflowOptions: {
      requireRealContext: true,
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
    maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: approvalMode }),
  });

  emitContinuationDiagnostic("episode_continuation_completed", {
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    episode: result.episode,
    trigger: input.trigger,
    durationMs: Date.now() - startedAt,
  });

  return toCampaignEpisodeResult(result, true);
}

/**
 * PX-50.24 — resume automatic campaign pipeline after a bounded strategy target run.
 *
 * Canonical continuation owner for Project Engine lifecycle authority.
 */
export async function continueCampaignEpisode(
  input: ContinueCampaignEpisodeInput
): Promise<CampaignEpisodeResult> {
  const key = continuationKey(input.organizationId, input.projectId);
  const inflight = inFlightByKey.get(key);
  if (inflight) {
    emitOrchestrationDiagnostic({
      event: "episode_continuation_skipped",
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      reason: "duplicate_invocation",
      correlationId: input.trigger,
    });
    return inflight;
  }

  const promise = executeCampaignEpisodeContinuation(input).finally(() => {
    inFlightByKey.delete(key);
  });

  inFlightByKey.set(key, promise);
  return promise;
}

export function resetCampaignEpisodeContinuationInFlightForTests(): void {
  inFlightByKey.clear();
}
