/**
 * Learning Brain — versioned persistence.
 */

import type {
  LearningBrainGraph,
  LearningHistory,
  LearningHistoryEntry,
  LearningRun,
  LearningSnapshot,
} from "./brain-types";

export type LearningBrainRepository = {
  storeSnapshot(snapshot: LearningSnapshot): void;
  getSnapshot(id: string): LearningSnapshot | null;
  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): LearningSnapshot | null;
  storeRun(run: LearningRun): void;
  getRun(id: string): LearningRun | null;
  getHistory(input: { organizationId: string; projectId?: string }): LearningHistory;
  appendHistory(
    entry: LearningHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void;
  clear(): void;
};

export class InMemoryLearningBrainRepository implements LearningBrainRepository {
  private snapshots = new Map<string, LearningSnapshot>();
  private runs = new Map<string, LearningRun>();
  private histories = new Map<string, LearningHistory>();

  private indexKey(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): string {
    return `${input.organizationId}:${input.projectId ?? "org"}:${input.campaignId ?? "none"}`;
  }

  clear(): void {
    this.snapshots.clear();
    this.runs.clear();
    this.histories.clear();
  }

  storeSnapshot(snapshot: LearningSnapshot): void {
    this.snapshots.set(snapshot.id, snapshot);
    this.snapshots.set(`latest:${this.indexKey(snapshot)}`, snapshot);
  }

  getSnapshot(id: string): LearningSnapshot | null {
    return this.snapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): LearningSnapshot | null {
    return this.snapshots.get(`latest:${this.indexKey(input)}`) ?? null;
  }

  storeRun(run: LearningRun): void {
    this.runs.set(run.id, run);
  }

  getRun(id: string): LearningRun | null {
    return this.runs.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): LearningHistory {
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
    entry: LearningHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void {
    const key = `${input.organizationId}:${input.projectId ?? "org"}`;
    const current = this.getHistory(input);
    this.histories.set(key, { ...current, entries: [...current.entries, entry] });
  }
}

let defaultRepository: InMemoryLearningBrainRepository | null = null;

export function getDefaultLearningBrainRepository(): LearningBrainRepository {
  if (!defaultRepository) defaultRepository = new InMemoryLearningBrainRepository();
  return defaultRepository;
}

export function resetDefaultLearningBrainRepository(): void {
  defaultRepository?.clear();
  defaultRepository = null;
}

export type { LearningBrainGraph, LearningSnapshot, LearningRun, LearningHistory };
