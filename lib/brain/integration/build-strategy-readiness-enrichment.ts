/**
 * PX-53 — strategy readiness enrichment for final AND dependency strategy runs.
 */

import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence";
import type { ReasoningGraph } from "../layers/reasoning";
import type { ResearchGraph } from "../layers/research";
import type { ProjectEpisodeRecord } from "../project-runtime/types";
import type { StrategyReadinessRequestEnrichment } from "../strategy-readiness";

export function buildStrategyReadinessEnrichmentForCapabilityRun(input: {
  capabilityId: BrainCapabilityId;
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  inflightGraphs: {
    researchGraph: ResearchGraph | null;
    reasoningGraph: ReasoningGraph | null;
    marketingIntelligenceGraph: MarketingIntelligenceGraph | null;
  };
  episode?: ProjectEpisodeRecord | null;
  overlay?: StrategyReadinessRequestEnrichment | null;
}): StrategyReadinessRequestEnrichment | null {
  if (input.capabilityId !== "strategy") {
    return input.overlay ?? null;
  }

  return {
    resolvedGraphs:
      input.overlay?.resolvedGraphs ?? input.episode?.resolvedGraphs ?? null,
    upstreamCapabilityOutputs: input.upstreamOutputs,
    inflightGraphs: input.inflightGraphs,
  };
}
