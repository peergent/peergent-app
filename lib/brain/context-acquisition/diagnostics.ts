/**
 * PX-49 — structured context acquisition diagnostics (internal).
 */

export type ContextDiagnosticEvent =
  | "context_acquisition_started"
  | "context_source_completed"
  | "context_source_failed"
  | "context_gap_detected"
  | "context_acquisition_completed";

export type ContextDiagnosticPayload = {
  event: ContextDiagnosticEvent;
  organizationId?: string;
  projectId?: string;
  peerId?: string;
  sourceAdapterId?: string;
  itemCount?: number;
  gapCount?: number;
  blockingGapCount?: number;
  durationMs?: number;
  failureCode?: string;
  message?: string;
};

export function emitContextDiagnostic(payload: ContextDiagnosticPayload): void {
  if (process.env.BRAIN_CONTEXT_DIAGNOSTICS === "0") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    domain: "brain_context",
    ...payload,
  });
  if (payload.event.includes("failed") || payload.event === "context_gap_detected") {
    console.error(line);
    return;
  }
  console.info(line);
}
