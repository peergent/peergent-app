/**
 * PX-60 — explicit runner stop reasons for autonomous episode continuation.
 */

import type { ProjectBrainId, ProjectLifecycleState } from "../project-engine/types";
import type { EpisodeLoopExit } from "./episode-step-budget";
import type { EpisodeStatus, ProjectEpisodeRecord } from "./types";

export type EpisodeRunnerStopReason =
  | "waiting_for_human_approval"
  | "waiting_for_context"
  | "waiting_for_external_outcomes"
  | "integration_blocked"
  | "terminal_complete"
  | "terminal_failed"
  | "retry_backoff"
  | "target_brain_reached"
  | "target_state_reached"
  | "max_iterations_guard"
  | "stale_loop_guard"
  | "already_terminal";

export function mapLoopExitToStopReason(
  exit: EpisodeLoopExit,
  episode: ProjectEpisodeRecord
): EpisodeRunnerStopReason {
  switch (exit.kind) {
    case "target_brain_reached":
      return "target_brain_reached";
    case "target_state_reached":
      return "target_state_reached";
    case "completed":
      return "terminal_complete";
    case "brain_failed":
      return episode.snapshot.state === "failed" ? "retry_backoff" : "terminal_failed";
    case "max_steps_exceeded":
      return "max_iterations_guard";
    case "stale_loop":
      return "stale_loop_guard";
    case "already_terminal":
      return "already_terminal";
    default:
      return "terminal_failed";
  }
}

export function mapPauseStatusToStopReason(status: EpisodeStatus): EpisodeRunnerStopReason {
  switch (status) {
    case "waiting_for_approval":
      return "waiting_for_human_approval";
    case "waiting_for_context":
      return "waiting_for_context";
    case "waiting_for_outcomes":
      return "waiting_for_external_outcomes";
    case "completed":
      return "terminal_complete";
    case "failed":
      return "terminal_failed";
    default:
      return "terminal_failed";
  }
}

export type EpisodeRunnerBlockedDiagnostic = {
  stopReason: EpisodeRunnerStopReason;
  currentState: ProjectLifecycleState;
  episodeStatus: EpisodeStatus;
  pendingBrains: readonly ProjectBrainId[];
  activeBrain: ProjectBrainId | null;
  checkpointKind: string | null;
  checkpointSatisfied: boolean;
};

export function buildRunnerBlockedDiagnostic(
  episode: ProjectEpisodeRecord,
  stopReason: EpisodeRunnerStopReason
): EpisodeRunnerBlockedDiagnostic {
  return {
    stopReason,
    currentState: episode.snapshot.state,
    episodeStatus: episode.episodeStatus,
    pendingBrains: episode.snapshot.pendingBrains ?? [],
    activeBrain: episode.snapshot.activeBrain,
    checkpointKind: episode.snapshot.approvalCheckpoint?.kind ?? null,
    checkpointSatisfied: episode.snapshot.approvalCheckpoint?.satisfied ?? false,
  };
}
