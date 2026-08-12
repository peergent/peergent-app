/**
 * Persistent in-memory layer repositories — module-scoped stores survive instance recreation.
 * Used for tests and as L1 cache in Supabase mode.
 */

import type { CompanyRepository, CompanyStoreRecord } from "../../layers/company/company-repository";
import type { CompanyHistory, CompanyHistoryEntry } from "../../layers/company/types";
import type {
  ResearchBrainRepository,
} from "../../layers/research/research-brain-repository";
import type { ResearchRecord, ResearchRecordKey, ResearchRepository } from "../../layers/research/research-repository";
import type {
  ResearchHistory,
  ResearchHistoryEntry,
  ResearchRun,
  ResearchSnapshot,
} from "../../layers/research/brain-types";
import type { ReasoningBrainRepository } from "../../layers/reasoning/reasoning-brain-repository";
import type { ReasoningRecord, ReasoningRecordKey, ReasoningRepository } from "../../layers/reasoning/reasoning-repository";
import type {
  ReasoningHistory,
  ReasoningHistoryEntry,
  ReasoningRun,
  ReasoningSnapshot,
} from "../../layers/reasoning/brain-types";
import type { MarketingIntelligenceBrainRepository } from "../../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import type {
  MarketingIntelligenceRecord,
  MarketingIntelligenceRepository,
} from "../../layers/marketing-intelligence/marketing-intelligence-repository";
import type {
  MarketingIntelligenceHistory,
  MarketingIntelligenceHistoryEntry,
  MarketingIntelligenceRun,
  MarketingIntelligenceSnapshot,
} from "../../layers/marketing-intelligence/brain-types";
import type { StrategyBrainRepository } from "../../layers/strategy/strategy-brain-repository";
import type {
  StrategyHistory,
  StrategyHistoryEntry,
  StrategyRun,
  StrategySnapshot,
} from "../../layers/strategy/brain-types";
import type { PlanningBrainRepository } from "../../layers/planning/planning-brain-repository";
import type { PlanningRecord, PlanningRecordKey, PlanningRepository } from "../../layers/planning/planning-repository";
import type {
  PlanningHistory,
  PlanningHistoryEntry,
  PlanningRun,
  PlanningSnapshot,
} from "../../layers/planning/brain-types";
import type { CreativeRecord, CreativeRecordKey, CreativeRepository } from "../../layers/creative/creative-repository";
import type { ValidationRecord, ValidationRecordKey, ValidationRepository } from "../../layers/validation/validation-repository";
import type { MemoryRecordKey, MemoryRepository, MemoryStoreRecord } from "../../layers/memory/memory-repository";
import type { MemoryRecord } from "../../layers/memory/types";
import type { ExecutionRecordKey, ExecutionRepository, ExecutionStoreRecord } from "../../layers/execution/execution-repository";
import type { LearningBrainRepository } from "../../layers/learning/learning-brain-repository";
import type {
  LearningHistory,
  LearningHistoryEntry,
  LearningRun,
  LearningSnapshot,
} from "../../layers/learning/brain-types";
import type { BrandRecord, BrandRecordKey, BrandRepository } from "../../layers/brand/brand-repository";
import type { ProjectEpisodeRepository } from "../../project-runtime/project-episode-repository";
import type {
  ProjectApprovalRecord,
  ProjectEpisodeRecord,
  ProjectRuntimeEvent,
  StoredPerformanceObservation,
} from "../../project-runtime/types";
import { outputRefKey, projectScopeKey, recordKey } from "./scope-keys";
import {
  companyLatest,
  companyVersions,
  creativeRecords,
  executionIdempotencyIndex,
  executionRecords,
  learningHistories,
  learningRuns,
  learningSnapshots,
  memoryRecords,
  miHistories,
  miRecords,
  miRuns,
  miSnapshots,
  orgMemoryIndex,
  outputRefIndex,
  planningHistories,
  planningRecords,
  planningRuns,
  planningSnapshots,
  projectApprovals,
  projectEpisodes,
  projectEvents,
  projectObservations,
  reasoningHistories,
  reasoningRecords,
  reasoningRuns,
  reasoningSnapshots,
  researchHistories,
  researchRecords,
  researchRuns,
  researchSnapshots,
  strategyHistories,
  strategyRuns,
  strategySnapshots,
  validationRecords,
  brandRecords,
} from "./stores";

