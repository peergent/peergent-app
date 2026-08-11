import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { OpportunitySelection, RejectedAlternative, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function selectOpportunities(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  maxSelected?: number;
  upstreamConfidence: StrategyConfidence;
}): { selections: OpportunitySelection[]; rejectedAlternatives: RejectedAlternative[] } {
  const max = input.maxSelected ?? 3;
  const sorted = [...input.miGraph.opportunitySignals].sort((a, b) => {
    const score = (o: typeof a) =>
      (o.urgency === "high" ? 3 : o.urgency === "medium" ? 2 : 1) +
      (o.expectedBusinessImpact === "critical" ? 3 : o.expectedBusinessImpact === "high" ? 2 : 1);
    return score(b) - score(a);
  });

  const selections: OpportunitySelection[] = [];
  const rejectedAlternatives: RejectedAlternative[] = [];

  sorted.forEach((opp, index) => {
    const selected = index < max;
    const status = selected ? "selected" : index < max + 2 ? "deferred" : "rejected";
    selections.push({
      opportunityId: opp.id,
      title: opp.title,
      status,
      reason: selected
        ? "Highest urgency and business impact among available opportunities."
        : status === "deferred"
          ? "Valid opportunity deferred to preserve focus and resource capacity."
          : "Strategy is subtraction — insufficient priority versus selected opportunities.",
      expectedImpact: opp.marketingImpact,
      confidence: enforceStrategyConfidenceCeiling(opp.confidence, [input.upstreamConfidence]),
      resourceRequirement: opp.effort,
      dependency: opp.dependencies,
      timingRelevance: opp.urgency === "high" ? "immediate" : "near_term",
    });
    if (status === "rejected") {
      rejectedAlternatives.push({
        id: `rej-opp-${opp.id}`,
        alternative: opp.title,
        reason: "Deferred or rejected to maintain strategic focus and measurable impact.",
        evidenceIds: opp.evidenceIds,
        confidence: enforceStrategyConfidenceCeiling(opp.confidence, [input.upstreamConfidence]),
      });
    }
  });

  return { selections, rejectedAlternatives };
}
