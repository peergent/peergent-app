import type { BrainCapabilityId } from "../../capabilities/registry";
import type { CompanySnapshot } from "../../company/snapshot";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainStructuredOutput } from "../../evidence/structured-output";

import { createBrandBoundary, type BrandBrainSnapshot, type BrandBrainConsumer } from "./brand-boundary";
import {
  buildBrandGraph,
  buildBrandModel,
  type BuildBrandGraphInput,
} from "./build-brand-graph";
import {
  buildBrandResearchGraph,
  type BuildBrandResearchGraphInput,
} from "./build-brand-research-graph";
import type { BrandGraph, BrandResearchGraph } from "./types";
import type { BrandRepository } from "./brand-repository";
import { getDefaultBrandRepository } from "./brand-repository";
import { BRAND_RESEARCH_MODULE_SPECS } from "./modules/specs";

export type BrandLayerInput = BuildBrandResearchGraphInput & {
  correlationId?: string;
};

export type BrandLayerResult = {
  graph: BrandGraph;
  research: BrandResearchGraph;
  consumedCapabilities: readonly BrainCapabilityId[];
};

const BRAND_RESEARCH_CAPABILITY_IDS: readonly BrainCapabilityId[] = [
  "brand_understanding",
  "website_understanding",
  "company_understanding",
];

/**
 * Brand Brain Layer — collects brand evidence and models brand knowledge.
 * Does not generate creative assets, validate outputs, or create advertisements.
 */
export class BrandLayer {
  constructor(private readonly repository: BrandRepository = getDefaultBrandRepository()) {}

  listModuleSpecs() {
    return BRAND_RESEARCH_MODULE_SPECS;
  }

  /** Build Brand Research Graph — evidence only, no interpretation. */
  buildResearchGraph(input: BrandLayerInput): BrandResearchGraph {
    return buildBrandResearchGraph(input);
  }

  /** Build complete Brand Graph — research + model. */
  buildGraph(input: BrandLayerInput): BrandLayerResult {
    const research = buildBrandResearchGraph(input);
    const graph = buildBrandGraph({ researchGraph: research });
    const consumedCapabilities = BRAND_RESEARCH_CAPABILITY_IDS.filter(
      (id) => input.upstreamOutputs?.[id] != null
    );
    return { graph, research, consumedCapabilities };
  }

  /** Build graph and persist to ephemeral Brand Repository. */
  collectAndStore(input: BrandLayerInput): BrandLayerResult {
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

  getLatestGraph(input: { organizationId: string; campaignId?: string }): BrandGraph | null {
    return this.repository.getLatest(input)?.graph ?? null;
  }

  /** Expose safe boundary view for consumer Brains. */
  getBoundaryView(input: {
    organizationId: string;
    campaignId?: string;
    consumer: BrandBrainConsumer;
  }): BrandBrainSnapshot | null {
    const graph = this.getLatestGraph(input);
    if (!graph) return null;
    const boundary = createBrandBoundary(graph);
    return {
      ...boundary.toSnapshot(),
      facts: boundary.forConsumer(input.consumer),
    };
  }
}

export function createBrandLayer(repository?: BrandRepository): BrandLayer {
  return new BrandLayer(repository);
}

/** Convenience — build brand graph without instantiating layer. */
export function collectBrandGraph(input: BrandLayerInput): BrandGraph {
  const research = buildBrandResearchGraph(input);
  return buildBrandGraph({ researchGraph: research });
}

export { buildBrandModel, type BuildBrandGraphInput };
