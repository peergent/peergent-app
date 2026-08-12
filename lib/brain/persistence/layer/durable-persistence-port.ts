/**
 * Durable persistence port — critical writes and hydration without Brain → Supabase coupling.
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { ProjectApprovalRecord, ProjectEpisodeRecord, ProjectRuntimeEvent } from "../../project-runtime/types";
import type { ExecutionStoreRecord } from "../../layers/execution/execution-repository";

export type ExecutionIdempotencyStatus =
  | "reserved"
  | "executing"
  | "succeeded"
  | "failed"
  | "ambiguous";

export type ExecutionIdempotencyRecord = {
  organizationId: string;
  projectId: string;
  idempotencyKey: string;
  executionOutputRef: string | null;
  status: ExecutionIdempotencyStatus;
  payload: unknown | null;
};

export type PersistEpisodeResult = {
  newVersion: number;
  conflict: boolean;
};

export type ResolveOutputRefResult = {
  found: boolean;
  payload: unknown | null;
  brainId: string | null;
  outputRef: string;
};

export interface DurablePersistencePort {
  readonly mode: "supabase" | "simulated";

  hydrateProject(input: { organizationId: string; projectId: string }): Promise<void>;

  hydrateOrganizationMemory(organizationId: string): Promise<void>;

  persistEpisodeCritical(
    episode: ProjectEpisodeRecord,
    expectedVersion: number
  ): Promise<PersistEpisodeResult>;

  persistApprovalCritical(record: ProjectApprovalRecord): Promise<void>;

  appendEventTelemetry(event: ProjectRuntimeEvent): Promise<void>;

  resolveOutputRef(input: {
    organizationId: string;
    outputRef: string;
    projectId?: string;
  }): Promise<ResolveOutputRefResult>;

  reserveExecutionIdempotency(input: {
    organizationId: string;
    projectId: string;
    idempotencyKey: string;
  }): Promise<ExecutionIdempotencyRecord>;

  confirmExecutionIdempotency(input: {
    organizationId: string;
    idempotencyKey: string;
    status: ExecutionIdempotencyStatus;
    executionOutputRef: string;
    payload: ExecutionStoreRecord;
  }): Promise<void>;

  lookupExecutionIdempotency(input: {
    organizationId: string;
    idempotencyKey: string;
  }): Promise<ExecutionIdempotencyRecord | null>;

  syncBrainDocumentsFromCache(input: {
    organizationId: string;
    projectId: string;
  }): Promise<void>;
}

export type DurablePersistenceFactoryInput = {
  supabase?: AppSupabaseClient | null;
  mode: "supabase" | "simulated";
};
