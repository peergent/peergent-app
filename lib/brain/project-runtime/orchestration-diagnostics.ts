/**
 * PX-50 — production orchestration diagnostics (internal, no customer context).
 */

import type { BrainContextSlices } from "../project-engine/brain-contract";
import type { ProjectBrainId, ProjectLifecycleState } from "../project-engine/types";
import type { EpisodeStatus } from "./types";

export type OrchestrationDiagnosticEvent =
  | "automatic_campaign_started"
  | "episode_started"
  | "episode_resumed"
  | "episode_context_acquire_call_started"
  | "episode_context_acquire_failed"
  | "episode_context_acquired"
  | "episode_context_brain_package_received"
  | "episode_context_snapshot_resolved"
  | "episode_context_returning"
  | "episode_start_context_acquire_call_started"
  | "episode_start_context_acquire_returned"
  | "episode_start_commit_started"
  | "episode_start_commit_completed"
  | "episode_loop_entering"
  | "episode_loop_terminal_break"
  | "episode_loop_stale_detected"
  | "project_engine_evaluation_started"
  | "project_engine_evaluated"
  | "project_engine_context_blocked"
  | "project_engine_action_selected"
  | "brain_scheduled"
  | "brain_completed"
  | "episode_paused"
  | "context_gap_blocked"
  | "episode_target_reached"
  | "runner_episode_lookup_started"
  | "runner_episode_lookup_completed"
  | "episode_start_invoked"
  | "episode_conflict_reload"
  | "automatic_campaign_execution_invoked"
  | "episode_runner_brain_failure_persisted"
  | "episode_runner_brain_waiting_for_context"
  | "episode_continuation_requested"
  | "episode_continuation_started"
  | "episode_continuation_completed"
  | "episode_continuation_skipped"
  | "episode_continuation_failed"
  | "campaign_pipeline_recovery_started"
  | "campaign_pipeline_recovery_completed"
  | "campaign_episode_started"
  | "approval_checkpoint_created"
  | "approval_submitted"
  | "episode_resume_started"
  | "episode_resume_completed"
  | "external_execution_authorized"
  | "episode_terminal_state";

export type OrchestrationDiagnosticPayload = {
  event: OrchestrationDiagnosticEvent;
  organizationId: string;
  projectId: string;
  peerId?: string;
  episodeId?: string;
  brainId?: ProjectBrainId | null;
  actionKind?: string;
  episodeStatus?: EpisodeStatus;
  snapshotState?: ProjectLifecycleState;
  reason?: string;
  step?: number;
  staleIterations?: number;
  contextReady?: boolean;
  contextGapCount?: number;
  blockingContextGapCount?: number;
  sliceAvailability?: Partial<BrainContextSlices>;
  maxSteps?: number;
  errorName?: string;
  errorCode?: string;
  hasCompanySnapshot?: boolean;
  caller?: "start_episode" | "run_until_pause";
  found?: boolean;
  source?: "l1_cache" | "durable" | "none";
  durableVersion?: number;
  correlationId?: string;
  initialDurableVersion?: number;
  actualVersion?: number;
  readinessReasonCodes?: readonly string[];
};

export function safeOrchestrationError(error: unknown): {
  errorName: string;
  errorCode?: string;
  reason?: string;
} {
  if (error instanceof Error) {
    const code =
      "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;
    return {
      errorName: error.name,
      errorCode: code,
      reason: error.message.slice(0, 120),
    };
  }
  return {
    errorName: "UnknownError",
    reason: String(error).slice(0, 120),
  };
}

export function emitOrchestrationDiagnostic(payload: OrchestrationDiagnosticPayload): void {
  if (process.env.BRAIN_ORCHESTRATION_DIAGNOSTICS === "0") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    domain: "brain_orchestration",
    ...payload,
  });
  if (
    payload.event === "context_gap_blocked" ||
    payload.event === "episode_paused" ||
    payload.event === "episode_context_acquire_failed"
  ) {
    console.info(line);
    return;
  }
  console.info(line);
}
