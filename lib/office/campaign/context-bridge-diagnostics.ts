/**
 * PX-61 — structured diagnostics for Office → durable context bridge (no customer content).
 */

export type ContextBridgeDiagnosticEvent =
  | "context_submission_requested"
  | "context_bridge_resolved"
  | "context_persistence_started"
  | "context_persistence_completed"
  | "context_persistence_failed"
  | "context_episode_not_waiting"
  | "context_resume_requested"
  | "context_resume_started"
  | "context_resume_completed"
  | "context_resume_failed"
  | "context_already_satisfied";

export type ContextBridgeDiagnosticPayload = {
  event: ContextBridgeDiagnosticEvent;
  organizationId: string;
  projectId: string;
  episodeId?: string;
  episodeVersion?: number;
  contextKind?: string;
  decision?: string;
  errorCode?: string;
  errorClass?: string;
  durationMs?: number;
  snapshotState?: string;
  episodeStatus?: string;
  durableVersion?: number;
  stopReason?: string;
};

export function safeContextBridgeError(error: unknown): {
  errorCode: string;
  errorClass: string;
} {
  if (error instanceof Error) {
    const code =
      "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : error.message.slice(0, 80);
    return { errorCode: code, errorClass: error.name };
  }
  return { errorCode: String(error).slice(0, 80), errorClass: "UnknownError" };
}

export function emitContextBridgeDiagnostic(payload: ContextBridgeDiagnosticPayload): void {
  if (process.env.BRAIN_PERSISTENCE_DIAGNOSTICS === "0") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    domain: "context_bridge",
    ...payload,
  });
  if (payload.event.includes("failed")) {
    console.error(line);
    return;
  }
  console.info(line);
}
