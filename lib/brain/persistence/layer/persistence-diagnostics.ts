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
  | "execution_outcome_ambiguous"
  | "episode_commit_critical_entered"
  | "episode_commit_critical_completed"
  | "episode_commit_critical_failed"
  | "episode_commit_sync_brain_docs_started"
  | "episode_commit_sync_brain_docs_completed"
  | "episode_commit_sync_brain_docs_failed"
  | "episode_commit_persist_started"
  | "episode_commit_persist_completed"
  | "episode_commit_persist_failed"
  | "persistence_episode_upsert_started"
  | "persistence_episode_upsert_completed"
  | "persistence_episode_upsert_failed"
  | "persistence_episode_hydration_observed"
  | "persistence_layer_repository_reconfigured"
  | "persistence_layer_document_upsert_started"
  | "persistence_layer_document_upsert_completed"
  | "persistence_layer_document_upsert_failed"
  | "persistence_org_memory_upsert_started"
  | "persistence_org_memory_upsert_completed"
  | "persistence_org_memory_upsert_failed"
  | "episode_version_state_before_commit"
  | "episode_version_state_after_commit"
  | "episode_version_cache_write"
  | "episode_version_conflict_reload_state"
  | "persistence_episode_rpc_request_started"
  | "persistence_episode_rpc_request_returned"
  | "persistence_episode_rpc_request_timeout"
  | "persistence_episode_rpc_lock_probe_started"
  | "persistence_episode_rpc_lock_probe_completed"
  | "final_commit_payload_metrics";

export type PersistenceDiagnosticPayload = {
  event: PersistenceDiagnosticEvent;
  organizationId?: string;
  projectId?: string;
  episodeId?: string;
  brainId?: string;
  outputRef?: string;
  idempotencyKey?: string;
  expectedVersion?: number;
  actualVersion?: number;
  newVersion?: number;
  message?: string;
  reason?: string;
  errorName?: string;
  errorCode?: string;
  operation?: string;
  documentKind?: string;
  syncBrainDocs?: boolean;
  durationMs?: number;
  memoryCount?: number;
  dbVersion?: number;
  hydratedDurableVersion?: number;
  episodeRowFound?: boolean;
  repositoryGeneration?: number;
  step?: string;
  source?: string;
  durableVersion?: number;
  episodeStatus?: string;
  snapshotState?: string;
  activeBrain?: string | null;
  artifactCount?: number;
  resolvedGraphCount?: number;
  cachedLearningProposalCount?: number;
  payloadBytes?: number;
  episodeJsonBytes?: number;
  artifactsJsonBytes?: number;
  resolvedGraphsJsonBytes?: number;
  completedAt?: string | null;
  hasLastError?: boolean;
};

export function safePersistenceError(error: unknown): {
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

export function emitPersistenceDiagnostic(payload: PersistenceDiagnosticPayload): void {
  if (process.env.BRAIN_PERSISTENCE_DIAGNOSTICS === "0") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    domain: "brain_persistence",
    ...payload,
  });
  if (payload.event.endsWith("_failed") || payload.event.includes("conflict") || payload.event.includes("missing") || payload.event.includes("timeout")) {
    console.error(line);
    return;
  }
  console.info(line);
}