function indexOutputRef(organizationId: string, outputRef: string, payload: unknown): void {
  outputRefIndex.set(outputRefKey(organizationId, outputRef), payload);
}

export class PersistentCompanyRepository implements CompanyRepository {
  store(record: CompanyStoreRecord): void {
    companyLatest.set(record.organizationId, record);
    companyVersions.set(recordKey([record.organizationId, `v${record.graph.versionMeta.version}`]), record);
    indexOutputRef(record.organizationId, record.outputRef, record);
  }

  getLatest(organizationId: string): CompanyStoreRecord | null {
    return companyLatest.get(organizationId) ?? null;
  }

  getVersion(input: { organizationId: string; version: number }): CompanyStoreRecord | null {
    return companyVersions.get(recordKey([input.organizationId, `v${input.version}`])) ?? null;
  }

  getHistory(organizationId: string): CompanyHistory {
    return companyLatest.get(organizationId)?.history ?? { organizationId, entries: [] };
  }

  clear(): void {
    companyLatest.clear();
    companyVersions.clear();
  }
}

export class PersistentResearchBrainRepository implements ResearchBrainRepository {
  private legacyKey(key: ResearchRecordKey): string {
    return recordKey([key.organizationId, key.campaignId ?? "org", key.correlationId ?? "latest"]);
  }

  private snapshotIndexKey(input: { organizationId: string; projectId?: string; campaignId?: string }): string {
    return projectScopeKey(input);
  }

  store(record: ResearchRecord): void {
    researchRecords.set(this.legacyKey(record.key), record);
  }

  get(key: ResearchRecordKey): ResearchRecord | null {
    return researchRecords.get(this.legacyKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): ResearchRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: ResearchRecordKey): boolean {
    return researchRecords.delete(this.legacyKey(key));
  }

  storeSnapshot(snapshot: ResearchSnapshot): void {
    researchSnapshots.set(snapshot.id, snapshot);
    researchSnapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
    indexOutputRef(snapshot.organizationId, snapshot.outputRef, snapshot);
  }

  getSnapshot(id: string): ResearchSnapshot | null {
    return researchSnapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: { organizationId: string; projectId?: string; campaignId?: string }): ResearchSnapshot | null {
    return researchSnapshots.get(`latest:${this.snapshotIndexKey(input)}`) ?? null;
  }

  storeRun(run: ResearchRun): void {
    researchRuns.set(run.id, run);
  }

  getRun(id: string): ResearchRun | null {
    return researchRuns.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): ResearchHistory {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    return researchHistories.get(key) ?? { organizationId: input.organizationId, projectId: input.projectId, entries: [] };
  }

  appendHistory(entry: ResearchHistoryEntry, input: { organizationId: string; projectId?: string }): void {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    const current = this.getHistory(input);
    researchHistories.set(key, { ...current, entries: [...current.entries, entry] });
  }

  clear(): void {
    researchRecords.clear();
    researchSnapshots.clear();
    researchRuns.clear();
    researchHistories.clear();
  }
}

export class PersistentReasoningBrainRepository implements ReasoningBrainRepository {
  private legacyKey(key: ReasoningRecordKey): string {
    return recordKey([key.organizationId, key.campaignId ?? "org", key.correlationId ?? "latest"]);
  }

  private snapshotIndexKey(input: { organizationId: string; projectId?: string; campaignId?: string }): string {
    return projectScopeKey(input);
  }

  store(record: ReasoningRecord): void {
    reasoningRecords.set(this.legacyKey(record.key), record);
  }

  get(key: ReasoningRecordKey): ReasoningRecord | null {
    return reasoningRecords.get(this.legacyKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): ReasoningRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: ReasoningRecordKey): boolean {
    return reasoningRecords.delete(this.legacyKey(key));
  }

  storeSnapshot(snapshot: ReasoningSnapshot): void {
    reasoningSnapshots.set(snapshot.id, snapshot);
    reasoningSnapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
    indexOutputRef(snapshot.organizationId, snapshot.outputRef, snapshot);
  }

