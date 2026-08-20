/**
 * Marketing Intelligence Brain — versioned persistence.
 */

import type {
  MarketingIntelligenceBrainGraph,
  MarketingIntelligenceHistory,
  MarketingIntelligenceHistoryEntry,
  MarketingIntelligenceRun,
  MarketingIntelligenceSnapshot,
} from "./brain-types";
import { readLatestSnapshot } from "../../persistence/layer/snapshot-index-keys";
import type {
  MarketingIntelligenceRecord,
  MarketingIntelligenceRecordKey,
  MarketingIntelligenceRepository,
} from "./marketing-intelligence-repository";

export type MarketingIntelligenceBrainRepository = MarketingIntelligenceRepository & {
  storeSnapshot(snapshot: MarketingIntelligenceSnapshot): void;
  getSnapshot(id: string): MarketingIntelligenceSnapshot | null;
  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): MarketingIntelligenceSnapshot | null;
  storeRun(run: MarketingIntelligenceRun): void;
  getRun(id: string): MarketingIntelligenceRun | null;
  getHistory(input: { organizationId: string; projectId?: string }): MarketingIntelligenceHistory;
  appendHistory(
    entry: MarketingIntelligenceHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void;
};

export class InMemoryMarketingIntelligenceBrainRepository implements MarketingIntelligenceBrainRepository {
  private legacyRecords = new Map<string, MarketingIntelligenceRecord>();
  private snapshots = new Map<string, MarketingIntelligenceSnapshot>();
  private runs = new Map<string, MarketingIntelligenceRun>();
  private histories = new Map<string, MarketingIntelligenceHistory>();

  private legacyKey(key: MarketingIntelligenceRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.correlationId ?? "latest"}`;
  }

  private snapshotIndexKey(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): string {
    return `${input.organizationId}:${input.projectId ?? "org"}:${input.campaignId ?? "none"}`;
  }

  store(record: MarketingIntelligenceRecord): void {
    this.legacyRecords.set(this.legacyKey(record.key), record);
  }

  getLatest(input: { organizationId: string; campaignId?: string }): MarketingIntelligenceRecord | null {
    return this.legacyRecords.get(this.legacyKey(input)) ?? null;
  }

  clear(): void {
    this.legacyRecords.clear();
    this.snapshots.clear();
    this.runs.clear();
    this.histories.clear();
  }

  storeSnapshot(snapshot: MarketingIntelligenceSnapshot): void {
    this.snapshots.set(snapshot.id, snapshot);
    this.snapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
  }

  getSnapshot(id: string): MarketingIntelligenceSnapshot | null {
    return this.snapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): MarketingIntelligenceSnapshot | null {
    return readLatestSnapshot(this.snapshots, input);
  }

  storeRun(run: MarketingIntelligenceRun): void {
    this.runs.set(run.id, run);
  }

  getRun(id: string): MarketingIntelligenceRun | null {
    return this.runs.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): MarketingIntelligenceHistory {
    const key = `${input.organizationId}:${input.projectId ?? "org"}`;
    return (
      this.histories.get(key) ?? {
        organizationId: input.organizationId,
        projectId: input.projectId,
        entries: [],
      }
    );
  }

  appendHistory(
    entry: MarketingIntelligenceHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void {
    const key = `${input.organizationId}:${input.projectId ?? "org"}`;
    const current = this.getHistory(input);
    this.histories.set(key, {
      organizationId: input.organizationId,
      projectId: input.projectId,
      entries: [...current.entries, entry],
    });
  }
}

import {
  getLayerRepositories,
  resetConfiguredLayerRepositories,
} from "../../persistence/layer-repository-factory";

export function getDefaultMarketingIntelligenceBrainRepository(): MarketingIntelligenceBrainRepository {
  return getLayerRepositories().marketingIntelligenceBrain;
}

export function resetDefaultMarketingIntelligenceBrainRepository(): void {
  resetConfiguredLayerRepositories();
}

export type { MarketingIntelligenceBrainGraph };
