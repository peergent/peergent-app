/**
 * Planning Brain Layer — produce, validate, persist.
 */

import type {
  PlanningBrainInput,
  PlanningBrainOutput,
  PlanningHistoryEntry,
  PlanningRun,
  PlanningSnapshot,
} from "./brain-types";
import { PLANNING_BRAIN_VERSION } from "./brain-types";
import { buildPlanningBrainGraph } from "./planning-brain-graph";
import { mapPlanningBrainToStructuredOutput } from "./map-planning-brain-to-output";
import { validatePlanningBrainGraph } from "./planning-brain-validator";
import {
  getDefaultPlanningBrainRepository,
  type PlanningBrainRepository,
} from "./planning-brain-repository";

let snapshotCounter = 0;
let runIdCounter = 0;

export function resetPlanningBrainLayerCounters(): void {
  snapshotCounter = 0;
  runIdCounter = 0;
}

export class PlanningBrainLayer {
  constructor(
    private readonly repository: PlanningBrainRepository = getDefaultPlanningBrainRepository()
  ) {}

  produce(input: PlanningBrainInput): PlanningBrainOutput {
    runIdCounter += 1;
    const runId = `plan-run-${runIdCounter}`;
    const startedAt = new Date().toISOString();

    const run: PlanningRun = {
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

    const graph = buildPlanningBrainGraph(input);
    const validation = validatePlanningBrainGraph(graph);

    if (!validation.valid) {
      const failedRun: PlanningRun = { ...run, completedAt: new Date().toISOString(), status: "failed" };
      this.repository.storeRun(failedRun);
      throw new Error(`Planning validation failed: ${validation.errors.join(", ")}`);
    }

    snapshotCounter += 1;
    const snapshotId = `plansnap-${snapshotCounter}`;
    const outputRef = `planning:${input.organizationId}:${snapshotId}`;

    const snapshot: PlanningSnapshot = {
      id: snapshotId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      graph,
      outputRef,
      storedAt: new Date().toISOString(),
    };

    this.repository.storeSnapshot(snapshot);

    const historyEntry: PlanningHistoryEntry = {
      runId,
      snapshotId,
      version: snapshotCounter,
      storedAt: snapshot.storedAt,
      changeReason: input.changeReason ?? "Planning brain run",
      strategyVersionRef: graph.strategyVersionRef,
    };
    this.repository.appendHistory(historyEntry, {
      organizationId: input.organizationId,
      projectId: input.projectId,
    });

    const blocked = graph.escalations.some((e) => e.blocking);
    const completedRun: PlanningRun = {
      ...run,
      completedAt: snapshot.storedAt,
      status: blocked ? "blocked" : "completed",
      snapshotId,
    };
    this.repository.storeRun(completedRun);

    return {
      graph,
      structuredOutput: mapPlanningBrainToStructuredOutput(graph, snapshot.storedAt),
      outputRef,
      snapshot,
      run: completedRun,
    };
  }
}

export function createPlanningBrainLayer(repository?: PlanningBrainRepository): PlanningBrainLayer {
  return new PlanningBrainLayer(repository);
}

export function buildPlanningBrainGraphOutput(input: PlanningBrainInput): PlanningBrainOutput {
  return createPlanningBrainLayer().produce(input);
}

export { PLANNING_BRAIN_VERSION };
