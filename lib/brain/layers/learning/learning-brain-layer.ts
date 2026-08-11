/**
 * Learning Brain Layer — produce, validate, persist. Never writes Memory directly.
 */

import type {
  LearningBrainInput,
  LearningBrainOutput,
  LearningHistoryEntry,
  LearningRun,
  LearningSnapshot,
} from "./brain-types";
import { LEARNING_BRAIN_VERSION } from "./brain-types";
import { buildLearningBrainGraph, hasInsufficientOutcomeData } from "./learning-brain-graph";
import { mapLearningBrainToStructuredOutput } from "./map-learning-brain-to-output";
import { validateLearningBrainGraph } from "./learning-validator";
import {
  getDefaultLearningBrainRepository,
  type LearningBrainRepository,
} from "./learning-brain-repository";

let snapshotCounter = 0;
let runIdCounter = 0;

export function resetLearningBrainLayerCounters(): void {
  snapshotCounter = 0;
  runIdCounter = 0;
}

export class InsufficientOutcomeDataError extends Error {
  constructor() {
    super("insufficient_outcome_data");
    this.name = "InsufficientOutcomeDataError";
  }
}

export class LearningBrainLayer {
  constructor(
    private readonly repository: LearningBrainRepository = getDefaultLearningBrainRepository()
  ) {}

  produce(input: LearningBrainInput): LearningBrainOutput {
    if (hasInsufficientOutcomeData(input)) {
      throw new InsufficientOutcomeDataError();
    }

    runIdCounter += 1;
    const runId = `learn-run-${runIdCounter}`;
    const startedAt = new Date().toISOString();

    const run: LearningRun = {
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

    const graph = buildLearningBrainGraph(input);
    if (!graph) {
      const failedRun: LearningRun = { ...run, completedAt: new Date().toISOString(), status: "insufficient_data" };
      this.repository.storeRun(failedRun);
      throw new InsufficientOutcomeDataError();
    }

    const validation = validateLearningBrainGraph(graph);
    if (!validation.valid) {
      const failedRun: LearningRun = { ...run, completedAt: new Date().toISOString(), status: "failed" };
      this.repository.storeRun(failedRun);
      throw new Error(`Learning validation failed: ${validation.errors.join(", ")}`);
    }

    snapshotCounter += 1;
    const snapshotId = `learnsnap-${snapshotCounter}`;
    const outputRef = `learning:${input.organizationId}:${snapshotId}`;

    const snapshot: LearningSnapshot = {
      id: snapshotId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      graph,
      outputRef,
      storedAt: new Date().toISOString(),
    };

    this.repository.storeSnapshot(snapshot);

    const historyEntry: LearningHistoryEntry = {
      runId,
      snapshotId,
      version: snapshotCounter,
      storedAt: snapshot.storedAt,
      changeReason: input.changeReason ?? "Learning brain run",
      measurementWindow: graph.measurementWindow.windowEnd,
    };
    this.repository.appendHistory(historyEntry, {
      organizationId: input.organizationId,
      projectId: input.projectId,
    });

    const completedRun: LearningRun = {
      ...run,
      completedAt: snapshot.storedAt,
      status: "completed",
      snapshotId,
    };
    this.repository.storeRun(completedRun);

    return {
      graph,
      structuredOutput: mapLearningBrainToStructuredOutput(graph, snapshot.storedAt),
      outputRef,
      snapshot,
      run: completedRun,
    };
  }
}

export function createLearningBrainLayer(repository?: LearningBrainRepository): LearningBrainLayer {
  return new LearningBrainLayer(repository);
}

export function buildLearningBrainGraphOutput(input: LearningBrainInput): LearningBrainOutput {
  return createLearningBrainLayer().produce(input);
}

export { LEARNING_BRAIN_VERSION };
