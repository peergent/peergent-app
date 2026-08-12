/**
 * Hydrate L1 cache stores from durable source — scoped cold-start recovery.
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { CompanyStoreRecord } from "../../layers/company/company-repository";
import type { ResearchSnapshot } from "../../layers/research/brain-types";
import type { ReasoningSnapshot } from "../../layers/reasoning/brain-types";
import type { MarketingIntelligenceSnapshot } from "../../layers/marketing-intelligence/brain-types";
import type { StrategySnapshot } from "../../layers/strategy/brain-types";
import type { PlanningSnapshot } from "../../layers/planning/brain-types";
import type { LearningSnapshot } from "../../layers/learning/brain-types";
import type { CreativeRecord } from "../../layers/creative/creative-repository";
import type { ValidationRecord } from "../../layers/validation/validation-repository";
import type { MemoryStoreRecord } from "../../layers/memory/memory-repository";
import type { ExecutionStoreRecord } from "../../layers/execution/execution-repository";
import { projectScopeKey } from "./scope-keys";
import {
  getLayerRepositories,
} from "../layer-repository-factory";
import {
  loadLayerDocuments,
  loadOrgMemoryRecords,
  loadProjectEpisode,
} from "./supabase-sync";
import type { LayerDocumentRow } from "./supabase-sync";
import { simulatedDurableStore } from "./simulated-durable-store";
import { orgMemoryIndex } from "./stores";
import { emitPersistenceDiagnostic } from "./persistence-diagnostics";

function applyDocumentToCache(row: LayerDocumentRow): void {
  const repos = getLayerRepositories();
  const payload = row.payload as Record<string, unknown>;

  switch (row.document_kind) {
    case "company_store":
      repos.company.store(payload as unknown as CompanyStoreRecord);
      break;
    case "research_snapshot":
      repos.researchBrain.storeSnapshot(payload as unknown as ResearchSnapshot);
      break;
    case "reasoning_snapshot":
      repos.reasoningBrain.storeSnapshot(payload as unknown as ReasoningSnapshot);
      break;
    case "mi_snapshot":
      repos.marketingIntelligenceBrain.storeSnapshot(payload as unknown as MarketingIntelligenceSnapshot);
      break;
    case "strategy_snapshot":
      repos.strategyBrain.storeSnapshot(payload as unknown as StrategySnapshot);
      break;
    case "planning_snapshot":
      repos.planningBrain.storeSnapshot(payload as unknown as PlanningSnapshot);
      break;
    case "learning_snapshot":
      repos.learningBrain.storeSnapshot(payload as unknown as LearningSnapshot);
      break;
    case "creative_record":
      repos.creative.store(payload as unknown as CreativeRecord);
      break;
    case "validation_record":
      repos.validation.store(payload as unknown as ValidationRecord);
      break;
    case "memory_store":
      repos.memory.store(payload as unknown as MemoryStoreRecord);
      break;
    case "execution_store":
      repos.execution.store(payload as unknown as ExecutionStoreRecord);
      break;
    default:
      break;
  }
}

function applyOrgMemoriesToCache(organizationId: string, memories: readonly import("../../layers/memory/types").MemoryRecord[]): void {
  if (memories.length === 0) return;
  orgMemoryIndex.set(organizationId, [...memories]);
}

export async function hydrateL1FromDocuments(
  documents: readonly LayerDocumentRow[],
  organizationId: string
): Promise<void> {
  for (const row of documents) {
    if (row.organization_id !== organizationId) continue;
    applyDocumentToCache(row);
  }
}

export async function hydrateProjectFromSupabase(
  supabase: AppSupabaseClient,
  input: { organizationId: string; projectId: string }
): Promise<number> {
  emitPersistenceDiagnostic({
    event: "persistence_hydration_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
  });

  const repos = getLayerRepositories();
  let hydrated = 0;

  const companyDocs = await loadLayerDocuments(supabase, {
    organizationId: input.organizationId,
    brainId: "company",
  });
  await hydrateL1FromDocuments(companyDocs, input.organizationId);
  hydrated += companyDocs.length;

  const projectDocs = await loadLayerDocuments(supabase, {
    organizationId: input.organizationId,
    projectId: input.projectId,
  });
  await hydrateL1FromDocuments(projectDocs, input.organizationId);
  hydrated += projectDocs.length;

  const episode = await loadProjectEpisode(supabase, input);
  if (episode) {
    repos.projectEpisode.save({ ...episode, durableVersion: episode.durableVersion ?? 0 });
    hydrated += 1;
  }

  const memories = await loadOrgMemoryRecords(supabase, input.organizationId);
  applyOrgMemoriesToCache(input.organizationId, memories);
  hydrated += memories.length;

  emitPersistenceDiagnostic({
    event: "persistence_hydration_completed",
    organizationId: input.organizationId,
    projectId: input.projectId,
    message: `hydrated=${hydrated}`,
  });

  return hydrated;
}

export async function hydrateOrganizationMemoryFromSupabase(
  supabase: AppSupabaseClient,
  organizationId: string
): Promise<number> {
  emitPersistenceDiagnostic({
    event: "persistence_hydration_started",
    organizationId,
    message: "org_memory_only",
  });

  const memories = await loadOrgMemoryRecords(supabase, organizationId);
  applyOrgMemoriesToCache(organizationId, memories);

  emitPersistenceDiagnostic({
    event: "persistence_hydration_completed",
    organizationId,
    message: `org_memories=${memories.length}`,
  });

  return memories.length;
}

export function hydrateProjectFromSimulatedStore(input: {
  organizationId: string;
  projectId: string;
}): number {
  emitPersistenceDiagnostic({
    event: "persistence_hydration_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    message: "simulated",
  });

  const repos = getLayerRepositories();
  let hydrated = 0;

  const companyDocs = simulatedDurableStore.listDocuments(input.organizationId).filter(
    (d) => d.brain_id === "company"
  );
  for (const doc of companyDocs) applyDocumentToCache(doc);
  hydrated += companyDocs.length;

  const projectDocs = simulatedDurableStore.listDocuments(input.organizationId, input.projectId);
  for (const doc of projectDocs) applyDocumentToCache(doc);
  hydrated += projectDocs.length;

  const episodeRecord = simulatedDurableStore.getEpisode(input.organizationId, input.projectId);
  if (episodeRecord) {
    repos.projectEpisode.save({
      ...episodeRecord.episode,
      durableVersion: episodeRecord.version,
    });
    hydrated += 1;
  }

  for (const approval of simulatedDurableStore.getApprovals(input.projectId)) {
    repos.projectEpisode.saveApproval(approval);
  }

  for (const obs of simulatedDurableStore.getObservations(input.projectId)) {
    repos.projectEpisode.saveObservations(input.projectId, [obs]);
  }

  for (const event of simulatedDurableStore.listEvents(input.projectId)) {
    repos.projectEpisode.appendEvent(input.projectId, event);
  }

  const memories = simulatedDurableStore.getOrgMemories(input.organizationId);
  applyOrgMemoriesToCache(input.organizationId, memories);
  hydrated += memories.length;

  for (const row of simulatedDurableStore.listDocuments(input.organizationId, input.projectId)) {
    if (row.brain_id !== "execution") continue;
    const record = row.payload as ExecutionStoreRecord;
    for (const key of record.idempotencyKeys) {
      simulatedDurableStore.upsertExecutionIdempotency({
        organizationId: input.organizationId,
        projectId: input.projectId,
        idempotencyKey: key,
        executionOutputRef: record.outputRef,
        status: "succeeded",
        payload: record,
      });
    }
  }

  emitPersistenceDiagnostic({
    event: "persistence_hydration_completed",
    organizationId: input.organizationId,
    projectId: input.projectId,
    message: `simulated hydrated=${hydrated}`,
  });

  return hydrated;
}

export function syncCacheDocumentsToSimulatedStore(input: {
  organizationId: string;
  projectId: string;
}): void {
  const repos = getLayerRepositories();
  const scope = projectScopeKey({
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.projectId,
  });

  const company = repos.company.getLatest(input.organizationId);
  if (company) {
    simulatedDurableStore.upsertDocument({
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

  const snapshots: Array<{ brainId: string; kind: string; get: () => { id: string; outputRef: string; organizationId: string; projectId?: string; version?: number; graph?: unknown } | null }> = [
    { brainId: "research", kind: "research_snapshot", get: () => repos.researchBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId }) },
    { brainId: "reasoning", kind: "reasoning_snapshot", get: () => repos.reasoningBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId }) },
    { brainId: "marketing_intelligence", kind: "mi_snapshot", get: () => repos.marketingIntelligenceBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId }) },
    { brainId: "strategy", kind: "strategy_snapshot", get: () => repos.strategyBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId }) },
    { brainId: "planning", kind: "planning_snapshot", get: () => repos.planningBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId }) },
    { brainId: "learning", kind: "learning_snapshot", get: () => repos.learningBrain.getLatestSnapshot({ organizationId: input.organizationId, projectId: input.projectId }) },
  ];

  for (const item of snapshots) {
    const snap = item.get();
    if (!snap) continue;
    simulatedDurableStore.upsertDocument({
      organization_id: input.organizationId,
      brain_id: item.brainId,
      document_kind: item.kind,
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
    simulatedDurableStore.upsertDocument({
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
    simulatedDurableStore.upsertDocument({
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
    simulatedDurableStore.upsertDocument({
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
    simulatedDurableStore.upsertDocument({
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

  simulatedDurableStore.upsertOrgMemories(
    input.organizationId,
    repos.memory.getOrgMemories(input.organizationId)
  );
}