  getSnapshot(id: string): ReasoningSnapshot | null {
    return reasoningSnapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: { organizationId: string; projectId?: string; campaignId?: string }): ReasoningSnapshot | null {
    return reasoningSnapshots.get(`latest:${this.snapshotIndexKey(input)}`) ?? null;
  }

  storeRun(run: ReasoningRun): void {
    reasoningRuns.set(run.id, run);
  }

  getRun(id: string): ReasoningRun | null {
    return reasoningRuns.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): ReasoningHistory {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    return reasoningHistories.get(key) ?? { organizationId: input.organizationId, projectId: input.projectId, entries: [] };
  }

  appendHistory(entry: ReasoningHistoryEntry, input: { organizationId: string; projectId?: string }): void {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    const current = this.getHistory(input);
    reasoningHistories.set(key, { ...current, entries: [...current.entries, entry] });
  }

  clear(): void {
    reasoningRecords.clear();
    reasoningSnapshots.clear();
    reasoningRuns.clear();
    reasoningHistories.clear();
  }
}

export class PersistentMarketingIntelligenceBrainRepository implements MarketingIntelligenceBrainRepository {
  private legacyKey(key: { organizationId: string; campaignId?: string; correlationId?: string }): string {
    return recordKey([key.organizationId, key.campaignId ?? "org", key.correlationId ?? "latest"]);
  }

  private snapshotIndexKey(input: { organizationId: string; projectId?: string; campaignId?: string }): string {
    return projectScopeKey(input);
  }

  store(record: MarketingIntelligenceRecord): void {
    miRecords.set(this.legacyKey(record.key), record);
  }

  get(key: { organizationId: string; campaignId?: string; correlationId?: string }): MarketingIntelligenceRecord | null {
    return miRecords.get(this.legacyKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): MarketingIntelligenceRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: { organizationId: string; campaignId?: string; correlationId?: string }): boolean {
    return miRecords.delete(this.legacyKey(key));
  }

  storeSnapshot(snapshot: MarketingIntelligenceSnapshot): void {
    miSnapshots.set(snapshot.id, snapshot);
    miSnapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
    indexOutputRef(snapshot.organizationId, snapshot.outputRef, snapshot);
  }

  getSnapshot(id: string): MarketingIntelligenceSnapshot | null {
    return miSnapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: { organizationId: string; projectId?: string; campaignId?: string }): MarketingIntelligenceSnapshot | null {
    return miSnapshots.get(`latest:${this.snapshotIndexKey(input)}`) ?? null;
  }

  storeRun(run: MarketingIntelligenceRun): void {
    miRuns.set(run.id, run);
  }

  getRun(id: string): MarketingIntelligenceRun | null {
    return miRuns.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): MarketingIntelligenceHistory {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    return miHistories.get(key) ?? { organizationId: input.organizationId, projectId: input.projectId, entries: [] };
  }

  appendHistory(entry: MarketingIntelligenceHistoryEntry, input: { organizationId: string; projectId?: string }): void {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    const current = this.getHistory(input);
    miHistories.set(key, { ...current, entries: [...current.entries, entry] });
  }

  clear(): void {
    miRecords.clear();
    miSnapshots.clear();
    miRuns.clear();
    miHistories.clear();
  }
}

export class PersistentStrategyBrainRepository implements StrategyBrainRepository {
  private snapshotIndexKey(input: { organizationId: string; projectId?: string; campaignId?: string }): string {
    return projectScopeKey(input);
  }

  storeSnapshot(snapshot: StrategySnapshot): void {
    strategySnapshots.set(snapshot.id, snapshot);
    strategySnapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
    indexOutputRef(snapshot.organizationId, snapshot.outputRef, snapshot);
  }

  getSnapshot(id: string): StrategySnapshot | null {
    return strategySnapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: { organizationId: string; projectId?: string; campaignId?: string }): StrategySnapshot | null {
    return strategySnapshots.get(`latest:${this.snapshotIndexKey(input)}`) ?? null;
  }

