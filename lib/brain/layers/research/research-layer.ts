import type { BrainCapabilityId } from "../../capabilities/registry";
import type { CompanySnapshot } from "../../company/snapshot";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainStructuredOutput } from "../../evidence/structured-output";
import { buildResearchGraph, type BuildResearchGraphInput } from "./build-research-graph";
import type { ResearchGraph } from "./types";
import type { ResearchRepository } from "./research-repository";
import { getDefaultResearchRepository } from "./research-repository";
import { RESEARCH_MODULE_SPECS } from "./modules/specs";

export type ResearchLayerInput = BuildResearchGraphInput & {
  correlationId?: string;
};

export type ResearchLayerResult = {
  graph: ResearchGraph;
  /** Capability ids whose outputs were consumed to build the graph. */
  consumedCapabilities: readonly BrainCapabilityId[];
};

const RESEARCH_CAPABILITY_IDS: readonly BrainCapabilityId[] = [
  "company_understanding",
  "website_understanding",
  "competitor_understanding",
  "brand_understanding",
  "market_understanding",
];

/**
 * Research Layer — collects facts, never decides.
 * Strangler: delegates to existing capabilities via buildResearchGraph adapter.
 */
export class ResearchLayer {
  constructor(private readonly repository: ResearchRepository = getDefaultResearchRepository()) {}

  /** Module specifications — implementation grows incrementally per module. */
  listModuleSpecs() {
    return RESEARCH_MODULE_SPECS;
  }

  /** Build canonical ResearchGraph from current context — no side effects. */
  buildGraph(input: ResearchLayerInput): ResearchLayerResult {
    const graph = buildResearchGraph(input);
    const consumedCapabilities = RESEARCH_CAPABILITY_IDS.filter(
      (id) => input.upstreamOutputs?.[id] != null
    );
    return { graph, consumedCapabilities };
  }

  /** Build graph and persist to ephemeral Research Repository. */
  collectAndStore(input: ResearchLayerInput): ResearchLayerResult {
    const result = this.buildGraph(input);
    this.repository.store({
      key: {
        organizationId: input.companySnapshot.organizationId,
        campaignId: input.campaignId ?? input.campaignContext?.projectId,
        correlationId: input.correlationId,
      },
      graph: result.graph,
      storedAt: new Date().toISOString(),
    });
    return result;
  }

  getLatestGraph(input: { organizationId: string; campaignId?: string }): ResearchGraph | null {
    return this.repository.getLatest(input)?.graph ?? null;
  }
}

export function createResearchLayer(repository?: ResearchRepository): ResearchLayer {
  return new ResearchLayer(repository);
}

/** Convenience — build graph without instantiating layer. */
export function collectResearchGraph(input: {
  companySnapshot: CompanySnapshot;
  campaignContext?: CampaignContext | null;
  upstreamOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  campaignId?: string;
}): ResearchGraph {
  return buildResearchGraph(input);
}
