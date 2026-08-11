/**
 * Marketing Intelligence Brain — confidence derivation.
 * Never amplify beyond upstream evidence.
 */

import type {
  MarketingIntelligenceBrainGraph,
  MarketingIntelligenceConfidence,
  MarketingEvidenceRef,
} from "./brain-types";

export function minConfidence(
  a: MarketingIntelligenceConfidence,
  b: MarketingIntelligenceConfidence
): MarketingIntelligenceConfidence {
  const order = { low: 1, medium: 2, high: 3 };
  return order[a] <= order[b] ? a : b;
}

export function combineUpstreamConfidence(input: {
  company?: MarketingIntelligenceConfidence;
  research?: MarketingIntelligenceConfidence;
  reasoning?: MarketingIntelligenceConfidence;
  evidenceCount: number;
  contradictionCount?: number;
  unknownCount?: number;
}): MarketingIntelligenceConfidence {
  if (input.evidenceCount === 0) return "low";

  const upstream = [input.company, input.research, input.reasoning].filter(Boolean) as MarketingIntelligenceConfidence[];
  if (upstream.length === 0) return "low";

  let result: MarketingIntelligenceConfidence = "high";
  for (const c of upstream) {
    result = minConfidence(result, c);
  }

  if ((input.contradictionCount ?? 0) > 0 || (input.unknownCount ?? 0) > 2) {
    result = minConfidence(result, "medium");
  }

  if (input.evidenceCount === 1) {
    result = minConfidence(result, "medium");
  }

  return result;
}

export function enforceMarketingConfidenceCeiling(
  label: MarketingIntelligenceConfidence,
  evidenceCount: number
): MarketingIntelligenceConfidence {
  if (evidenceCount === 0) return "low";
  if (evidenceCount === 1 && label === "high") return "medium";
  return label;
}

export function aggregateGraphConfidence(
  refs: readonly MarketingEvidenceRef[]
): MarketingIntelligenceConfidence {
  if (refs.length === 0) return "low";
  const scores = refs.map((r) => (r.confidence === "high" ? 3 : r.confidence === "medium" ? 2 : 1));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 2.5) return "high";
  if (avg >= 1.5) return "medium";
  return "low";
}

export function graphConfidenceFactors(graph: MarketingIntelligenceBrainGraph) {
  return {
    companyCertainty: graph.companyGraphVersion ? ("medium" as const) : ("low" as const),
    researchCertainty: graph.researchGraphVersion ? ("medium" as const) : ("low" as const),
    reasoningCertainty: graph.reasoningGraphVersion ? ("medium" as const) : ("low" as const),
    evidenceQuality: aggregateGraphConfidence(graph.evidence),
    contradictionPenalty: graph.riskSignals.some((r) => r.category === "contradiction"),
    unknownPenalty: graph.summary.insufficientDataFlags.length > 0,
  };
}