  storeRun(run: StrategyRun): void {
    strategyRuns.set(run.id, run);
  }

  getRun(id: string): StrategyRun | null {
    return strategyRuns.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): StrategyHistory {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    return strategyHistories.get(key) ?? { organizationId: input.organizationId, projectId: input.projectId, entries: [] };
  }

  appendHistory(entry: StrategyHistoryEntry, input: { organizationId: string; projectId?: string }): void {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    const current = this.getHistory(input);
    strategyHistories.set(key, { ...current, entries: [...current.entries, entry] });
  }

  clear(): void {
    strategySnapshots.clear();
    strategyRuns.clear();
    strategyHistories.clear();
  }
}

export class PersistentPlanningBrainRepository implements PlanningBrainRepository {
  private legacyKey(key: PlanningRecordKey): string {
    return recordKey([key.organizationId, key.campaignId ?? "org", key.correlationId ?? "latest"]);
  }

  private snapshotIndexKey(input: { organizationId: string; projectId?: string; campaignId?: string }): string {
    return projectScopeKey(input);
  }

  store(record: PlanningRecord): void {
    planningRecords.set(this.legacyKey(record.key), record);
  }

  get(key: PlanningRecordKey): PlanningRecord | null {
    return planningRecords.get(this.legacyKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): PlanningRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: PlanningRecordKey): boolean {
    return planningRecords.delete(this.legacyKey(key));
  }

  storeSnapshot(snapshot: PlanningSnapshot): void {
    planningSnapshots.set(snapshot.id, snapshot);
    planningSnapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
    indexOutputRef(snapshot.organizationId, snapshot.outputRef, snapshot);
  }

  getSnapshot(id: string): PlanningSnapshot | null {
    return planningSnapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: { organizationId: string; projectId?: string; campaignId?: string }): PlanningSnapshot | null {
    return planningSnapshots.get(`latest:${this.snapshotIndexKey(input)}`) ?? null;
  }

  storeRun(run: PlanningRun): void {
    planningRuns.set(run.id, run);
  }

  getRun(id: string): PlanningRun | null {
    return planningRuns.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): PlanningHistory {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    return planningHistories.get(key) ?? { organizationId: input.organizationId, projectId: input.projectId, entries: [] };
  }

  appendHistory(entry: PlanningHistoryEntry, input: { organizationId: string; projectId?: string }): void {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    const current = this.getHistory(input);
    planningHistories.set(key, { ...current, entries: [...current.entries, entry] });
  }

  clear(): void {
    planningRecords.clear();
    planningSnapshots.clear();
    planningRuns.clear();
    planningHistories.clear();
  }
}

export class PersistentCreativeRepository implements CreativeRepository {
  private serializeKey(key: CreativeRecordKey): string {
    return recordKey([key.organizationId, key.campaignId ?? "org", key.episodeId ?? "ep", key.correlationId ?? "latest"]);
  }

  store(record: CreativeRecord): void {
    creativeRecords.set(this.serializeKey(record.key), record);
    if (record.key.campaignId) {
      creativeRecords.set(
        this.serializeKey({ organizationId: record.key.organizationId, campaignId: record.key.campaignId }),
        record
      );
    }
    indexOutputRef(record.key.organizationId, record.outputRef, record);
  }

  get(key: CreativeRecordKey): CreativeRecord | null {
    return creativeRecords.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): CreativeRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: CreativeRecordKey): boolean {
    return creativeRecords.delete(this.serializeKey(key));
  }

  clear(): void {
    creativeRecords.clear();
  }
}

export class PersistentValidationRepository implements ValidationRepository {
  private serializeKey(key: ValidationRecordKey): string {
    return recordKey([key.organizationId, key.campaignId ?? "org", key.episodeId ?? "ep", key.correlationId ?? "latest"]);
  }

  store(record: ValidationRecord): void {
    validationRecords.set(this.serializeKey(record.key), record);
    if (record.key.campaignId) {
      validationRecords.set(
        this.serializeKey({ organizationId: record.key.organizationId, campaignId: record.key.campaignId }),
        record
      );
    }
    indexOutputRef(record.key.organizationId, record.outputRef, record);
  }

