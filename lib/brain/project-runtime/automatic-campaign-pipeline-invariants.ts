/**
 * PX-51 / PX-54 — reusable invariants for automatic campaign pipeline health.
 */

import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import { requiresPublicationApproval } from "../policy/campaign-approval-policy";
import type { ProjectBrainId, ProjectLifecycleState } from "../project-engine/types";
import type { EpisodeStatus, ProjectEpisodeRecord } from "./types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { usesProjectEngineLifecycleAuthority } from "@/lib/office/campaign/live-strategy-run-service";
import { needsPostApprovalExecution } from "../approval/approved-execution-handoff";

export type AutomaticCampaignPipelinePhase =
  | "not_started"
  | "strategy"
  | "planning"
  | "creative"
  | "validation"
  | "memory"
  | "publication_approval"
  | "execution"
  | "complete"
  | "failed"
  | "waiting_for_context";

export type OrchestrationStallReason =
  | `cognitive_pipeline_incomplete:${ProjectBrainId}`
  | "ORCHESTRATION_STALL_VALIDATION_NOT_STARTED"
  | "ORCHESTRATION_STALL_CREATIVE_NOT_STARTED"
  | "ORCHESTRATION_STALL_MEMORY_CHECKPOINT_NOT_STARTED"
  | "full_autonomy_pipeline_incomplete"
  | string;

export type AutomaticCampaignPipelineStall = {
  stalled: true;
  phase: AutomaticCampaignPipelinePhase;
  reason: OrchestrationStallReason;
  episodeStatus: EpisodeStatus;
  currentState: ProjectLifecycleState;
  completedBrains: readonly ProjectBrainId[];
  pendingBrains: readonly ProjectBrainId[];
  approvalCheckpoint: string | null;
};

export type AutomaticCampaignPipelineHealth =
  | { healthy: true; phase: AutomaticCampaignPipelinePhase }
  | AutomaticCampaignPipelineStall;

const COGNITIVE_POST_STRATEGY: readonly ProjectBrainId[] = [
  "planning",
  "creative",
  "validation",
];

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

function inferPhase(episode: ProjectEpisodeRecord): AutomaticCampaignPipelinePhase {
  const { snapshot, episodeStatus } = episode;
  if (episodeStatus === "failed") return "failed";
  if (episodeStatus === "waiting_for_context") return "waiting_for_context";
  if (episodeStatus === "completed") return "complete";
  if (episodeStatus === "waiting_for_approval" || snapshot.state === "waiting_for_approval") {
    return "publication_approval";
  }
  if (snapshot.completedBrains.includes("execution")) return "execution";
  if (
    episode.approvalGrantedForExecution &&
    (snapshot.state === "ready_to_publish" || snapshot.state === "publishing")
  ) {
    return "execution";
  }
  if (snapshot.completedBrains.includes("validation")) return "validation";
  if (
    snapshot.state === "validating" &&
    snapshot.completedBrains.includes("creative") &&
    !snapshot.completedBrains.includes("validation")
  ) {
    return "validation";
  }
  if (
    snapshot.state === "generating" &&
    snapshot.completedBrains.includes("planning") &&
    !snapshot.completedBrains.includes("creative")
  ) {
    return "creative";
  }
  if (snapshot.completedBrains.includes("creative")) return "creative";
  if (snapshot.completedBrains.includes("planning")) return "planning";
  if (snapshot.completedBrains.includes("strategy")) return "planning";
  if (snapshot.completedBrains.length > 0) return "strategy";
  return "not_started";
}

function detectOrchestrationStallReason(
  episode: ProjectEpisodeRecord
): OrchestrationStallReason | null {
  const { snapshot } = episode;
  const pending = snapshot.pendingBrains ?? [];

  if (
    snapshot.state === "validating" &&
    snapshot.completedBrains.includes("creative") &&
    !snapshot.completedBrains.includes("validation") &&
    pending.includes("validation") &&
    snapshot.activeBrain == null &&
    !snapshot.approvalCheckpoint &&
    !snapshot.waitingReason
  ) {
    return "ORCHESTRATION_STALL_VALIDATION_NOT_STARTED";
  }

  if (
    snapshot.state === "generating" &&
    snapshot.completedBrains.includes("planning") &&
    !snapshot.completedBrains.includes("creative") &&
    pending.includes("creative") &&
    snapshot.activeBrain == null
  ) {
    return "ORCHESTRATION_STALL_CREATIVE_NOT_STARTED";
  }

  if (
    snapshot.state === "validating" &&
    snapshot.completedBrains.includes("validation") &&
    !episode.memoryCheckpoint1Complete &&
    pending.includes("memory")
  ) {
    return "ORCHESTRATION_STALL_MEMORY_CHECKPOINT_NOT_STARTED";
  }

  if (
    episode.approvalGrantedForExecution &&
    episode.snapshot.approvalCheckpoint?.satisfied === true &&
    (snapshot.state === "ready_to_publish" || snapshot.state === "publishing") &&
    pending.includes("execution") &&
    !snapshot.completedBrains.includes("execution") &&
    snapshot.activeBrain == null &&
    episode.episodeStatus === "running"
  ) {
    return "ORCHESTRATION_STALL_EXECUTION_NOT_STARTED";
  }

  const nextExpected = COGNITIVE_POST_STRATEGY.find(
    (brain) => !snapshot.completedBrains.includes(brain)
  );
  if (nextExpected && pending.includes(nextExpected)) {
    return `cognitive_pipeline_incomplete:${nextExpected}`;
  }

  return null;
}

