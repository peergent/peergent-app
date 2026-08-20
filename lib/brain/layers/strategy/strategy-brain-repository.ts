/**
 * Strategy Brain — versioned persistence.
 */

import type {
  StrategyBrainGraph,
  StrategyHistory,
  StrategyHistoryEntry,
  StrategyRun,
  StrategySnapshot,
} from "./brain-types";
import { readLatestSnapshot } from "../../persistence/layer/snapshot-index-keys";

export type StrategyBrainRepository = {
  storeSnapshot(snapshot: StrategySnapshot): void;
  getSnapshot(id: string): StrategySnapshot | null;
  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): StrategySnapshot | null;
  storeRun(run: StrategyRun): void;
  getRun(id: string): StrategyRun | null;
  getHistory(input: { organizationId: string; projectId?: string }): StrategyHistory;
  appendHistory(
    entry: StrategyHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void;
  clear(): void;
};

export class InMemoryStrategyBrainRepository implements StrategyBrainRepository {
  private snapshots = new Map<string, StrategySnapshot>();
  private runs = new Map<string, StrategyRun>();
  private histories = new Map<string, StrategyHistory>();

  private snapshotIndexKey(input: {
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

  storeSnapshot(snapshot: StrategySnapshot): void {
    this.snapshots.set(snapshot.id, snapshot);
    this.snapshots.set(`latest:${this.snapshotIndexKey(snapshot)}`, snapshot);
  }

  getSnapshot(id: string): StrategySnapshot | null {
    return this.snapshots.get(id) ?? null;
  }

  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): StrategySnapshot | null {
    return readLatestSnapshot(this.snapshots, input);
  }

  storeRun(run: StrategyRun): void {
    this.runs.set(run.id, run);
  }

  getRun(id: string): StrategyRun | null {
    return this.runs.get(id) ?? null;
  }

  getHistory(input: { organizationId: string; projectId?: string }): StrategyHistory {
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
    entry: StrategyHistoryEntry,
    input: { organizationId: string; projectId?: string }
  ): void {
    const key = `${input.organizationId}:${input.projectId ?? "org"}`;
    const current = this.getHistory(input);
    this.histories.set(key, {
      ...current,
      entries: [...current.entries, entry],
    });
  }
}

import {
  getLayerRepositories,
  resetConfiguredLayerRepositories,
} from "../../persistence/layer-repository-factory";

export function getDefaultStrategyBrainRepository(): StrategyBrainRepository {
  return getLayerRepositories().strategyBrain;
}

export function resetDefaultStrategyBrainRepository(): void {
  resetConfiguredLayerRepositories();
}

export type { StrategyBrainGraph, StrategySnapshot, StrategyRun, StrategyHistory };
