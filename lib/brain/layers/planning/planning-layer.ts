import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { DecisionCollection } from "../../decision/decision-types";
import type { StrategyGraph } from "../../strategy/strategy-graph";
import type { BrandGraph } from "../brand/types";
import type { MarketingIntelligenceGraph } from "../marketing-intelligence/types";
import type { ResearchGraph } from "../research/types";
import type { ReasoningGraph } from "../reasoning/types";
import { buildPlanningGraph, type BuildPlanningGraphInput } from "./planning-builder";
import type { PlanningGraph } from "./types";
import type { PlanningRepository } from "./planning-repository";
import { getDefaultPlanningRepository } from "./planning-repository";
import { validatePlanningGraph } from "./planning-validator";
import { PLANNING_MODULE_SPECS } from "./modules/specs";

export type PlanningLayerInput = BuildPlanningGraphInput & {
  correlationId?: string;
};

export type PlanningLayerResult = {
  graph: PlanningGraph;
  validation: ReturnType<typeof validatePlanningGraph>;
};

/**
 * Planning Brain Layer — transforms strategic decisions into executable campaign plan.
 * Does NOT generate ads, emails, images, copy, or landing pages.
 */
export class PlanningLayer {
  constructor(private readonly repository: PlanningRepository = getDefaultPlanningRepository()) {}

  listModuleSpecs() {
    return PLANNING_MODULE_SPECS;
  }

  buildGraph(input: PlanningLayerInput): PlanningLayerResult {
    const graph = buildPlanningGraph(input);
    const validation = validatePlanningGraph(graph);
    return { graph, validation };
  }

  planAndStore(input: PlanningLayerInput): PlanningLayerResult {
    const result = this.buildGraph(input);
    this.repository.store({
      key: {
        organizationId: input.organizationId,
        campaignId: input.campaignId ?? input.campaignContext.projectId,
        correlationId: input.correlationId,
      },
      graph: result.graph,
      storedAt: new Date().toISOString(),
    });
    return result;
  }

  getLatestGraph(input: { organizationId: string; campaignId?: string }): PlanningGraph | null {
    return this.repository.getLatest(input)?.graph ?? null;
  }
}

export function createPlanningLayer(repository?: PlanningRepository): PlanningLayer {
  return new PlanningLayer(repository);
}

export function collectPlanningGraph(input: PlanningLayerInput): PlanningGraph {
  return buildPlanningGraph(input);
}

export type { BuildPlanningGraphInput };

export type PlanFromBrainInputs = {
  organizationId: string;
  campaignContext: CampaignContext;
  strategyGraph: StrategyGraph;
  decisionCollection: DecisionCollection;
  brandGraph?: BrandGraph | null;
  marketingIntelligence?: MarketingIntelligenceGraph | null;
  researchGraph?: ResearchGraph | null;
  reasoningGraph?: ReasoningGraph | null;
  locale?: "nl" | "en";
};

/** Convenience entry — consumes all upstream brain outputs. */
export function planFromBrainInputs(input: PlanFromBrainInputs): PlanningGraph {
  return buildPlanningGraph({
    organizationId: input.organizationId,
    campaignId: input.campaignContext.projectId,
    campaignContext: input.campaignContext,
    strategyGraph: input.strategyGraph,
    decisionCollection: input.decisionCollection,
    brandGraph: input.brandGraph,
    marketingIntelligence: input.marketingIntelligence,
    researchGraph: input.researchGraph,
    reasoningGraph: input.reasoningGraph,
    locale: input.locale,
  });
}
