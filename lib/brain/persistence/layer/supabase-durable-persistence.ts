/**
 * Supabase durable persistence — awaited critical writes.
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { brainFrom } from "../supabase/brain-supabase-client";
import { toJson } from "@/lib/business-brain/repositories/mappers";
import type {
  DurablePersistencePort,
  ExecutionIdempotencyRecord,
  ExecutionIdempotencyStatus,
  PersistEpisodeResult,
  ResolveOutputRefResult,
} from "./durable-persistence-port";
import type { ProjectApprovalRecord, ProjectEpisodeRecord, ProjectRuntimeEvent } from "../../project-runtime/types";
import type { ExecutionStoreRecord } from "../../layers/execution/execution-repository";
import {
  appendProjectEvent,
  upsertProjectApproval,
  upsertLayerDocument,
  upsertOrgMemoryRecords,
} from "./supabase-sync";
import { hydrateProjectFromSupabase, hydrateOrganizationMemoryFromSupabase } from "./hydration";
import { loadProjectEpisode } from "./supabase-sync";
import { emitPersistenceDiagnostic } from "./persistence-diagnostics";
import { getLayerRepositories } from "../layer-repository-factory";
import { projectScopeKey } from "./scope-keys";
import { PersistenceConflictError, PersistenceInfrastructureError } from "../server/persistence-config";

async function upsertEpisodeVersioned(
  supabase: AppSupabaseClient,
  episode: ProjectEpisodeRecord,
  expectedVersion: number
): Promise<PersistEpisodeResult> {
  const startedMs = Date.now();
  emitPersistenceDiagnostic({
    event: "persistence_episode_upsert_started",
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    episodeId: episode.snapshot.episodeId,
    expectedVersion,
    operation: "rpc.upsert_brain_project_episode_versioned",
  });

  try {
    const { data, error } = await supabase.rpc("upsert_brain_project_episode_versioned", {
      p_organization_id: episode.snapshot.organizationId,
      p_project_id: episode.snapshot.projectId,
      p_expected_version: expectedVersion,
      p_episode: toJson(episode),
      p_artifacts: toJson(episode.artifacts),
      p_resolved_graphs: toJson(episode.resolvedGraphs ?? {}),
      p_cached_learning_proposals: toJson(episode.cachedLearningProposals ?? []),
      p_episode_id: episode.snapshot.episodeId,
      p_peer_id: episode.snapshot.peerId,
      p_correlation_id: episode.correlationId,
      p_episode_status: episode.episodeStatus,
      p_current_state: episode.snapshot.state,
      p_current_brain: episode.snapshot.activeBrain,
      p_started_at: episode.startedAt,
      p_updated_at: episode.updatedAt,
      p_completed_at: episode.completedAt,
      p_last_error: episode.lastError,
    });

    if (error) {
      emitPersistenceDiagnostic({
        event: "persistence_episode_upsert_failed",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        episodeId: episode.snapshot.episodeId,
        expectedVersion,
        operation: "rpc.upsert_brain_project_episode_versioned",
        errorName: "PostgrestError",
        reason: error.message.slice(0, 120),
        durationMs: Date.now() - startedMs,
      });
      throw new PersistenceInfrastructureError(
        `project_episode_versioned_upsert_failed: ${error.message}`,
        "persistence_write_failed"
      );
    }

    const row = (Array.isArray(data) ? data[0] : data) as { new_version: number; conflict: boolean } | null;
    if (!row) {
      emitPersistenceDiagnostic({
        event: "persistence_episode_upsert_failed",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        episodeId: episode.snapshot.episodeId,
        expectedVersion,
        operation: "rpc.upsert_brain_project_episode_versioned",
        errorName: "PersistenceInfrastructureError",
        errorCode: "project_episode_versioned_empty_result",
        reason: "project_episode_versioned_empty_result",
        durationMs: Date.now() - startedMs,
      });
      throw new PersistenceInfrastructureError("project_episode_versioned_empty_result");
    }

    if (row.conflict) {
      emitPersistenceDiagnostic({
        event: "persistence_conflict",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        episodeId: episode.snapshot.episodeId,
        expectedVersion,
        actualVersion: row.new_version,
        operation: "rpc.upsert_brain_project_episode_versioned",
        durationMs: Date.now() - startedMs,
      });
      throw new PersistenceConflictError(
        "Episode version conflict",
        expectedVersion,
        row.new_version
      );
    }

    emitPersistenceDiagnostic({
      event: "persistence_episode_upsert_completed",
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      episodeId: episode.snapshot.episodeId,
      expectedVersion,
      newVersion: row.new_version,
      operation: "rpc.upsert_brain_project_episode_versioned",
      durationMs: Date.now() - startedMs,
    });

    return { newVersion: row.new_version, conflict: false };
  } catch (error) {
    if (
      error instanceof PersistenceInfrastructureError ||
      error instanceof PersistenceConflictError
    ) {
      throw error;
    }
    const reason = error instanceof Error ? error.message.slice(0, 120) : String(error).slice(0, 120);
    emitPersistenceDiagnostic({
      event: "persistence_episode_upsert_failed",
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      episodeId: episode.snapshot.episodeId,
      expectedVersion,
      operation: "rpc.upsert_brain_project_episode_versioned",
      errorName: error instanceof Error ? error.name : "UnknownError",
      reason,
      durationMs: Date.now() - startedMs,
    });
    throw error;
  }
}

export class SupabaseDurablePersistence implements DurablePersistencePort {
  readonly mode = "supabase" as const;

  constructor(private readonly supabase: AppSupabaseClient) {}

  async hydrateProject(input: { organizationId: string; projectId: string }): Promise<void> {
    await hydrateProjectFromSupabase(this.supabase, input);
  }

  async hydrateOrganizationMemory(organizationId: string): Promise<void> {
    await hydrateOrganizationMemoryFromSupabase(this.supabase, organizationId);
  }

  async loadProjectEpisode(input: {
    organizationId: string;
    projectId: string;
  }): Promise<ProjectEpisodeRecord | null> {
    return loadProjectEpisode(this.supabase, input);
  }

  async persistEpisodeCritical(
    episode: ProjectEpisodeRecord,
    expectedVersion: number
  ): Promise<PersistEpisodeResult> {
    const result = await upsertEpisodeVersioned(this.supabase, episode, expectedVersion);
    episode.durableVersion = result.newVersion;
    return result;
  }

  async persistApprovalCritical(record: ProjectApprovalRecord): Promise<void> {
    await upsertProjectApproval(this.supabase, record);
  }

  async appendEventTelemetry(event: ProjectRuntimeEvent): Promise<void> {
    await appendProjectEvent(this.supabase, event);
  }

  async resolveOutputRef(input: {
    organizationId: string;
    outputRef: string;
    projectId?: string;
  }): Promise<ResolveOutputRefResult> {
    const { data, error } = await brainFrom(this.supabase, "brain_layer_documents")
      .select("brain_id, payload, project_id")
      .eq("organization_id", input.organizationId)
      .eq("output_ref", input.outputRef)
      .maybeSingle();

    if (error) {
      throw new PersistenceInfrastructureError(`output_ref_load_failed: ${error.message}`);
    }

    if (!data) {
      emitPersistenceDiagnostic({
        event: "output_ref_missing",
        organizationId: input.organizationId,
        projectId: input.projectId,
        outputRef: input.outputRef,
      });
      return { found: false, payload: null, brainId: null, outputRef: input.outputRef };
    }

    const row = data as { brain_id: string; payload: unknown; project_id: string | null };
    if (input.projectId && row.project_id && row.project_id !== input.projectId) {
      return { found: false, payload: null, brainId: row.brain_id, outputRef: input.outputRef };
    }

    return {
      found: true,
      payload: row.payload,
      brainId: row.brain_id,
      outputRef: input.outputRef,
    };
  }

  async reserveExecutionIdempotency(input: {
    organizationId: string;
    projectId: string;
    idempotencyKey: string;
  }): Promise<ExecutionIdempotencyRecord> {
    const existing = await this.lookupExecutionIdempotency(input);
    if (existing) return existing;

    const { error } = await brainFrom(this.supabase, "brain_execution_idempotency").insert({
      organization_id: input.organizationId,
      project_id: input.projectId,
      idempotency_key: input.idempotencyKey,
      execution_output_ref: "",
      status: "reserved",
      payload: toJson({}),
      reserved_at: new Date().toISOString(),
    });

    if (error && !error.message.includes("duplicate")) {
      throw new PersistenceInfrastructureError(`execution_idempotency_reserve_failed: ${error.message}`);
    }

    return (
      (await this.lookupExecutionIdempotency(input)) ?? {
        organizationId: input.organizationId,
        projectId: input.projectId,
        idempotencyKey: input.idempotencyKey,
        executionOutputRef: null,
        status: "reserved",
        payload: null,
      }
    );
  }

  async confirmExecutionIdempotency(input: {
    organizationId: string;
    idempotencyKey: string;
    status: ExecutionIdempotencyStatus;
    executionOutputRef: string;
    payload: ExecutionStoreRecord;
  }): Promise<void> {
    const { error } = await brainFrom(this.supabase, "brain_execution_idempotency")
      .update({
        status: input.status,
        execution_output_ref: input.executionOutputRef,
        payload: toJson(input.payload),
        confirmed_at: new Date().toISOString(),
      })
      .eq("organization_id", input.organizationId)
      .eq("idempotency_key", input.idempotencyKey);

    if (error) {
      throw new PersistenceInfrastructureError(`execution_idempotency_confirm_failed: ${error.message}`);
    }

    await upsertLayerDocument(this.supabase, {
      organization_id: input.payload.key.organizationId,
      brain_id: "execution",
      document_kind: "execution_store",
      document_id: input.executionOutputRef,
      scope_key: projectScopeKey({
        organizationId: input.payload.key.organizationId,
        projectId: input.payload.key.projectId,
      }),
      project_id: input.payload.key.projectId,
      output_ref: input.executionOutputRef,
      version: 1,
      schema_version: "1",
      payload: input.payload,
    });
  }

  async lookupExecutionIdempotency(input: {
    organizationId: string;
    idempotencyKey: string;
  }): Promise<ExecutionIdempotencyRecord | null> {
    const { data, error } = await brainFrom(this.supabase, "brain_execution_idempotency")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();

    if (error) {
      throw new PersistenceInfrastructureError(`execution_idempotency_load_failed: ${error.message}`);
    }
    if (!data) return null;

    const row = data as {
      organization_id: string;
      project_id: string;
      idempotency_key: string;
      execution_output_ref: string;
      status: ExecutionIdempotencyStatus;
      payload: unknown;
    };

    return {
      organizationId: row.organization_id,
      projectId: row.project_id,
      idempotencyKey: row.idempotency_key,
      executionOutputRef: row.execution_output_ref || null,
      status: row.status,
      payload: row.payload,
    };
  }

  async syncBrainDocumentsFromCache(input: {
    organizationId: string;
    projectId: string;
  }): Promise<void> {
    const repos = getLayerRepositories();
    const scope = projectScopeKey({
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.projectId,
    });

    const company = repos.company.getLatest(input.organizationId);
    if (company) {
      await upsertLayerDocument(this.supabase, {
        organization_id: input.organizationId,
        brain_id: "company",
        document_kind: "company_store",
        document_id: company.snapshot.id,
        scope_key: input.organizationId,
        output_ref: company.outputRef,
        version: company.graph.versionMeta.version,
        schema_version: "1",
        payload: company,
      });
    }

    const snapPairs: Array<[string, string, () => { id: string; outputRef: string; version?: number } | null]> = [
      ["research", "research_snapshot", () => repos.researchBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId })],
      ["reasoning", "reasoning_snapshot", () => repos.reasoningBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId })],
      ["marketing_intelligence", "mi_snapshot", () => repos.marketingIntelligenceBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId })],
      ["strategy", "strategy_snapshot", () => repos.strategyBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId })],
      ["planning", "planning_snapshot", () => repos.planningBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId })],
      ["learning", "learning_snapshot", () => repos.learningBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId })],
    ];

    for (const [brainId, kind, getter] of snapPairs) {
      const snap = getter();
      if (!snap) continue;
      await upsertLayerDocument(this.supabase, {
        organization_id: input.organizationId,
        brain_id: brainId,
        document_kind: kind,
        document_id: snap.id,
        scope_key: scope,
        project_id: input.projectId,
        campaign_id: input.projectId,
        output_ref: snap.outputRef,
        version: snap.version ?? 1,
        schema_version: "1",
        payload: snap,
      });
    }

    const creative = repos.creative.getLatest({ organizationId: input.organizationId, campaignId: input.projectId });
    if (creative) {
      await upsertLayerDocument(this.supabase, {
        organization_id: input.organizationId,
        brain_id: "creative",
        document_kind: "creative_record",
        document_id: creative.outputRef,
        scope_key: scope,
        project_id: input.projectId,
        campaign_id: input.projectId,
        output_ref: creative.outputRef,
        version: 1,
        schema_version: "1",
        payload: creative,
      });
    }

    const validation = repos.validation.getLatest({ organizationId: input.organizationId, campaignId: input.projectId });
    if (validation) {
      await upsertLayerDocument(this.supabase, {
        organization_id: input.organizationId,
        brain_id: "validation",
        document_kind: "validation_record",
        document_id: validation.outputRef,
        scope_key: scope,
        project_id: input.projectId,
        campaign_id: input.projectId,
        output_ref: validation.outputRef,
        version: 1,
        schema_version: "1",
        payload: validation,
      });
    }

    const execution = repos.execution.getLatest({ organizationId: input.organizationId, projectId: input.projectId });
    if (execution) {
      await upsertLayerDocument(this.supabase, {
        organization_id: input.organizationId,
        brain_id: "execution",
        document_kind: "execution_store",
        document_id: execution.outputRef,
        scope_key: scope,
        project_id: input.projectId,
        output_ref: execution.outputRef,
        version: 1,
        schema_version: "1",
        payload: execution,
      });
    }

    const memory = repos.memory.getLatest({ organizationId: input.organizationId, campaignId: input.projectId });
    if (memory) {
      await upsertLayerDocument(this.supabase, {
        organization_id: input.organizationId,
        brain_id: "memory",
        document_kind: "memory_store",
        document_id: memory.outputRef,
        scope_key: scope,
        project_id: input.projectId,
        campaign_id: input.projectId,
        output_ref: memory.outputRef,
        version: 1,
        schema_version: "1",
        payload: memory,
      });
    }

    await upsertOrgMemoryRecords(this.supabase, {
      organizationId: input.organizationId,
      memories: repos.memory.getOrgMemories(input.organizationId),
    });
  }
}

export function createSupabaseDurablePersistence(supabase: AppSupabaseClient): SupabaseDurablePersistence {
  return new SupabaseDurablePersistence(supabase);
}
