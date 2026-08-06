import type { ResearchGraph } from "../research/types";
import { buildReasoningGraph, type BuildReasoningGraphInput } from "./build-reasoning-graph";
import type { ReasoningGraph } from "./types";
import type { ReasoningRepository } from "./reasoning-repository";
import { getDefaultReasoningRepository } from "./reasoning-repository";
import { REASONING_MODULE_SPECS } from "./modules/specs";

export type ReasoningLayerInput = BuildReasoningGraphInput & {
  correlationId?: string;
};

export type ReasoningLayerResult = {
  graph: ReasoningGraph;
  researchVersion: string;
};

/**
 * Reasoning Layer — understands facts, never decides.
 * Consumes ResearchGraph; produces ReasoningGraph for downstream Strategy.
 */
export class ReasoningLayer {
  constructor(private readonly repository: ReasoningRepository = getDefaultReasoningRepository()) {}

  listModuleSpecs() {
    return REASONING_MODULE_SPECS;
  }

  buildGraph(input: ReasoningLayerInput): ReasoningLayerResult {
    const graph = buildReasoningGraph(input);
    return { graph, researchVersion: input.researchGraph.version };
  }

  reasonAndStore(input: ReasoningLayerInput): ReasoningLayerResult {
    const result = this.buildGraph(input);
    this.repository.store({
      key: {
        organizationId: input.researchGraph.organizationId,
        campaignId: input.researchGraph.campaignId,
        correlationId: input.correlationId,
      },
      graph: result.graph,
      storedAt: new Date().toISOString(),
    });
    return result;
  }

  getLatestGraph(input: { organizationId: string; campaignId?: string }): ReasoningGraph | null {
    return this.repository.getLatest(input)?.graph ?? null;
  }
}

export function createReasoningLayer(repository?: ReasoningRepository): ReasoningLayer {
  return new ReasoningLayer(repository);
}

export function collectReasoningGraph(researchGraph: ResearchGraph): ReasoningGraph {
  return buildReasoningGraph({ researchGraph });
}
