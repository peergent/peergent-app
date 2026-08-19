/**
 * Strategy Brain Layer — produce, validate, persist.
 */

import type {
  StrategyBrainInput,
  StrategyBrainOutput,
  StrategyHistoryEntry,
  StrategyRun,
  StrategySnapshot,
} from "./brain-types";
import { STRATEGY_BRAIN_VERSION } from "./brain-types";
import { buildStrategyBrainGraph } from "./strategy-brain-graph";
import { mapStrategyBrainToStructuredOutput } from "./map-strategy-brain-to-output";
import { validateStrategyBrainGraph } from "./strategy-validator";
import {
  getDefaultStrategyBrainRepository,
  type StrategyBrainRepository,
} from "./strategy-brain-repository";
import { hasBlockingEscalation } from "./strategy-escalations";

let snapshotCounter = 0;
let runIdCounter = 0;

export function resetStrategyBrainLayerCounters(): void {
  snapshotCounter = 0;
  runIdCounter = 0;
}

export class StrategyBrainLayer {
  constructor(
    private readonly repository: StrategyBrainRepository = getDefaultStrategyBrainRepository()
  ) {}

  async produce(input: StrategyBrainInput): Promise<StrategyBrainOutput> {
    return this.persistGraph(input, buildStrategyBrainGraph(input));
  }

  async persistGraph(
    input: StrategyBrainInput,
    graph: import("./brain-types").StrategyBrainGraph
  ): Promise<StrategyBrainOutput> {
    runIdCounter += 1;
    const runId = `strat-run-${runIdCounter}`;
    const startedAt = new Date().toISOString();

    const run: StrategyRun = {
      id: runId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      startedAt,
      completedAt: null,
      status: "running",
      snapshotId: null,
    };
    this.repository.storeRun(run);

    const validation = validateStrategyBrainGraph(graph);

    if (!validation.valid) {
      const failedRun: StrategyRun = {
        ...run,
        completedAt: new Date().toISOString(),
        status: "failed",
      };
      this.repository.storeRun(failedRun);
      throw new Error(`Strategy validation failed: ${validation.errors.join(", ")}`);
    }

    snapshotCounter += 1;
    const snapshotId = `stratsnap-${snapshotCounter}`;
    const outputRef = `strategy:${input.organizationId}:${snapshotId}`;

    const snapshot: StrategySnapshot = {
      id: snapshotId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      graph,
      outputRef,
      storedAt: new Date().toISOString(),
    };

    this.repository.storeSnapshot(snapshot);

    const historyEntry: StrategyHistoryEntry = {
      runId,
      snapshotId,
      version: snapshotCounter,
      storedAt: snapshot.storedAt,
      changeReason: input.projectObjective ?? "Strategy brain run",
    };
    this.repository.appendHistory(historyEntry, {
      organizationId: input.organizationId,
      projectId: input.projectId,
    });

    const blocked = hasBlockingEscalation(graph.escalations);
    const completedRun: StrategyRun = {
      ...run,
      completedAt: snapshot.storedAt,
      status: blocked ? "blocked" : "completed",
      snapshotId,
    };
    this.repository.storeRun(completedRun);

    const structuredOutput = mapStrategyBrainToStructuredOutput(graph, snapshot.storedAt);

    return {
      graph,
      structuredOutput,
      outputRef,
      snapshot,
      run: completedRun,
    };
  }
}

export function createStrategyBrainLayer(
  repository?: StrategyBrainRepository
): StrategyBrainLayer {
  return new StrategyBrainLayer(repository);
}

export function buildStrategyBrainGraphOutput(input: StrategyBrainInput): Promise<StrategyBrainOutput> {
  return createStrategyBrainLayer().produce(input);
}

export { STRATEGY_BRAIN_VERSION };
