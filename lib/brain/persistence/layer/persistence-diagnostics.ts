/**
 * Internal persistence/runtime diagnostics — not customer-facing.
 */

export type PersistenceDiagnosticEvent =
  | "persistence_initialized"
  | "persistence_hydration_started"
  | "persistence_hydration_completed"
  | "persistence_hydration_failed"
  | "persistence_write_failed"
  | "persistence_conflict"
  | "output_ref_missing"
  | "execution_idempotency_conflict"
  | "execution_outcome_ambiguous";

export type PersistenceDiagnosticPayload = {
  event: PersistenceDiagnosticEvent;
  organizationId?: string;
  projectId?: string;
  brainId?: string;
  outputRef?: string;
  idempotencyKey?: string;
  expectedVersion?: number;
  actualVersion?: number;
  message?: string;
};

export function emitPersistenceDiagnostic(payload: PersistenceDiagnosticPayload): void {
  if (process.env.BRAIN_PERSISTENCE_DIAGNOSTICS === "0") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    domain: "brain_persistence",
    ...payload,
  });
  if (payload.event.endsWith("_failed") || payload.event.includes("conflict") || payload.event.includes("missing")) {
    console.error(line);
    return;
  }
  console.info(line);
}
