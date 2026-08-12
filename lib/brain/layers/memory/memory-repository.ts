import type { MemoryGraph, MemoryRecord, MemorySnapshot } from "./types";
import {
  getLayerRepositories,
  resetConfiguredLayerRepositories,
} from "../../persistence/layer-repository-factory";

export type MemoryRecordKey = {
  organizationId: string;
  campaignId?: string;
  episodeId?: string;
  correlationId?: string;
};

export type MemoryStoreRecord = {
  key: MemoryRecordKey;
  graph: MemoryGraph;
  outputRef: string;
  storedAt: string;
  snapshot: MemorySnapshot;
};

export type MemoryRepository = {
  store(record: MemoryStoreRecord): void;
  get(key: MemoryRecordKey): MemoryStoreRecord | null;
  getLatest(input: { organizationId: string; campaignId?: string }): MemoryStoreRecord | null;
  getOrgMemories(organizationId: string): readonly MemoryRecord[];
  delete(key: MemoryRecordKey): boolean;
  clear(): void;
};

export class InMemoryMemoryRepository implements MemoryRepository {
  private records = new Map<string, MemoryStoreRecord>();
  private orgMemories = new Map<string, MemoryRecord[]>();

  private serializeKey(key: MemoryRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.episodeId ?? "ep"}:${key.correlationId ?? "latest"}`;
  }

  store(record: MemoryStoreRecord): void {
    this.records.set(this.serializeKey(record.key), record);
    if (record.key.campaignId) {
      this.records.set(
        this.serializeKey({
          organizationId: record.key.organizationId,
          campaignId: record.key.campaignId,
        }),
        record
      );
    }

    const orgId = record.key.organizationId;
    const existing = this.orgMemories.get(orgId) ?? [];
    const byId = new Map(existing.map((m) => [m.id, m]));
    for (const mem of record.graph.memories) {
      byId.set(mem.id, mem);
    }
    this.orgMemories.set(orgId, [...byId.values()]);
  }

  get(key: MemoryRecordKey): MemoryStoreRecord | null {
    return this.records.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): MemoryStoreRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  getOrgMemories(organizationId: string): readonly MemoryRecord[] {
    return this.orgMemories.get(organizationId) ?? [];
  }

  delete(key: MemoryRecordKey): boolean {
    return this.records.delete(this.serializeKey(key));
  }

  clear(): void {
    this.records.clear();
    this.orgMemories.clear();
  }
}

export function getDefaultMemoryRepository(): MemoryRepository {
  return getLayerRepositories().memory;
}

export function resetDefaultMemoryRepository(): void {
  resetConfiguredLayerRepositories();
}
