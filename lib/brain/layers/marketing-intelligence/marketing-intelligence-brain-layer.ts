/**
 * Marketing Intelligence Brain Layer — produce, validate, persist.
 */

import type {
  MarketingIntelligenceBrainInput,
  MarketingIntelligenceBrainOutput,
  MarketingIntelligenceHistoryEntry,
  MarketingIntelligenceRun,
  MarketingIntelligenceSnapshot,
} from "./brain-types";
import { MARKETING_INTELLIGENCE_BRAIN_VERSION } from "./brain-types";
import { buildMarketingIntelligenceBrainGraph } from "./marketing-intelligence-graph";
import { mapMarketingIntelligenceToStructuredOutput } from "./map-marketing-intelligence-to-output";
import { validateMarketingIntelligenceBrainGraph } from "./marketing-intelligence-validator";
import {
  getDefaultMarketingIntelligenceBrainRepository,
  type MarketingIntelligenceBrainRepository,
} from "./marketing-intelligence-brain-repository";

let snapshotCounter = 0;
let runIdCounter = 0;

export function resetMarketingIntelligenceBrainLayerCounters(): void {
  snapshotCounter = 0;
  runIdCounter = 0;
}

export class MarketingIntelligenceBrainLayer {
  constructor(
    private readonly repository: MarketingIntelligenceBrainRepository = getDefaultMarketingIntelligenceBrainRepository()
  ) {}

  produce(input: MarketingIntelligenceBrainInput): MarketingIntelligenceBrainOutput {
    runIdCounter += 1;
    const runId = `mi-run-${runIdCounter}`;
    const startedAt = new Date().toISOString();

    const run: MarketingIntelligenceRun = {
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

    const graph = buildMarketingIntelligenceBrainGraph(input);
    const validation = validateMarketingIntelligenceBrainGraph(graph);

    if (!validation.valid) {
      const failedRun: MarketingIntelligenceRun = {
        ...run,
        completedAt: new Date().toISOString(),
        status: "failed",
      };
      this.repository.storeRun(failedRun);
      throw new Error(`Marketing intelligence validation failed: ${validation.errors.join(", ")}`);
    }

    snapshotCounter += 1;
    const snapshotId = `misnap-${snapshotCounter}`;
    const outputRef = `marketing_intelligence:${input.organizationId}:${snapshotId}`;

    const snapshot: MarketingIntelligenceSnapshot = {
      id: snapshotId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      graph,
      outputRef,
      storedAt: new Date().toISOString(),
    };

    this.repository.storeSnapshot(snapshot);

    const historyEntry: MarketingIntelligenceHistoryEntry = {
      runId,
      snapshotId,
      version: snapshotCounter,
      storedAt: snapshot.storedAt,
      changeReason: input.projectObjective ?? "Marketing intelligence brain run",
    };
    this.repository.appendHistory(historyEntry, {
      organizationId: input.organizationId,
      projectId: input.projectId,
    });

    const completedRun: MarketingIntelligenceRun = {
      ...run,
      completedAt: snapshot.storedAt,
      status: "completed",
      snapshotId,
    };
    this.repository.storeRun(completedRun);

    const structuredOutput = mapMarketingIntelligenceToStructuredOutput(graph, snapshot.storedAt);

    return {
      graph,
      structuredOutput,
      outputRef,
      snapshot,
      run: completedRun,
    };
  }
}

export function createMarketingIntelligenceBrainLayer(
  repository?: MarketingIntelligenceBrainRepository
): MarketingIntelligenceBrainLayer {
  return new MarketingIntelligenceBrainLayer(repository);
}

export function collectMarketingIntelligenceBrainGraph(
  input: MarketingIntelligenceBrainInput
): MarketingIntelligenceBrainOutput {
  return createMarketingIntelligenceBrainLayer().produce(input);
}

export { MARKETING_INTELLIGENCE_BRAIN_VERSION };
