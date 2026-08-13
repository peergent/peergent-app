/** Supabase table names for BrainRuntime async persistence (PX-50.6). */
export const BRAIN_RUNTIME_PERSISTENCE_TABLES = {
  runs: "brain_runs",
  idempotency: "brain_idempotency_keys",
  outputs: "brain_outputs",
  audit: "brain_audit_events",
} as const;

export type BrainRuntimePersistenceTable =
  (typeof BRAIN_RUNTIME_PERSISTENCE_TABLES)[keyof typeof BRAIN_RUNTIME_PERSISTENCE_TABLES];
