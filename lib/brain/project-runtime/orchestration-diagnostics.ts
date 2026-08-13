/**
 * PX-50 — production orchestration diagnostics (internal, no customer context).
 */

import type { ProjectBrainId } from "../project-engine/types";
import type { EpisodeStatus } from "./types";

export type OrchestrationDiagnosticEvent =
  | "episode_started"
  | "episode_resumed"
  | "project_engine_evaluated"
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
  reason?: string;
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
