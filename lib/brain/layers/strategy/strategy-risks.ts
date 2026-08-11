import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { StrategicAssumption, StrategicRisk, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildStrategicAssumptions(input: {
  reasoningGraph: ReasoningBrainGraph;
  upstreamConfidence: StrategyConfidence;
}): StrategicAssumption[] {
  return input.reasoningGraph.assumptions.slice(0, 6).map((a) => ({
    id: `strat-assumption-${a.id}`,
    statement: a.statement,
    confidence: enforceStrategyConfidenceCeiling(a.confidence, [input.upstreamConfidence]),
    evidenceIds: a.relatedEvidence,
    riskIfWrong: a.validationNeeded ? "Strategic direction may need revision" : "Low immediate impact",
    validationMethod: a.requiredEvidence[0] ?? "Gather supporting evidence",
    reviewTrigger: a.validationNeeded ? "Before major budget commitment" : "Quarterly strategy review",
  }));
}

export function buildStrategicRisks(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  upstreamConfidence: StrategyConfidence;
}): StrategicRisk[] {
  const risks = [
    ...input.miGraph.riskSignals.slice(0, 4).map((r) => ({
      id: `strat-risk-mi-${r.id}`,
      description: r.description,
      likelihood: r.likelihood,
      severity: r.severity,
      impact: r.businessImpact,
      mitigationDirection: r.mitigationConsideration,
      trigger: "Performance threshold breach or market shift",
      owner: "Marketing leadership",
      confidence: enforceStrategyConfidenceCeiling(r.confidence, [input.upstreamConfidence]),
    })),
    ...input.reasoningGraph.risks.slice(0, 3).map((r) => ({
      id: `strat-risk-reason-${r.id}`,
      description: r.description,
      likelihood: r.likelihood,
      severity: r.severity,
      impact: r.businessImpact,
      mitigationDirection: r.mitigationSuggestion,
      trigger: "Evidence contradicts assumption",
      owner: "Strategy owner",
      confidence: enforceStrategyConfidenceCeiling(r.confidence, [input.upstreamConfidence]),
    })),
  ];
  if (risks.length === 0) {
    risks.push({
      id: "strat-risk-default",
      description: "Limited upstream evidence may reduce strategic certainty",
      likelihood: "medium",
      severity: "medium",
      impact: "Decisions may need revision as more data becomes available",
      mitigationDirection: "Validate assumptions through measured channel tests",
      trigger: "Performance deviates from expected direction",
      owner: "Marketing leadership",
      confidence: enforceStrategyConfidenceCeiling("low", [input.upstreamConfidence]),
    });
  }

  return risks;
}
