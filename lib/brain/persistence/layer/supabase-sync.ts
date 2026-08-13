/**
 * Supabase sync helpers for brain layer documents.
 */

import { brainFrom } from "../supabase/brain-supabase-client";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { toJson } from "@/lib/business-brain/repositories/mappers";
import { emitPersistenceDiagnostic, safePersistenceError } from "./persistence-diagnostics";

export type LayerDocumentRow = {
  id?: string;
  organization_id: string;
  brain_id: string;
  document_kind: string;
  document_id: string;
  scope_key: string;
  project_id?: string | null;
  campaign_id?: string | null;
  peer_id?: string | null;
  output_ref: string;
  version: number;
  status?: string | null;
  confidence?: string | null;
  schema_version: string;
  payload: unknown;
  supersedes_output_ref?: string | null;
  metadata?: Record<string, unknown>;
};

export async function upsertLayerDocument(
  supabase: AppSupabaseClient,
  row: LayerDocumentRow
): Promise<void> {
  const startedMs = Date.now();
  emitPersistenceDiagnostic({
    event: "persistence_layer_document_upsert_started",
    organizationId: row.organization_id,
    projectId: row.project_id ?? undefined,
    brainId: row.brain_id,
    documentKind: row.document_kind,
    operation: "upsert.brain_layer_documents",
  });

  try {
    const { error } = await brainFrom(supabase, "brain_layer_documents").upsert(
      {
        organization_id: row.organization_id,
        brain_id: row.brain_id,
        document_kind: row.document_kind,
        document_id: row.document_id,
        scope_key: row.scope_key,
        project_id: row.project_id ?? null,
        campaign_id: row.campaign_id ?? null,
        peer_id: row.peer_id ?? null,
        output_ref: row.output_ref,
        version: row.version,
        status: row.status ?? null,
        confidence: row.confidence ?? null,
        schema_version: row.schema_version,
        payload: toJson(row.payload),
        supersedes_output_ref: row.supersedes_output_ref ?? null,
        metadata: toJson(row.metadata ?? {}),
      },
      { onConflict: "organization_id,brain_id,document_kind,document_id" }
    );
    if (error) {
      const safe = safePersistenceError(new Error(error.message));
      emitPersistenceDiagnostic({
        event: "persistence_layer_document_upsert_failed",
        organizationId: row.organization_id,
        projectId: row.project_id ?? undefined,
        brainId: row.brain_id,
        documentKind: row.document_kind,
        operation: "upsert.brain_layer_documents",
        errorName: safe.errorName,
        reason: safe.reason,
        durationMs: Date.now() - startedMs,
      });
      throw new Error(`layer_document_upsert_failed: ${error.message}`);
    }
    emitPersistenceDiagnostic({
      event: "persistence_layer_document_upsert_completed",
      organizationId: row.organization_id,
      projectId: row.project_id ?? undefined,
      brainId: row.brain_id,
      documentKind: row.document_kind,
      operation: "upsert.brain_layer_documents",
      durationMs: Date.now() - startedMs,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("layer_document_upsert_failed:")) {
      throw error;
    }
    const safe = safePersistenceError(error);
    emitPersistenceDiagnostic({
      event: "persistence_layer_document_upsert_failed",
      organizationId: row.organization_id,
      projectId: row.project_id ?? undefined,
      brainId: row.brain_id,
      documentKind: row.document_kind,
      operation: "upsert.brain_layer_documents",
      errorName: safe.errorName,
      errorCode: safe.errorCode,
      reason: safe.reason,
      durationMs: Date.now() - startedMs,
    });
    throw error;
  }
}

export async function upsertLayerLatestPointer(
  supabase: AppSupabaseClient,
  input: {
    organizationId: string;
    brainId: string;
    scopeKey: string;
    latestOutputRef: string;
    latestDocumentId: string;
    latestVersion: number;
  }
): Promise<void> {
  const { error } = await brainFrom(supabase, "brain_layer_latest").upsert(
    {
      organization_id: input.organizationId,
      brain_id: input.brainId,
      scope_key: input.scopeKey,
      latest_output_ref: input.latestOutputRef,
      latest_document_id: input.latestDocumentId,
      latest_version: input.latestVersion,
    },
    { onConflict: "organization_id,brain_id,scope_key" }
  );
  if (error) throw new Error(`layer_latest_upsert_failed: ${error.message}`);
}

export async function loadLayerDocuments(
  supabase: AppSupabaseClient,
  input: { organizationId: string; brainId?: string; projectId?: string }
): Promise<LayerDocumentRow[]> {
  let query = brainFrom(supabase, "brain_layer_documents")
    .select("*")
    .eq("organization_id", input.organizationId);
  if (input.brainId) query = query.eq("brain_id", input.brainId);
  if (input.projectId) query = query.eq("project_id", input.projectId);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(`layer_document_load_failed: ${error.message}`);
  return (data ?? []) as LayerDocumentRow[];
}

export async function upsertProjectEpisode(
  supabase: AppSupabaseClient,
  episode: import("../../project-runtime/types").ProjectEpisodeRecord
): Promise<void> {
  const { error } = await brainFrom(supabase, "brain_project_episodes").upsert(
    {
      organization_id: episode.snapshot.organizationId,
      project_id: episode.snapshot.projectId,
      episode_id: episode.snapshot.episodeId,
      peer_id: episode.snapshot.peerId,
      correlation_id: episode.correlationId,
      episode_status: episode.episodeStatus,
      current_state: episode.snapshot.state,
      current_brain: episode.snapshot.activeBrain,
      version: 1,
      episode: toJson(episode),
      artifacts: toJson(episode.artifacts),
      resolved_graphs: toJson(episode.resolvedGraphs ?? {}),
      cached_learning_proposals: toJson(episode.cachedLearningProposals ?? []),
      started_at: episode.startedAt,
      updated_at: episode.updatedAt,
      completed_at: episode.completedAt,
      last_error: episode.lastError,
    },
    { onConflict: "organization_id,project_id" }
  );
  if (error) throw new Error(`project_episode_upsert_failed: ${error.message}`);
}

export async function loadProjectEpisode(
  supabase: AppSupabaseClient,
  input: { organizationId: string; projectId: string }
): Promise<import("../../project-runtime/types").ProjectEpisodeRecord | null> {
  const { data, error } = await brainFrom(supabase, "brain_project_episodes")
    .select("episode")
    .eq("organization_id", input.organizationId)
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (error) throw new Error(`project_episode_load_failed: ${error.message}`);
  if (!data) return null;
  return (data as { episode: import("../../project-runtime/types").ProjectEpisodeRecord }).episode;
}

export async function appendProjectEvent(
  supabase: AppSupabaseClient,
  event: import("../../project-runtime/types").ProjectRuntimeEvent
): Promise<void> {
  const { error } = await brainFrom(supabase, "brain_project_events").upsert(
    {
      organization_id: event.organizationId,
      project_id: event.projectId,
      event_id: event.eventId,
      event_type: event.type,
      brain_id: event.brainId,
      correlation_id: event.correlationId,
      output_ref: event.outputRef,
      customer_safe_summary: event.customerSafeSummary ?? null,
      metadata: toJson({}),
    },
    { onConflict: "organization_id,project_id,event_id", ignoreDuplicates: true }
  );
  if (error) throw new Error(`project_event_append_failed: ${error.message}`);
}

export async function upsertProjectApproval(
  supabase: AppSupabaseClient,
  record: import("../../project-runtime/types").ProjectApprovalRecord
): Promise<void> {
  const { error } = await brainFrom(supabase, "brain_project_approvals").upsert(
    {
      organization_id: record.organizationId,
      project_id: record.projectId,
      approval_id: record.id,
      checkpoint_kind: record.checkpointKind,
      status: record.decision === "approved" || record.decision === "rejected" ? "decided" : "pending",
      decision: record.decision,
      actor: record.actor,
      comment: record.comment ?? null,
      decided_at: record.decidedAt,
    },
    { onConflict: "organization_id,project_id,approval_id" }
  );
  if (error) throw new Error(`project_approval_upsert_failed: ${error.message}`);
}

export async function upsertPerformanceObservations(
  supabase: AppSupabaseClient,
  input: {
    organizationId: string;
    projectId: string;
    observations: readonly import("../../project-runtime/types").StoredPerformanceObservation[];
  }
): Promise<void> {
  if (input.observations.length === 0) return;
  const rows = input.observations.map((obs) => ({
    organization_id: input.organizationId,
    project_id: input.projectId,
    campaign_id: obs.campaignId ?? input.projectId,
    observation_id: obs.id,
    ingestion_id: obs.ingestionId,
    source: obs.source,
    metric: obs.metric,
    value: obs.value,
    unit: obs.unit ?? null,
    measurement_window: obs.measurementWindow,
    data_quality: obs.dataQuality,
    attribution: toJson({
      model: obs.attributionModel,
      confidence: obs.attributionConfidence,
      channel: obs.channel,
      deliverableId: obs.deliverableId,
    }),
    observed_at: obs.observedAt ?? null,
    ingested_at: obs.ingestedAt,
    payload: toJson(obs),
  }));
  const { error } = await brainFrom(supabase, "brain_performance_observations").upsert(rows, {
    onConflict: "organization_id,project_id,observation_id",
    ignoreDuplicates: true,
  });
  if (error) throw new Error(`performance_observation_upsert_failed: ${error.message}`);
}

export async function upsertExecutionIdempotency(
  supabase: AppSupabaseClient,
  input: {
    organizationId: string;
    projectId: string;
    idempotencyKey: string;
    executionOutputRef: string;
    payload: unknown;
  }
): Promise<void> {
  const { error } = await brainFrom(supabase, "brain_execution_idempotency").upsert(
    {
      organization_id: input.organizationId,
      project_id: input.projectId,
      idempotency_key: input.idempotencyKey,
      execution_output_ref: input.executionOutputRef,
      payload: toJson(input.payload),
    },
    { onConflict: "organization_id,idempotency_key" }
  );
  if (error) throw new Error(`execution_idempotency_upsert_failed: ${error.message}`);
}

export async function getExecutionByIdempotencyKey(
  supabase: AppSupabaseClient,
  input: { organizationId: string; idempotencyKey: string }
): Promise<unknown | null> {
  const { data, error } = await brainFrom(supabase, "brain_execution_idempotency")
    .select("payload")
    .eq("organization_id", input.organizationId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (error) throw new Error(`execution_idempotency_load_failed: ${error.message}`);
  return data ? (data as { payload: unknown }).payload : null;
}

export async function upsertOrgMemoryRecords(
  supabase: AppSupabaseClient,
  input: { organizationId: string; memories: readonly import("../../layers/memory/types").MemoryRecord[] }
): Promise<void> {
  if (input.memories.length === 0) return;
  const startedMs = Date.now();
  emitPersistenceDiagnostic({
    event: "persistence_org_memory_upsert_started",
    organizationId: input.organizationId,
    operation: "upsert.brain_org_memory_records",
    memoryCount: input.memories.length,
  });

  try {
    const rows = input.memories.map((mem) => ({
      organization_id: input.organizationId,
      memory_id: mem.id,
      category: mem.category ?? null,
      tags: toJson(mem.tags ?? []),
      campaign_id: mem.relatedCampaigns?.[0] ?? null,
      project_id: null,
      confidence: mem.confidence ?? null,
      importance: mem.importance ?? null,
      durability: mem.lifecycle ?? null,
      scope: mem.category ?? null,
      content: toJson(mem),
      evidence: toJson(mem.evidence ?? []),
      relations: toJson([]),
      expires_at: mem.expiresAt ?? null,
    }));
    const { error } = await brainFrom(supabase, "brain_org_memory_records").upsert(rows, {
      onConflict: "organization_id,memory_id",
    });
    if (error) {
      const safe = safePersistenceError(new Error(error.message));
      emitPersistenceDiagnostic({
        event: "persistence_org_memory_upsert_failed",
        organizationId: input.organizationId,
        operation: "upsert.brain_org_memory_records",
        memoryCount: input.memories.length,
        errorName: safe.errorName,
        reason: safe.reason,
        durationMs: Date.now() - startedMs,
      });
      throw new Error(`org_memory_upsert_failed: ${error.message}`);
    }
    emitPersistenceDiagnostic({
      event: "persistence_org_memory_upsert_completed",
      organizationId: input.organizationId,
      operation: "upsert.brain_org_memory_records",
      memoryCount: input.memories.length,
      durationMs: Date.now() - startedMs,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("org_memory_upsert_failed:")) {
      throw error;
    }
    const safe = safePersistenceError(error);
    emitPersistenceDiagnostic({
      event: "persistence_org_memory_upsert_failed",
      organizationId: input.organizationId,
      operation: "upsert.brain_org_memory_records",
      memoryCount: input.memories.length,
      errorName: safe.errorName,
      errorCode: safe.errorCode,
      reason: safe.reason,
      durationMs: Date.now() - startedMs,
    });
    throw error;
  }
}

import type { MemoryRecord } from "../../layers/memory/types";

export async function loadOrgMemoryRecords(
  supabase: AppSupabaseClient,
  organizationId: string
): Promise<MemoryRecord[]> {
  const { data, error } = await brainFrom(supabase, "brain_org_memory_records")
    .select("content")
    .eq("organization_id", organizationId);
  if (error) throw new Error(`org_memory_load_failed: ${error.message}`);
  return (data ?? []).map((row: { content: MemoryRecord }) => row.content);
}
