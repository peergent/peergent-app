/**
 * Simulated durable persistence — cold-start tests without live Supabase.
 */

import type {
  DurablePersistencePort,
  ExecutionIdempotencyRecord,
  ExecutionIdempotencyStatus,
  PersistEpisodeResult,
  ResolveOutputRefResult,
} from "./durable-persistence-port";
import type { ProjectApprovalRecord, ProjectEpisodeRecord, ProjectRuntimeEvent } from "../../project-runtime/types";
import type { ExecutionStoreRecord } from "../../layers/execution/execution-repository";
import { simulatedDurableStore } from "./simulated-durable-store";
import {
  hydrateProjectFromSimulatedStore,
  syncCacheDocumentsToSimulatedStore,
} from "./hydration";
import { PersistenceConflictError } from "../server/persistence-config";
import { emitPersistenceDiagnostic } from "./persistence-diagnostics";
import { getLayerRepositories } from "../layer-repository-factory";

export class SimulatedDurablePersistence implements DurablePersistencePort {
  readonly mode = "simulated" as const;

  async hydrateProject(input: { organizationId: string; projectId: string }): Promise<void> {
    hydrateProjectFromSimulatedStore(input);
  }

  async hydrateOrganizationMemory(organizationId: string): Promise<void> {
    const repos = getLayerRepositories();
    const memories = simulatedDurableStore.getOrgMemories(organizationId);
    repos.memory.getOrgMemories(organizationId);
    const { orgMemoryIndex } = await import("./stores");
    orgMemoryIndex.set(organizationId, [...memories]);
  }

  async persistEpisodeCritical(
    episode: ProjectEpisodeRecord,
    expectedVersion: number
  ): Promise<PersistEpisodeResult> {
    const result = simulatedDurableStore.upsertEpisode(episode, expectedVersion);
    if (result.conflict) {
      emitPersistenceDiagnostic({
        event: "persistence_conflict",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        expectedVersion,
        actualVersion: result.newVersion,
      });
      throw new PersistenceConflictError(
        "Episode version conflict",
        expectedVersion,
        result.newVersion
      );
    }
    episode.durableVersion = result.newVersion;
    return result;
  }

  async persistApprovalCritical(record: ProjectApprovalRecord): Promise<void> {
    simulatedDurableStore.upsertApproval(record);
  }

  async appendEventTelemetry(event: ProjectRuntimeEvent): Promise<void> {
    simulatedDurableStore.appendEvent(event);
  }

  async resolveOutputRef(input: {
    organizationId: string;
    outputRef: string;
    projectId?: string;
  }): Promise<ResolveOutputRefResult> {
    const row = simulatedDurableStore.getDocumentByOutputRef(input.organizationId, input.outputRef);
    if (!row) {
      emitPersistenceDiagnostic({
        event: "output_ref_missing",
        organizationId: input.organizationId,
        projectId: input.projectId,
        outputRef: input.outputRef,
      });
      return { found: false, payload: null, brainId: null, outputRef: input.outputRef };
    }
    if (input.projectId && row.project_id && row.project_id !== input.projectId) {
      return { found: false, payload: null, brainId: row.brain_id, outputRef: input.outputRef };
    }
    return { found: true, payload: row.payload, brainId: row.brain_id, outputRef: input.outputRef };
  }

  async reserveExecutionIdempotency(input: {
    organizationId: string;
    projectId: string;
    idempotencyKey: string;
  }): Promise<ExecutionIdempotencyRecord> {
    const existing = simulatedDurableStore.getExecutionIdempotency(
      input.organizationId,
      input.idempotencyKey
    );
    if (existing) {
      if (existing.status === "succeeded") {
        emitPersistenceDiagnostic({
          event: "execution_idempotency_conflict",
          organizationId: input.organizationId,
          projectId: input.projectId,
          idempotencyKey: input.idempotencyKey,
        });
      }
      return existing;
    }
    const record: ExecutionIdempotencyRecord = {
      organizationId: input.organizationId,
      projectId: input.projectId,
      idempotencyKey: input.idempotencyKey,
      executionOutputRef: null,
      status: "reserved",
      payload: null,
    };
    simulatedDurableStore.upsertExecutionIdempotency(record);
    return record;
  }

  async confirmExecutionIdempotency(input: {
    organizationId: string;
    idempotencyKey: string;
    status: ExecutionIdempotencyStatus;
    executionOutputRef: string;
    payload: ExecutionStoreRecord;
  }): Promise<void> {
    simulatedDurableStore.upsertExecutionIdempotency({
      organizationId: input.organizationId,
      projectId: input.payload.key.projectId,
      idempotencyKey: input.idempotencyKey,
      executionOutputRef: input.executionOutputRef,
      status: input.status,
      payload: input.payload,
    });
  }

  async lookupExecutionIdempotency(input: {
    organizationId: string;
    idempotencyKey: string;
  }): Promise<ExecutionIdempotencyRecord | null> {
    return simulatedDurableStore.getExecutionIdempotency(input.organizationId, input.idempotencyKey);
  }

  async syncBrainDocumentsFromCache(input: {
    organizationId: string;
    projectId: string;
  }): Promise<void> {
    syncCacheDocumentsToSimulatedStore(input);
  }
}

export function createSimulatedDurablePersistence(): SimulatedDurablePersistence {
  return new SimulatedDurablePersistence();
}
