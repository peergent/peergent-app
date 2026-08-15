import { extractCapabilityKnowledge } from "./extract-capability-knowledge";
import { extractInflightGraphKnowledge } from "./extract-inflight-graph-knowledge";
import { inferTargetAudienceFromDescription } from "./infer-campaign-description";
import type {
  StrategyReadinessEnrichmentInput,
  StrategyReadinessKnowledgeBundle,
} from "./types";

/** Assemble the unified Strategy readiness knowledge bundle from all available sources. */
export function buildStrategyReadinessKnowledgeBundle(
  input: StrategyReadinessEnrichmentInput
): StrategyReadinessKnowledgeBundle {
  const upstreamCapabilityOutputs = input.upstreamCapabilityOutputs ?? null;
  const inflightGraphs = {
    researchGraph: input.inflightGraphs?.researchGraph ?? null,
    reasoningGraph: input.inflightGraphs?.reasoningGraph ?? null,
    marketingIntelligenceGraph: input.inflightGraphs?.marketingIntelligenceGraph ?? null,
  };

  const capabilityKnowledge = extractCapabilityKnowledge(upstreamCapabilityOutputs);
  const inflightKnowledge = extractInflightGraphKnowledge(inflightGraphs);

  const inferredTargetAudience = inferTargetAudienceFromDescription(
    input.campaignContext.audience.trim()
      ? ""
      : [input.campaignContext.description, input.campaignContext.extraContext]
          .filter(Boolean)
          .join(" ")
  );

  return {
    campaignContext: input.campaignContext,
    companyProfile: input.companyProfile ?? null,
    companyWebsiteSnapshot: input.companyWebsiteSnapshot ?? null,
    resolvedGraphs: input.resolvedGraphs ?? null,
    upstreamCapabilityOutputs,
    inflightGraphs,
    capabilityKnowledge,
    inflightKnowledge,
    inferredTargetAudience,
  };
}