  get(key: ValidationRecordKey): ValidationRecord | null {
    return validationRecords.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): ValidationRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: ValidationRecordKey): boolean {
    return validationRecords.delete(this.serializeKey(key));
  }

  clear(): void {
    validationRecords.clear();
  }
}

export class PersistentMemoryRepository implements MemoryRepository {
  private serializeKey(key: MemoryRecordKey): string {
    return recordKey([key.organizationId, key.campaignId ?? "org", key.episodeId ?? "ep", key.correlationId ?? "latest"]);
  }

  store(record: MemoryStoreRecord): void {
    memoryRecords.set(this.serializeKey(record.key), record);
    if (record.key.campaignId) {
      memoryRecords.set(
        this.serializeKey({ organizationId: record.key.organizationId, campaignId: record.key.campaignId }),
        record
      );
    }
    indexOutputRef(record.key.organizationId, record.outputRef, record);

    const orgId = record.key.organizationId;
    const existing = orgMemoryIndex.get(orgId) ?? [];
    const byId = new Map(existing.map((m) => [m.id, m]));
    for (const mem of record.graph.memories) {
      byId.set(mem.id, mem);
    }
    orgMemoryIndex.set(orgId, [...byId.values()]);
  }

  get(key: MemoryRecordKey): MemoryStoreRecord | null {
    return memoryRecords.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): MemoryStoreRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  getOrgMemories(organizationId: string): readonly MemoryRecord[] {
    return orgMemoryIndex.get(organizationId) ?? [];
  }

  delete(key: MemoryRecordKey): boolean {
    return memoryRecords.delete(this.serializeKey(key));
  }

  clear(): void {
    memoryRecords.clear();
    orgMemoryIndex.clear();
  }
}

export class PersistentExecutionRepository implements ExecutionRepository {
  private serializeKey(key: ExecutionRecordKey): string {
    return recordKey([key.organizationId, key.projectId, key.episodeId ?? "ep", key.correlationId ?? "latest"]);
  }

  store(record: ExecutionStoreRecord): void {
    executionRecords.set(this.serializeKey(record.key), record);
    executionRecords.set(
      this.serializeKey({ organizationId: record.key.organizationId, projectId: record.key.projectId }),
      record
    );
    for (const key of record.idempotencyKeys) {
      executionIdempotencyIndex.set(recordKey([record.key.organizationId, key]), record);
    }
    executionIdempotencyIndex.set(
      recordKey([record.key.organizationId, record.batchIdempotencyKey]),
      record
    );
    indexOutputRef(record.key.organizationId, record.outputRef, record);
  }

  get(key: ExecutionRecordKey): ExecutionStoreRecord | null {
    return executionRecords.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; projectId: string }): ExecutionStoreRecord | null {
    return this.get({ organizationId: input.organizationId, projectId: input.projectId });
  }

  getByIdempotencyKey(input: { organizationId: string; idempotencyKey: string }): ExecutionStoreRecord | null {
    return executionIdempotencyIndex.get(recordKey([input.organizationId, input.idempotencyKey])) ?? null;
  }

  clear(): void {
    executionRecords.clear();
    executionIdempotencyIndex.clear();
  }
}

export class PersistentLearningBrainRepository implements LearningBrainRepository {
  private snapshotIndexKey(input: { organizationId: string; projectId?: string; campaignId?: string }): string {
    return projectScopeKey(input);
  }

  storeSnapshot(snapshot: LearningSnapshot): void {
    learningSnapshots.set(snapshot.id, snapshot);
    learningSnapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
    indexOutputRef(snapshot.organizationId, snapshot.outputRef, snapshot);
  }

  getSnapshot(id: string): LearningSnapshot | null {
    return learningSnapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: { organizationId: string; projectId?: string; campaignId?: string }): LearningSnapshot | null {
    return learningSnapshots.get(`latest:${this.snapshotIndexKey(input)}`) ?? null;
  }

  storeRun(run: LearningRun): void {
    learningRuns.set(run.id, run);
  }

  getRun(id: string): LearningRun | null {
    return learningRuns.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): LearningHistory {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    return learningHistories.get(key) ?? { organizationId: input.organizationId, projectId: input.projectId, entries: [] };
  }

