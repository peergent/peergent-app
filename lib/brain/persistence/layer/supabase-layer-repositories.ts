/**
 * Supabase-backed layer repositories — write-through to persistent cache + durable store.
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { LayerRepositoryBundle } from "../layer-repository-factory";
import type { CompanyRepository, CompanyStoreRecord } from "../../layers/company/company-repository";
import type { ResearchBrainRepository } from "../../layers/research/research-brain-repository";
import type { ResearchSnapshot } from "../../layers/research/brain-types";
import type { ReasoningBrainRepository } from "../../layers/reasoning/reasoning-brain-repository";
import type { ReasoningSnapshot } from "../../layers/reasoning/brain-types";
import type { MarketingIntelligenceBrainRepository } from "../../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import type { MarketingIntelligenceSnapshot } from "../../layers/marketing-intelligence/brain-types";
import type { StrategyBrainRepository } from "../../layers/strategy/strategy-brain-repository";
import type { StrategySnapshot } from "../../layers/strategy/brain-types";
import type { PlanningBrainRepository } from "../../layers/planning/planning-brain-repository";
import type { PlanningSnapshot } from "../../layers/planning/brain-types";
import type { CreativeRepository, CreativeRecord } from "../../layers/creative/creative-repository";
import type { ValidationRepository, ValidationRecord } from "../../layers/validation/validation-repository";
import type { MemoryRepository, MemoryStoreRecord } from "../../layers/memory/memory-repository";
import type { ExecutionRepository, ExecutionStoreRecord } from "../../layers/execution/execution-repository";
import type { LearningBrainRepository } from "../../layers/learning/learning-brain-repository";
import type { LearningSnapshot } from "../../layers/learning/brain-types";
import type { BrandRepository, BrandRecord } from "../../layers/brand/brand-repository";
import type { ProjectEpisodeRepository } from "../../project-runtime/project-episode-repository";
import type {
  ProjectApprovalRecord,
  ProjectEpisodeRecord,
  ProjectRuntimeEvent,
  StoredPerformanceObservation,
} from "../../project-runtime/types";
import { projectScopeKey } from "./scope-keys";
import {
  PersistentCompanyRepository,
  PersistentCreativeRepository,
  PersistentExecutionRepository,
  PersistentLearningBrainRepository,
  PersistentMarketingIntelligenceBrainRepository,
  PersistentMemoryRepository,
  PersistentPlanningBrainRepository,
  PersistentProjectEpisodeRepository,
  PersistentReasoningBrainRepository,
  PersistentResearchBrainRepository,
  PersistentStrategyBrainRepository,
  PersistentValidationRepository,
  PersistentBrandRepository,
} from "./persistent-repositories";
import {
  appendProjectEvent,
  loadOrgMemoryRecords,
  loadProjectEpisode,
  upsertExecutionIdempotency,
  upsertLayerDocument,
  upsertLayerLatestPointer,
  upsertOrgMemoryRecords,
  upsertPerformanceObservations,
  upsertProjectApproval,
} from "./supabase-sync";

function logPersistenceError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[brain-persistence] ${context}: ${message}`);
}

class WriteThroughCompanyRepository implements CompanyRepository {
  private readonly inner = new PersistentCompanyRepository();

  constructor(private readonly supabase: AppSupabaseClient) {}

  store(record: CompanyStoreRecord): void {
    this.inner.store(record);
    void upsertLayerDocument(this.supabase, {
      organization_id: record.organizationId,
      brain_id: "company",
      document_kind: "company_store",
      document_id: record.snapshot.id,
      scope_key: record.organizationId,
      output_ref: record.outputRef,
      version: record.graph.versionMeta.version,
      schema_version: "1",
      payload: record,
    })
      .then(() =>
        upsertLayerLatestPointer(this.supabase, {
          organizationId: record.organizationId,
          brainId: "company",
          scopeKey: record.organizationId,
          latestOutputRef: record.outputRef,
          latestDocumentId: record.snapshot.id,
          latestVersion: record.graph.versionMeta.version,
        })
      )
      .catch((err) => logPersistenceError("company_store", err));
  }

  getLatest(organizationId: string) {
    return this.inner.getLatest(organizationId);
  }

  getVersion(input: { organizationId: string; version: number }) {
    return this.inner.getVersion(input);
  }

  getHistory(organizationId: string) {
    return this.inner.getHistory(organizationId);
  }

  clear(): void {
    this.inner.clear();
  }
}

function snapshotSync(
  supabase: AppSupabaseClient,
  brainId: string,
  documentKind: string,
  snapshot: {
    id: string;
    organizationId: string;
    projectId?: string;
    campaignId?: string;
    outputRef: string;
    version?: number;
  },
  payload: unknown
): void {
  const scopeKey = projectScopeKey(snapshot);
  const version = snapshot.version ?? 1;
  void upsertLayerDocument(supabase, {
    organization_id: snapshot.organizationId,
    brain_id: brainId,
    document_kind: documentKind,
    document_id: snapshot.id,
    scope_key: scopeKey,
    project_id: snapshot.projectId ?? null,
    campaign_id: snapshot.campaignId ?? null,
    output_ref: snapshot.outputRef,
    version,
    schema_version: "1",
    payload,
  })
    .then(() =>
      upsertLayerLatestPointer(supabase, {
        organizationId: snapshot.organizationId,
        brainId,
        scopeKey,
        latestOutputRef: snapshot.outputRef,
        latestDocumentId: snapshot.id,
        latestVersion: version,
      })
    )
    .catch((err) => logPersistenceError(`${brainId}_snapshot`, err));
}

class WriteThroughResearchBrainRepository extends PersistentResearchBrainRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override storeSnapshot(snapshot: ResearchSnapshot): void {
    super.storeSnapshot(snapshot);
    snapshotSync(this.supabase, "research", "research_snapshot", snapshot, snapshot);
  }
}

class WriteThroughReasoningBrainRepository extends PersistentReasoningBrainRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override storeSnapshot(snapshot: ReasoningSnapshot): void {
    super.storeSnapshot(snapshot);
    snapshotSync(this.supabase, "reasoning", "reasoning_snapshot", snapshot, snapshot);
  }
}

class WriteThroughMarketingIntelligenceBrainRepository extends PersistentMarketingIntelligenceBrainRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override storeSnapshot(snapshot: MarketingIntelligenceSnapshot): void {
    super.storeSnapshot(snapshot);
    snapshotSync(this.supabase, "marketing_intelligence", "mi_snapshot", snapshot, snapshot);
  }
}

class WriteThroughStrategyBrainRepository extends PersistentStrategyBrainRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override storeSnapshot(snapshot: StrategySnapshot): void {
    super.storeSnapshot(snapshot);
    snapshotSync(this.supabase, "strategy", "strategy_snapshot", snapshot, snapshot);
  }
}

class WriteThroughPlanningBrainRepository extends PersistentPlanningBrainRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override storeSnapshot(snapshot: PlanningSnapshot): void {
    super.storeSnapshot(snapshot);
    snapshotSync(this.supabase, "planning", "planning_snapshot", snapshot, snapshot);
  }
}

class WriteThroughLearningBrainRepository extends PersistentLearningBrainRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override storeSnapshot(snapshot: LearningSnapshot): void {
    super.storeSnapshot(snapshot);
    snapshotSync(this.supabase, "learning", "learning_snapshot", snapshot, snapshot);
  }
}

class WriteThroughCreativeRepository extends PersistentCreativeRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override store(record: CreativeRecord): void {
    super.store(record);
    void upsertLayerDocument(this.supabase, {
      organization_id: record.key.organizationId,
      brain_id: "creative",
      document_kind: "creative_record",
      document_id: record.outputRef,
      scope_key: projectScopeKey({
        organizationId: record.key.organizationId,
        projectId: record.key.campaignId,
        campaignId: record.key.campaignId,
      }),
      project_id: record.key.campaignId ?? null,
      campaign_id: record.key.campaignId ?? null,
      output_ref: record.outputRef,
      version: 1,
      schema_version: "1",
      payload: record,
    }).catch((err) => logPersistenceError("creative_store", err));
  }
}

class WriteThroughValidationRepository extends PersistentValidationRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override store(record: ValidationRecord): void {
    super.store(record);
    void upsertLayerDocument(this.supabase, {
      organization_id: record.key.organizationId,
      brain_id: "validation",
      document_kind: "validation_record",
      document_id: record.outputRef,
      scope_key: projectScopeKey({
        organizationId: record.key.organizationId,
        projectId: record.key.campaignId,
        campaignId: record.key.campaignId,
      }),
      project_id: record.key.campaignId ?? null,
      campaign_id: record.key.campaignId ?? null,
      output_ref: record.outputRef,
      version: 1,
      schema_version: "1",
      payload: record,
    }).catch((err) => logPersistenceError("validation_store", err));
  }
}

class WriteThroughMemoryRepository extends PersistentMemoryRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override store(record: MemoryStoreRecord): void {
    super.store(record);
    void upsertLayerDocument(this.supabase, {
      organization_id: record.key.organizationId,
      brain_id: "memory",
      document_kind: "memory_store",
      document_id: record.outputRef,
      scope_key: projectScopeKey({
        organizationId: record.key.organizationId,
        projectId: record.key.campaignId,
        campaignId: record.key.campaignId,
      }),
      project_id: record.key.campaignId ?? null,
      campaign_id: record.key.campaignId ?? null,
      output_ref: record.outputRef,
      version: 1,
      schema_version: "1",
      payload: record,
    })
      .then(() =>
        upsertOrgMemoryRecords(this.supabase, {
          organizationId: record.key.organizationId,
          memories: record.graph.memories,
        })
      )
      .catch((err) => logPersistenceError("memory_store", err));
  }
}

class WriteThroughExecutionRepository extends PersistentExecutionRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override store(record: ExecutionStoreRecord): void {
    super.store(record);
    void upsertLayerDocument(this.supabase, {
      organization_id: record.key.organizationId,
      brain_id: "execution",
      document_kind: "execution_store",
      document_id: record.outputRef,
      scope_key: projectScopeKey({
        organizationId: record.key.organizationId,
        projectId: record.key.projectId,
      }),
      project_id: record.key.projectId,
      output_ref: record.outputRef,
      version: 1,
      schema_version: "1",
      payload: record,
    }).catch((err) => logPersistenceError("execution_store", err));

    for (const key of record.idempotencyKeys) {
      void upsertExecutionIdempotency(this.supabase, {
        organizationId: record.key.organizationId,
        projectId: record.key.projectId,
        idempotencyKey: key,
        executionOutputRef: record.outputRef,
        payload: record,
      }).catch((err) => logPersistenceError("execution_idempotency", err));
    }
    void upsertExecutionIdempotency(this.supabase, {
      organizationId: record.key.organizationId,
      projectId: record.key.projectId,
      idempotencyKey: record.batchIdempotencyKey,
      executionOutputRef: record.outputRef,
      payload: record,
    }).catch((err) => logPersistenceError("execution_batch_idempotency", err));
  }
}

class WriteThroughProjectEpisodeRepository extends PersistentProjectEpisodeRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override save(episode: ProjectEpisodeRecord): void {
    // L1 cache only — durable episode writes use versioned RPC via commitEpisodeCritical.
    super.save(episode);
  }

  override saveApproval(record: ProjectApprovalRecord): void {
    super.saveApproval(record);
    void upsertProjectApproval(this.supabase, record).catch((err) =>
      logPersistenceError("project_approval_save", err)
    );
  }

  override saveObservations(projectId: string, observations: readonly StoredPerformanceObservation[]): void {
    super.saveObservations(projectId, observations);
    if (observations.length === 0) return;
    const orgId = observations[0]?.organizationId;
    if (!orgId) return;
    void upsertPerformanceObservations(this.supabase, {
      organizationId: orgId,
      projectId,
      observations,
    }).catch((err) => logPersistenceError("performance_observations", err));
  }

  override appendEvent(projectId: string, event: ProjectRuntimeEvent): void {
    super.appendEvent(projectId, event);
    void appendProjectEvent(this.supabase, event).catch((err) =>
      logPersistenceError("project_event_append", err)
    );
  }
}

class WriteThroughBrandRepository extends PersistentBrandRepository {
  constructor(private readonly supabase: AppSupabaseClient) {
    super();
  }

  override store(record: BrandRecord): void {
    super.store(record);
    const outputRef = `brand:${record.key.organizationId}:${record.key.campaignId ?? "org"}:${record.storedAt}`;
    void upsertLayerDocument(this.supabase, {
      organization_id: record.key.organizationId,
      brain_id: "brand",
      document_kind: "brand_record",
      document_id: outputRef,
      scope_key: projectScopeKey({
        organizationId: record.key.organizationId,
        campaignId: record.key.campaignId,
      }),
      campaign_id: record.key.campaignId ?? null,
      output_ref: outputRef,
      version: 1,
      schema_version: "1",
      payload: record,
    }).catch((err) => logPersistenceError("brand_store", err));
  }
}

export function createSupabaseLayerRepositories(supabase: AppSupabaseClient): LayerRepositoryBundle {
  return {
    storageMode: "supabase",
    company: new WriteThroughCompanyRepository(supabase),
    researchBrain: new WriteThroughResearchBrainRepository(supabase),
    reasoningBrain: new WriteThroughReasoningBrainRepository(supabase),
    marketingIntelligenceBrain: new WriteThroughMarketingIntelligenceBrainRepository(supabase),
    strategyBrain: new WriteThroughStrategyBrainRepository(supabase),
    planningBrain: new WriteThroughPlanningBrainRepository(supabase),
    creative: new WriteThroughCreativeRepository(supabase),
    validation: new WriteThroughValidationRepository(supabase),
    memory: new WriteThroughMemoryRepository(supabase),
    execution: new WriteThroughExecutionRepository(supabase),
    learningBrain: new WriteThroughLearningBrainRepository(supabase),
    brand: new WriteThroughBrandRepository(supabase),
    projectEpisode: new WriteThroughProjectEpisodeRepository(supabase),
  };
}

/** Hydrate module-scoped stores from Supabase after process restart. */
export async function hydrateLayerStoresFromSupabase(
  supabase: AppSupabaseClient,
  input: { organizationId: string; projectId?: string }
): Promise<void> {
  const bundle = createSupabaseLayerRepositories(supabase);

  if (input.projectId) {
    const episode = await loadProjectEpisode(supabase, {
      organizationId: input.organizationId,
      projectId: input.projectId,
    });
    if (episode) {
      bundle.projectEpisode.save(episode);
    }
  }

  const memories = await loadOrgMemoryRecords(supabase, input.organizationId);
  if (memories.length > 0) {
    const { orgMemoryIndex } = await import("./stores");
    orgMemoryIndex.set(input.organizationId, [...memories]);
  }
}
