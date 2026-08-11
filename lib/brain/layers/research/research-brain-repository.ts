/**
 * Research Brain — versioned persistence.
 * Research is historical; separate from Memory and Company truth.
 */

import type {
  ResearchBrainGraph,
  ResearchHistory,
  ResearchHistoryEntry,
  ResearchRun,
  ResearchSnapshot,
} from "./brain-types";
import type { ResearchGraph } from "./types";
import type { ResearchRecord, ResearchRecordKey, ResearchRepository } from "./research-repository";

export type ResearchBrainRecordKey = {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
  runId?: string;
};

export type ResearchBrainRepository = ResearchRepository & {
  storeSnapshot(snapshot: ResearchSnapshot): void;
  getSnapshot(id: string): ResearchSnapshot | null;
  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): ResearchSnapshot | null;
  storeRun(run: ResearchRun): void;
  getRun(id: string): ResearchRun | null;
  getHistory(input: { organizationId: string; projectId?: string }): ResearchHistory;
  appendHistory(entry: ResearchHistoryEntry, input: {
    organizationId: string;
    projectId?: string;
  }): void;
};

export class InMemoryResearchBrainRepository implements ResearchBrainRepository {
  private legacyRecords = new Map<string, ResearchRecord>();
  private snapshots = new Map<string, ResearchSnapshot>();
  private runs = new Map<string, ResearchRun>();
  private histories = new Map<string, ResearchHistory>();

  private legacyKey(key: ResearchRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.correlationId ?? "latest"}`;
  }

  private snapshotIndexKey(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): string {
    return `${input.organizationId}:${input.projectId ?? "org"}:${input.campaignId ?? "none"}`;
  }

  store(record: ResearchRecord): void {
    this.legacyRecords.set(this.legacyKey(record.key), record);
  }

  get(key: ResearchRecordKey): ResearchRecord | null {
    return this.legacyRecords.get(this.legacyKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): ResearchRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: ResearchRecordKey): boolean {
    return this.legacyRecords.delete(this.legacyKey(key));
  }

  clear(): void {
    this.legacyRecords.clear();
    this.snapshots.clear();
    this.runs.clear();
    this.histories.clear();
  }

  storeSnapshot(snapshot: ResearchSnapshot): void {
    this.snapshots.set(snapshot.id, snapshot);
    const indexKey = this.snapshotIndexKey(snapshot);
    this.snapshots.set(`latest:${indexKey}`, snapshot);
  }

  getSnapshot(id: string): ResearchSnapshot | null {
    return this.snapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): ResearchSnapshot | null {
    const indexKey = this.snapshotIndexKey(input);
    return this.snapshots.get(`latest:${indexKey}`) ?? null;
  }

  storeRun(run: ResearchRun): void {
    this.runs.set(run.id, run);
  }

  getRun(id: string): ResearchRun | null {
    return this.runs.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): ResearchHistory {
    const key = `${input.organizationId}:${input.projectId ?? "org"}`;
    return this.histories.get(key) ?? { organizationId: input.organizationId, projectId: input.projectId, entries: [] };
  }

  appendHistory(
    entry: ResearchHistoryEntry,
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

let defaultBrainRepository: ResearchBrainRepository | null = null;

export function getDefaultResearchBrainRepository(): ResearchBrainRepository {
  if (!defaultBrainRepository) {
    defaultBrainRepository = new InMemoryResearchBrainRepository();
  }
  return defaultBrainRepository;
}

export function resetDefaultResearchBrainRepository(): void {
  defaultBrainRepository?.clear();
  defaultBrainRepository = null;
}

/** Bridge legacy ResearchGraph into brain repository when needed. */
export function legacyGraphToRecord(input: {
  graph: ResearchGraph;
  key: ResearchRecordKey;
}): ResearchRecord {
  return {
    key: input.key,
    graph: input.graph,
    storedAt: new Date().toISOString(),
  };
}