  appendHistory(entry: LearningHistoryEntry, input: { organizationId: string; projectId?: string }): void {
    const key = recordKey([input.organizationId, input.projectId ?? "org"]);
    const current = this.getHistory(input);
    learningHistories.set(key, { ...current, entries: [...current.entries, entry] });
  }

  clear(): void {
    learningSnapshots.clear();
    learningRuns.clear();
    learningHistories.clear();
  }
}

export class PersistentProjectEpisodeRepository implements ProjectEpisodeRepository {
  private key(orgId: string, projectId: string): string {
    return recordKey([orgId, projectId]);
  }

  save(episode: ProjectEpisodeRecord): void {
    projectEpisodes.set(this.key(episode.snapshot.organizationId, episode.snapshot.projectId), episode);
  }

  get(input: { organizationId: string; projectId: string }): ProjectEpisodeRecord | null {
    return projectEpisodes.get(this.key(input.organizationId, input.projectId)) ?? null;
  }

  saveApproval(record: ProjectApprovalRecord): void {
    const list = projectApprovals.get(record.projectId) ?? [];
    const existing = list.findIndex((a) => a.id === record.id);
    if (existing >= 0) {
      const next = [...list];
      next[existing] = record;
      projectApprovals.set(record.projectId, next);
      return;
    }
    projectApprovals.set(record.projectId, [...list, record]);
  }

  getApprovals(projectId: string): readonly ProjectApprovalRecord[] {
    return projectApprovals.get(projectId) ?? [];
  }

  saveObservations(projectId: string, observations: readonly StoredPerformanceObservation[]): void {
    const list = projectObservations.get(projectId) ?? [];
    const seen = new Set(list.map((o) => o.id));
    const merged = [...list];
    for (const obs of observations) {
      if (!seen.has(obs.id)) merged.push(obs);
    }
    projectObservations.set(projectId, merged);
  }

  getObservations(projectId: string): readonly StoredPerformanceObservation[] {
    return projectObservations.get(projectId) ?? [];
  }

  listEvents(projectId: string): readonly ProjectRuntimeEvent[] {
    return projectEvents.get(projectId) ?? [];
  }

  appendEvent(projectId: string, event: ProjectRuntimeEvent): void {
    const list = projectEvents.get(projectId) ?? [];
    if (list.some((e) => e.eventId === event.eventId)) return;
    projectEvents.set(projectId, [...list, event]);
  }

  clear(): void {
    projectEpisodes.clear();
    projectApprovals.clear();
    projectObservations.clear();
    projectEvents.clear();
  }
}

/** Resolve outputRef after repository instance recreation. */
export function resolveOutputRefFromStore(organizationId: string, outputRef: string): unknown | null {
  return outputRefIndex.get(outputRefKey(organizationId, outputRef)) ?? null;
}

/** Legacy type aliases for factory */
export type PersistentResearchRepository = ResearchRepository;
export type PersistentReasoningRepository = ReasoningRepository;
export type PersistentMarketingIntelligenceRepository = MarketingIntelligenceRepository;
export type PersistentPlanningRepository = PlanningRepository;

export class PersistentResearchRepositoryAdapter extends PersistentResearchBrainRepository {}
export class PersistentReasoningRepositoryAdapter extends PersistentReasoningBrainRepository {}
export class PersistentMarketingIntelligenceRepositoryAdapter extends PersistentMarketingIntelligenceBrainRepository {}
export class PersistentPlanningRepositoryAdapter extends PersistentPlanningBrainRepository {}

export class PersistentBrandRepository implements BrandRepository {
  private serializeKey(key: BrandRecordKey): string {
    return recordKey([key.organizationId, key.campaignId ?? "org", key.correlationId ?? "latest"]);
  }

  store(record: BrandRecord): void {
    brandRecords.set(this.serializeKey(record.key), record);
  }

  get(key: BrandRecordKey): BrandRecord | null {
    return brandRecords.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): BrandRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: BrandRecordKey): boolean {
    return brandRecords.delete(this.serializeKey(key));
  }

  clear(): void {
    brandRecords.clear();
  }
}
