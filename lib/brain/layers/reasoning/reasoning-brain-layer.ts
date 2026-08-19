/**
 * Reasoning Brain Layer — produce, validate, persist.
 * Reads Company, Research, Memory; never writes any of them.
 */

import type {
  ReasoningBrainInput,
  ReasoningBrainOutput,
  ReasoningHistoryEntry,
  ReasoningRun,
  ReasoningSnapshot,
} from "./brain-types";
import { REASONING_BRAIN_VERSION } from "./brain-types";
import { buildReasoningBrainGraph } from "./reasoning-graph";
import { mapReasoningGraphToStructuredOutput } from "./map-reasoning-graph-to-output";
import { validateReasoningBrainGraph } from "./reasoning-validator";
import {
  getDefaultReasoningBrainRepository,
  type ReasoningBrainRepository,
} from "./reasoning-brain-repository";

let snapshotCounter = 0;
let runIdCounter = 0;

export function resetReasoningBrainLayerCounters(): void {
  snapshotCounter = 0;
  runIdCounter = 0;
}

export class ReasoningBrainLayer {
  constructor(
    private readonly repository: ReasoningBrainRepository = getDefaultReasoningBrainRepository()
  ) {}

  async produce(input: ReasoningBrainInput): Promise<ReasoningBrainOutput> {
    return this.persistGraph(input, buildReasoningBrainGraph(input));
  }

  async persistGraph(
    input: ReasoningBrainInput,
    graph: import("./brain-types").ReasoningBrainGraph
  ): Promise<ReasoningBrainOutput> {
    runIdCounter += 1;
    const runId = `rsn-run-${runIdCounter}`;
    const startedAt = new Date().toISOString();

    const run: ReasoningRun = {
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

    const validation = validateReasoningBrainGraph(graph);

    if (!validation.valid) {
      const failedRun: ReasoningRun = {
        ...run,
        completedAt: new Date().toISOString(),
        status: "failed",
      };
      this.repository.storeRun(failedRun);
      throw new Error(`Reasoning validation failed: ${validation.errors.join(", ")}`);
    }

    snapshotCounter += 1;
    const snapshotId = `rsnap-${snapshotCounter}`;
    const outputRef = `reasoning:${input.organizationId}:${snapshotId}`;

    const snapshot: ReasoningSnapshot = {
      id: snapshotId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      graph,
      outputRef,
      storedAt: new Date().toISOString(),
    };

    this.repository.storeSnapshot(snapshot);

    const historyEntry: ReasoningHistoryEntry = {
      runId,
      snapshotId,
      version: snapshotCounter,
      storedAt: snapshot.storedAt,
      changeReason: input.projectObjective ?? "Reasoning brain run",
    };
    this.repository.appendHistory(historyEntry, {
      organizationId: input.organizationId,
      projectId: input.projectId,
    });

    const completedRun: ReasoningRun = {
      ...run,
      completedAt: snapshot.storedAt,
      status: "completed",
      snapshotId,
    };
    this.repository.storeRun(completedRun);

    const structuredOutput = mapReasoningGraphToStructuredOutput(graph, snapshot.storedAt);

    return {
      graph,
      structuredOutput,
      outputRef,
      snapshot,
      run: completedRun,
    };
  }

  getLatestSnapshot(input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }): ReasoningSnapshot | null {
    return this.repository.getLatestSnapshot(input);
  }
}

export function createReasoningBrainLayer(
  repository?: ReasoningBrainRepository
): ReasoningBrainLayer {
  return new ReasoningBrainLayer(repository);
}

export function collectReasoningBrainGraph(input: ReasoningBrainInput): Promise<ReasoningBrainOutput> {
  return createReasoningBrainLayer().produce(input);
}

export { REASONING_BRAIN_VERSION };
