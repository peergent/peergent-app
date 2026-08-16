/**
 * PX-50.23 — Episode runner step budget derived from canonical pipeline topology.
 *
 * One loop iteration = one evaluateProjectEpisode cycle (brain run, idle advance,
 * publish prep, approval wait evaluation, or persistence boundary).
 */

import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import {
  DEFAULT_BRAIN_PIPELINE,
  type ProjectBrainId,
  type ProjectLifecycleState,
} from "../project-engine/types";
import type { ProjectEpisodeRecord } from "./types";
/** Brains that run before the DEFAULT_BRAIN_PIPELINE research phase. */
export const EPISODE_BOOTSTRAP_BRAINS: readonly ProjectBrainId[] = ["company"];

/** Canonical autonomous brain order (company precedes pipeline). */
export const EPISODE_AUTONOMOUS_BRAIN_ORDER: readonly ProjectBrainId[] = [
  ...EPISODE_BOOTSTRAP_BRAINS,
  ...DEFAULT_BRAIN_PIPELINE,
];

/**
 * Longest legitimate autonomous path includes memory twice (validation + learning passes).
 * See evaluate-project validating/learning memory checkpoints.
 */
const MEMORY_PASSES = 2;

/** Orchestration overhead iterations per brain (evaluate + idle/publish prep). */
const RUNNER_OVERHEAD_PER_BRAIN = 2;

/** Non-brain transitions: context ready, publish state prep, approval evaluation, etc. */
const BASE_TRANSITION_BUDGET = 8;

/** Dependency resolution may consume multiple loop iterations per brain. */
const DEPENDENCY_RESOLUTION_OVERHEAD = 12;

/** Bounded safety margin — not an arbitrary cap replacement. */
const SAFETY_MARGIN = 6 + DEPENDENCY_RESOLUTION_OVERHEAD;

/** Iterations without snapshot progress before stale-loop protection fires. */
export const MAX_STALE_LOOP_ITERATIONS = 8;

export type EpisodeLoopExitKind =
  | "target_brain_reached"
  | "target_state_reached"
  | "completed"
  | "brain_failed"
  | "max_steps_exceeded"
  | "stale_loop"
  | "already_terminal";

export type EpisodeLoopExit =
  | { kind: "target_brain_reached"; brainId: ProjectBrainId }
  | { kind: "target_state_reached"; state: ProjectLifecycleState }
  | { kind: "completed" }
  | { kind: "brain_failed"; errorCode: string | null }
  | { kind: "max_steps_exceeded" }
  | { kind: "stale_loop" }
  | { kind: "already_terminal" };

function brainsThroughTarget(targetBrain: ProjectBrainId): number {
  const index = EPISODE_AUTONOMOUS_BRAIN_ORDER.indexOf(targetBrain);
  return index >= 0 ? index + 1 : EPISODE_AUTONOMOUS_BRAIN_ORDER.length;
}

function maxAutonomousBrainExecutions(mode: CampaignApprovalMode): number {
  const pipelineLength = EPISODE_AUTONOMOUS_BRAIN_ORDER.length + (MEMORY_PASSES - 1);
  switch (mode) {
    case "blocked_manual_only":
      return EPISODE_BOOTSTRAP_BRAINS.length;
    case "approval_before_generation":
      // Guided — may pause before planning/creative; budget through strategy + margin
      return brainsThroughTarget("strategy");
    case "no_approval_required":
      return pipelineLength;
    case "approval_before_publication":
    default:
      // Through validation + memory checkpoint; publication approval pauses runner
      return brainsThroughTarget("validation") + 1; // +1 for post-validation memory
  }
}

/** Derive step budget from canonical state-machine topology + bounded margin. */
export function resolveEpisodeStepBudget(input?: {
  campaignApprovalMode?: CampaignApprovalMode;
  targetBrain?: ProjectBrainId | null;
  /** Explicit override — used only in tests or bounded partial runs. */
  maxSteps?: number;
}): number {
  if (input?.maxSteps !== undefined) return input.maxSteps;

  const mode = input?.campaignApprovalMode ?? "approval_before_publication";

  if (input?.targetBrain) {
    const through = brainsThroughTarget(input.targetBrain);
    return BASE_TRANSITION_BUDGET + through * RUNNER_OVERHEAD_PER_BRAIN + SAFETY_MARGIN;
  }

  const brainExecutions = maxAutonomousBrainExecutions(mode);
  const executionExtra = mode === "no_approval_required" ? RUNNER_OVERHEAD_PER_BRAIN * 2 : 0;

  return (
    BASE_TRANSITION_BUDGET +
    brainExecutions * RUNNER_OVERHEAD_PER_BRAIN +
    executionExtra +
    SAFETY_MARGIN
  );
}

/** Privacy-safe progress fingerprint for stale-loop detection. */
export function snapshotProgressSignature(episode: ProjectEpisodeRecord): string {
  return [
    episode.snapshot.state,
    episode.snapshot.completedBrains.join("|"),
    episode.executedBrainKeys.length,
    episode.memoryCheckpoint1Complete ? "1" : "0",
    episode.memoryCheckpoint2Complete ? "1" : "0",
    episode.validationApprovalPending ? "1" : "0",
    episode.snapshot.approvalCheckpoint?.kind ?? "",
    episode.snapshot.approvalCheckpoint?.satisfied ? "1" : "0",
  ].join(":");
}

/** Derive step budget from episode pending work — avoids validation stall after creative. */
export function resolveEpisodeStepBudgetForEpisode(
  episode: ProjectEpisodeRecord,
  input?: {
    campaignApprovalMode?: CampaignApprovalMode;
    maxSteps?: number;
    targetBrain?: ProjectBrainId | null;
  }
): number {
  if (input?.maxSteps !== undefined) return input.maxSteps;

  const mode =
    input?.campaignApprovalMode ??
    episode.campaignApprovalMode ??
    "approval_before_publication";

  if (input?.targetBrain) {
    return resolveEpisodeStepBudget({ campaignApprovalMode: mode, targetBrain: input.targetBrain });
  }

  let budget = resolveEpisodeStepBudget({ campaignApprovalMode: mode });

  const pending = episode.snapshot.pendingBrains ?? [];
  const postCreativePending = pending.filter((brain) =>
    (["validation", "memory", "execution", "learning"] as ProjectBrainId[]).includes(brain)
  ).length;

  if (postCreativePending > 0) {
    budget += postCreativePending * RUNNER_OVERHEAD_PER_BRAIN * 3;
  }

  if (
    episode.snapshot.state === "validating" &&
    !episode.snapshot.completedBrains.includes("validation")
  ) {
    budget += RUNNER_OVERHEAD_PER_BRAIN * 4;
  }

  return budget;
}

export function isLegitimateRunnerPause(exit: EpisodeLoopExit | null): boolean {
  if (!exit) return false;
  return (
    exit.kind === "target_brain_reached" ||
    exit.kind === "target_state_reached" ||
    exit.kind === "completed" ||
    exit.kind === "already_terminal"
  );
}
