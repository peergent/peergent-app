import type { ReasoningGraph } from "../reasoning/types";
import type { ResearchGraph } from "../research/types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  buildMarketingIntelligenceGraph,
  type BuildMarketingIntelligenceInput,
} from "./build-marketing-intelligence";
import type { MarketingIntelligenceGraph } from "./types";
import type { MarketingIntelligenceRepository } from "./marketing-intelligence-repository";
import { getDefaultMarketingIntelligenceRepository } from "./marketing-intelligence-repository";
import { MARKETING_INTELLIGENCE_MODULE_SPECS } from "./modules/specs";

export type MarketingIntelligenceLayerInput = BuildMarketingIntelligenceInput & {
  correlationId?: string;
};

export type MarketingIntelligenceLayerResult = {
  graph: MarketingIntelligenceGraph;
  reasoningVersion: string;
};

/**
 * Marketing Intelligence Layer — internal Marketing Brain thinking.
 * Consumes ReasoningGraph; produces MarketingIntelligenceGraph for Strategy.
 * Never generates ads, channels, or creative.
 */
export class MarketingIntelligenceLayer {
  constructor(
    private readonly repository: MarketingIntelligenceRepository = getDefaultMarketingIntelligenceRepository()
  ) {}

  listModuleSpecs() {
    return MARKETING_INTELLIGENCE_MODULE_SPECS;
  }

  buildGraph(input: MarketingIntelligenceLayerInput): MarketingIntelligenceLayerResult {
    const graph = buildMarketingIntelligenceGraph(input);
    return { graph, reasoningVersion: input.reasoningGraph.version };
  }

  thinkAndStore(input: MarketingIntelligenceLayerInput): MarketingIntelligenceLayerResult {
    const result = this.buildGraph(input);
    this.repository.store({
      key: {
        organizationId: input.reasoningGraph.organizationId,
        campaignId: input.reasoningGraph.campaignId,
        correlationId: input.correlationId,
      },
      graph: result.graph,
      storedAt: new Date().toISOString(),
    });
    return result;
  }

  getLatestGraph(input: { organizationId: string; campaignId?: string }): MarketingIntelligenceGraph | null {
    return this.repository.getLatest(input)?.graph ?? null;
  }
}

export function createMarketingIntelligenceLayer(
  repository?: MarketingIntelligenceRepository
): MarketingIntelligenceLayer {
  return new MarketingIntelligenceLayer(repository);
}

export function collectMarketingIntelligenceGraph(input: {
  reasoningGraph: ReasoningGraph;
  researchGraph?: ResearchGraph | null;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): MarketingIntelligenceGraph {
  return buildMarketingIntelligenceGraph(input);
}
