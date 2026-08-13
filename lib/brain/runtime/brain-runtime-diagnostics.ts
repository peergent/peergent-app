/**
 * PX-50.3 — BrainRuntime execution boundary diagnostics.
 *
 * Domain: `brain_runtime` (distinct from `brain_orchestration` episode/engine events).
 * Gated by BRAIN_ORCHESTRATION_DIAGNOSTICS !== "0" (same switch as orchestration logs).
 * Never logs customer payloads, prompts, or raw capability output.
 */

import type { BrainCapabilityId } from "../capabilities/registry";
import type { ProjectBrainId } from "../project-engine/types";

export type BrainRuntimeDiagnosticEvent =
  | "brain_execution_adapter_started"
  | "brain_execution_execute_project_brain_started"
  | "brain_execution_execute_project_brain_completed"
  | "brain_execution_execute_project_brain_failed"
  | "brain_runtime_execute_started"
  | "brain_runtime_submit_started"
  | "brain_runtime_idempotency_lookup_started"
  | "brain_runtime_idempotency_lookup_completed"
  | "brain_runtime_idempotency_lookup_failed"
  | "brain_runtime_run_create_started"
  | "brain_runtime_run_create_completed"
  | "brain_runtime_run_create_failed"
  | "brain_runtime_context_assembly_started"
  | "brain_runtime_context_assembly_completed"
  | "brain_runtime_provider_started"
  | "brain_runtime_provider_completed"
  | "brain_runtime_provider_failed"
  | "brain_runtime_output_store_started"
  | "brain_runtime_output_store_completed"
  | "brain_runtime_output_store_failed"
  | "brain_runtime_completed";

export type BrainRuntimeDiagnosticPayload = {
  event: BrainRuntimeDiagnosticEvent;
  organizationId: string;
  projectId?: string;
  brainId?: ProjectBrainId | null;
  capabilityId?: BrainCapabilityId | string;
  episodeId?: string;
  correlationId?: string;
  runId?: string;
  runIdIsUuid?: boolean;
  providerId?: string;
  errorName?: string;
  errorCode?: string;
  reason?: string;
  durationMs?: number;
};

const UUID_RUN_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Whether a run id matches RFC-4122 uuid syntax (observability for Supabase schema alignment). */
export function isUuidRunId(runId: string): boolean {
  return UUID_RUN_ID.test(runId);
}

export function safeBrainRuntimeError(error: unknown): {
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

export function emitBrainRuntimeDiagnostic(payload: BrainRuntimeDiagnosticPayload): void {
  if (process.env.BRAIN_ORCHESTRATION_DIAGNOSTICS === "0") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    domain: "brain_runtime",
    ...payload,
  });
  if (payload.event.endsWith("_failed")) {
    console.error(line);
    return;
  }
  console.info(line);
}
