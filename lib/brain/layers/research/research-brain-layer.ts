/**
 * Research Brain Layer — produce, validate, persist.
 * Reads CompanyGraph and Memory; never writes Company or Memory.
 */

import type { MemoryGraph } from "../memory/types";
import type {
  ResearchBrainInput,
  ResearchBrainOutput,
  ResearchHistoryEntry,
  ResearchRun,
  ResearchSnapshot,
} from "./brain-types";
import { RESEARCH_BRAIN_VERSION } from "./brain-types";
import { buildResearchBrainGraph } from "./research-graph";
import { mapResearchGraphToStructuredOutput } from "./map-research-graph-to-output";
import { validateResearchBrainGraph } from "./research-validator";
import {
  getDefaultResearchBrainRepository,
  type ResearchBrainRepository,
} from "./research-brain-repository";

let snapshotCounter = 0;
let runIdCounter = 0;

export function resetResearchBrainLayerCounters(): void {
  snapshotCounter = 0;
  runIdCounter = 0;
}

export class ResearchBrainLayer {
  constructor(
    private readonly repository: ResearchBrainRepository = getDefaultResearchBrainRepository()
  ) {}

  async produce(input: ResearchBrainInput & { memoryGraph?: MemoryGraph | null }): Promise<ResearchBrainOutput> {
    runIdCounter += 1;
    const runId = `run-${runIdCounter}`;
    const startedAt = Date.now();

    const run: ResearchRun = {
      id: runId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      planId: "pending",
      startedAt: new Date(startedAt).toISOString(),
      completedAt: null,
      status: "running",
      snapshotId: null,
    };
    this.repository.storeRun(run);

    const graph = await buildResearchBrainGraph({
      ...input,
      memoryGraph: input.memoryGraph,
      startedAt,
    });

    const validation = validateResearchBrainGraph(graph);
    if (!validation.valid) {
      const failedRun: ResearchRun = {
        ...run,
        planId: graph.plan.id,
        completedAt: new Date().toISOString(),
        status: "failed",
      };
      this.repository.storeRun(failedRun);
      throw new Error(`Research validation failed: ${validation.errors.join(", ")}`);
    }

    snapshotCounter += 1;
    const snapshotId = `rsnap-${snapshotCounter}`;
    const outputRef = `research:${input.organizationId}:${snapshotId}`;

    const snapshot: ResearchSnapshot = {
      id: snapshotId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      graph,
      outputRef,
      storedAt: new Date().toISOString(),
    };

    this.repository.storeSnapshot(snapshot);

    const historyEntry: ResearchHistoryEntry = {
      runId,
      snapshotId,
      version: snapshotCounter,
      storedAt: snapshot.storedAt,
      changeReason: input.projectObjective ?? "Research brain run",
    };
    this.repository.appendHistory(historyEntry, {
      organizationId: input.organizationId,
      projectId: input.projectId,
    });

    const completedRun: ResearchRun = {
      ...run,
      planId: graph.plan.id,
      completedAt: snapshot.storedAt,
      status: graph.budgetState.exhausted ? "budget_exhausted" : "completed",
      snapshotId,
    };
    this.repository.storeRun(completedRun);

    const structuredOutput = mapResearchGraphToStructuredOutput(graph, snapshot.storedAt);

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
  }): ResearchSnapshot | null {
    return this.repository.getLatestSnapshot(input);
  }
}

export function createResearchBrainLayer(repository?: ResearchBrainRepository): ResearchBrainLayer {
  return new ResearchBrainLayer(repository);
}

export async function collectResearchBrainGraph(
  input: ResearchBrainInput & { memoryGraph?: MemoryGraph | null }
): Promise<ResearchBrainOutput> {
  const layer = createResearchBrainLayer();
  return layer.produce(input);
}

export { RESEARCH_BRAIN_VERSION };
