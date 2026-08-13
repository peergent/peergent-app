/**
 * PX-49 — structured context acquisition diagnostics (internal).
 */

export type ContextDiagnosticEvent =
  | "context_acquisition_started"
  | "context_source_completed"
  | "context_source_failed"
  | "context_gap_detected"
  | "context_acquisition_completed"
  | "context_acquisition_tail_started"
  | "context_acquisition_brand_graph_started"
  | "context_acquisition_brand_graph_completed"
  | "context_acquisition_memories_load_started"
  | "context_acquisition_memories_load_completed"
  | "context_acquisition_package_returning";

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
  brandGraphBuilt?: boolean;
  memoryCount?: number;
  contextReady?: boolean;
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
