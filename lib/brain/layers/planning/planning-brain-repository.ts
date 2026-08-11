/**
 * Planning Brain — versioned persistence.
 */

import type {
  PlanningBrainGraph,
  PlanningHistory,
  PlanningHistoryEntry,
  PlanningRun,
  PlanningSnapshot,
} from "./brain-types";

export type PlanningBrainRepository = {
  storeSnapshot(snapshot: PlanningSnapshot): void;
  getSnapshot(id: string): PlanningSnapshot | null;
  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): PlanningSnapshot | null;
  storeRun(run: PlanningRun): void;
  getRun(id: string): PlanningRun | null;
  getHistory(input: { organizationId: string; projectId?: string }): PlanningHistory;
  appendHistory(
    entry: PlanningHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void;
  clear(): void;
};

export class InMemoryPlanningBrainRepository implements PlanningBrainRepository {
  private snapshots = new Map<string, PlanningSnapshot>();
  private runs = new Map<string, PlanningRun>();
  private histories = new Map<string, PlanningHistory>();

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

  storeSnapshot(snapshot: PlanningSnapshot): void {
    this.snapshots.set(snapshot.id, snapshot);
    this.snapshots.set(`latest:${this.indexKey(snapshot)}`, snapshot);
  }

  getSnapshot(id: string): PlanningSnapshot | null {
    return this.snapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): PlanningSnapshot | null {
    return this.snapshots.get(`latest:${this.indexKey(input)}`) ?? null;
  }

  storeRun(run: PlanningRun): void {
    this.runs.set(run.id, run);
  }

  getRun(id: string): PlanningRun | null {
    return this.runs.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): PlanningHistory {
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
    entry: PlanningHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void {
    const key = `${input.organizationId}:${input.projectId ?? "org"}`;
    const current = this.getHistory(input);
    this.histories.set(key, { ...current, entries: [...current.entries, entry] });
  }
}

let defaultRepository: InMemoryPlanningBrainRepository | null = null;

export function getDefaultPlanningBrainRepository(): PlanningBrainRepository {
  if (!defaultRepository) defaultRepository = new InMemoryPlanningBrainRepository();
  return defaultRepository;
}

export function resetDefaultPlanningBrainRepository(): void {
  defaultRepository?.clear();
  defaultRepository = null;
}

export type { PlanningBrainGraph, PlanningSnapshot, PlanningRun, PlanningHistory };
