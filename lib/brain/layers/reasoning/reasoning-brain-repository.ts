/**
 * Reasoning Brain — versioned persistence.
 */

import type {
  ReasoningBrainGraph,
  ReasoningHistory,
  ReasoningHistoryEntry,
  ReasoningRun,
  ReasoningSnapshot,
} from "./brain-types";
import { readLatestSnapshot } from "../../persistence/layer/snapshot-index-keys";
import type { ReasoningRecord, ReasoningRecordKey, ReasoningRepository } from "./reasoning-repository";

export type ReasoningBrainRepository = ReasoningRepository & {
  storeSnapshot(snapshot: ReasoningSnapshot): void;
  getSnapshot(id: string): ReasoningSnapshot | null;
  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): ReasoningSnapshot | null;
  storeRun(run: ReasoningRun): void;
  getRun(id: string): ReasoningRun | null;
  getHistory(input: { organizationId: string; projectId?: string }): ReasoningHistory;
  appendHistory(
    entry: ReasoningHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void;
};

export class InMemoryReasoningBrainRepository implements ReasoningBrainRepository {
  private legacyRecords = new Map<string, ReasoningRecord>();
  private snapshots = new Map<string, ReasoningSnapshot>();
  private runs = new Map<string, ReasoningRun>();
  private histories = new Map<string, ReasoningHistory>();

  private legacyKey(key: ReasoningRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.correlationId ?? "latest"}`;
  }

  private snapshotIndexKey(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): string {
    return `${input.organizationId}:${input.projectId ?? "org"}:${input.campaignId ?? "none"}`;
  }

  store(record: ReasoningRecord): void {
    this.legacyRecords.set(this.legacyKey(record.key), record);
  }

  get(key: ReasoningRecordKey): ReasoningRecord | null {
    return this.legacyRecords.get(this.legacyKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): ReasoningRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: ReasoningRecordKey): boolean {
    return this.legacyRecords.delete(this.legacyKey(key));
  }

  clear(): void {
    this.legacyRecords.clear();
    this.snapshots.clear();
    this.runs.clear();
    this.histories.clear();
  }

  storeSnapshot(snapshot: ReasoningSnapshot): void {
    this.snapshots.set(snapshot.id, snapshot);
    this.snapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
  }

  getSnapshot(id: string): ReasoningSnapshot | null {
    return this.snapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): ReasoningSnapshot | null {
    return readLatestSnapshot(this.snapshots, input);
  }

  storeRun(run: ReasoningRun): void {
    this.runs.set(run.id, run);
  }

  getRun(id: string): ReasoningRun | null {
    return this.runs.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): ReasoningHistory {
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
    entry: ReasoningHistoryEntry,
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

export function getDefaultReasoningBrainRepository(): ReasoningBrainRepository {
  return getLayerRepositories().reasoningBrain;
}

export function resetDefaultReasoningBrainRepository(): void {
  resetConfiguredLayerRepositories();
}

export function legacyGraphToRecord(input: {
  graph: import("./types").ReasoningGraph;
  key: ReasoningRecordKey;
}): ReasoningRecord {
  return {
    key: input.key,
    graph: input.graph,
    storedAt: new Date().toISOString(),
  };
}

export type { ReasoningBrainGraph };
