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
  | "episode_context_acquired"
  | "episode_loop_entering"
  | "episode_loop_terminal_break"
  | "project_engine_evaluation_started"
  | "project_engine_evaluated"
  | "project_engine_context_blocked"
  | "project_engine_action_selected"
  | "brain_scheduled"
  | "brain_completed"
  | "episode_paused"
  | "context_gap_blocked"
  | "episode_target_reached";

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
  contextReady?: boolean;
  contextGapCount?: number;
  blockingContextGapCount?: number;
  sliceAvailability?: Partial<BrainContextSlices>;
  maxSteps?: number;
};

export function emitOrchestrationDiagnostic(payload: OrchestrationDiagnosticPayload): void {
  if (process.env.BRAIN_ORCHESTRATION_DIAGNOSTICS === "0") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    domain: "brain_orchestration",
    ...payload,
  });
  if (payload.event === "context_gap_blocked" || payload.event === "episode_paused") {
    console.info(line);
    return;
  }
  console.info(line);
}