/** Detect orchestration stall — e.g. running/planning with strategy done but planning never ran. */
export function detectAutomaticCampaignPipelineStall(input: {
  project: MarketingProject;
  episode: ProjectEpisodeRecord | null;
}): AutomaticCampaignPipelineStall | null {
  if (!usesProjectEngineLifecycleAuthority(input.project)) return null;
  if (!input.episode) return null;

  const episode = input.episode;
  const approvalMode = resolveApprovalMode(input.project, episode);
  const phase = inferPhase(episode);

  if (approvalMode === "approval_before_generation" || approvalMode === "blocked_manual_only") {
    return null;
  }

  if (episode.episodeStatus === "failed" || episode.lastError) {
    return {
      stalled: true,
      phase: "failed",
      reason: episode.lastError ?? "episode_failed",
      episodeStatus: episode.episodeStatus,
      currentState: episode.snapshot.state,
      completedBrains: episode.snapshot.completedBrains,
      pendingBrains: episode.snapshot.pendingBrains,
      approvalCheckpoint: episode.snapshot.approvalCheckpoint?.kind ?? null,
    };
  }

  if (episode.episodeStatus === "waiting_for_context") {
    return null;
  }

  if (
    episode.episodeStatus === "waiting_for_approval" ||
    episode.snapshot.state === "waiting_for_approval"
  ) {
    return null;
  }

  if (episode.episodeStatus === "completed") return null;

  const strategyDone = episode.snapshot.completedBrains.includes("strategy");
  if (!strategyDone) return null;

  if (requiresPublicationApproval(approvalMode)) {
    const cognitiveComplete = COGNITIVE_POST_STRATEGY.every((brain) =>
      episode.snapshot.completedBrains.includes(brain)
    );
    if (cognitiveComplete && episode.memoryCheckpoint1Complete) {
      if (needsPostApprovalExecution(episode)) {
        if (episode.episodeStatus === "running") {
          const orchestrationReason = detectOrchestrationStallReason(episode);
          if (orchestrationReason) {
            return {
              stalled: true,
              phase,
              reason: orchestrationReason,
              episodeStatus: episode.episodeStatus,
              currentState: episode.snapshot.state,
              completedBrains: episode.snapshot.completedBrains,
              pendingBrains: episode.snapshot.pendingBrains,
              approvalCheckpoint: episode.snapshot.approvalCheckpoint?.kind ?? null,
            };
          }
        }
      }
      return null;
    }

    if (episode.episodeStatus === "running") {
      const orchestrationReason = detectOrchestrationStallReason(episode);
      if (orchestrationReason) {
        return {
          stalled: true,
          phase,
          reason: orchestrationReason,
          episodeStatus: episode.episodeStatus,
          currentState: episode.snapshot.state,
          completedBrains: episode.snapshot.completedBrains,
          pendingBrains: episode.snapshot.pendingBrains,
          approvalCheckpoint: episode.snapshot.approvalCheckpoint?.kind ?? null,
        };
      }
    }
  }

  if (approvalMode === "no_approval_required" && episode.episodeStatus === "running") {
    const hasPending = (episode.snapshot.pendingBrains?.length ?? 0) > 0;
    if (hasPending && !episode.snapshot.completedBrains.includes("execution")) {
      return {
        stalled: true,
        phase,
        reason: "full_autonomy_pipeline_incomplete",
        episodeStatus: episode.episodeStatus,
        currentState: episode.snapshot.state,
        completedBrains: episode.snapshot.completedBrains,
        pendingBrains: episode.snapshot.pendingBrains,
        approvalCheckpoint: episode.snapshot.approvalCheckpoint?.kind ?? null,
      };
    }
  }

  return null;
}

export function assertAutomaticCampaignReachedPublicationBoundary(input: {
  project: MarketingProject;
  episode: ProjectEpisodeRecord;
}): void {
  const approvalMode = resolveApprovalMode(input.project, input.episode);
  if (!requiresPublicationApproval(approvalMode)) {
    throw new Error(
      `assertAutomaticCampaignReachedPublicationBoundary requires approval_before_publication mode (got ${approvalMode}).`
    );
  }

  const stall = detectAutomaticCampaignPipelineStall(input);
  if (stall) {
    throw new Error(
      `Automatic campaign pipeline stalled at ${stall.phase}: ${stall.reason} ` +
        `(episode_status=${stall.episodeStatus}, current_state=${stall.currentState}, ` +
        `completed=[${stall.completedBrains.join(",")}], pending=[${stall.pendingBrains.join(",")}])`
    );
  }

  const atBoundary =
    input.episode.episodeStatus === "waiting_for_approval" ||
    input.episode.snapshot.state === "waiting_for_approval";

  if (!atBoundary) {
    throw new Error(
      `Expected publication approval boundary but episode is ${input.episode.episodeStatus}/${input.episode.snapshot.state}.`
    );
  }
}

export function shouldResumeAutomaticCampaignPipeline(input: {
  project: MarketingProject;
  episode: ProjectEpisodeRecord | null;
}): boolean {
  return detectAutomaticCampaignPipelineStall(input) != null;
}

/** PX-61 — episode at an intentional wait boundary; mount recovery must not treat as stall. */
export function isEpisodeAtHealthyRuntimeBoundary(episode: ProjectEpisodeRecord): boolean {
  if (episode.episodeStatus === "waiting_for_outcomes") return true;
  if (episode.episodeStatus === "waiting_for_approval") return true;
  if (episode.episodeStatus === "completed") return true;
  if (episode.snapshot.state === "monitoring") return true;
  if (episode.snapshot.state === "learning") return true;
  if (episode.snapshot.state === "complete") return true;
  return false;
}
