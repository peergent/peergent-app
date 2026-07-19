import type { MarketingUnderstanding } from "../types/understanding";
import type { MarketingStrategyConfidence } from "../types/strategy";

export type StrategyReadiness = {
  ready: boolean;
  understandingCompleteness: number;
  maxConfidence: MarketingStrategyConfidence;
  warnings: string[];
  knowledgeGaps: string[];
};

const CONFIDENCE_ORDER: MarketingStrategyConfidence[] = ["low", "moderate", "high"];

function minConfidence(
  a: MarketingStrategyConfidence,
  b: MarketingStrategyConfidence
): MarketingStrategyConfidence {
  return CONFIDENCE_ORDER.indexOf(a) <= CONFIDENCE_ORDER.indexOf(b) ? a : b;
}

/** Rule-based readiness assessment before strategy generation. */
export function assessStrategyReadiness(
  understanding: MarketingUnderstanding | undefined
): StrategyReadiness {
  const warnings: string[] = [];
  const knowledgeGaps: string[] = [];

  if (!understanding?.available) {
    return {
      ready: false,
      understandingCompleteness: 0,
      maxConfidence: "low",
      warnings: ["Marketing Understanding is unavailable — strategy will be limited."],
      knowledgeGaps: ["Marketing Understanding not loaded"],
    };
  }

  if (understanding.sparse) {
    warnings.push(
      `Marketing Understanding is sparse (${understanding.completeness}% complete). Recommendations may be incomplete.`
    );
  }

  for (const gap of understanding.gaps) {
    knowledgeGaps.push(gap);
  }

  let maxConfidence: MarketingStrategyConfidence = "high";
  if (understanding.completeness < 75) {
    maxConfidence = minConfidence(maxConfidence, "moderate");
  }
  if (understanding.completeness < 40) {
    maxConfidence = "low";
    warnings.push("Understanding completeness is below 40% — strategy confidence capped at low.");
  }

  if (understanding.customerSegments.length === 0) {
    warnings.push("No customer segments defined — audience recommendations will be limited.");
    maxConfidence = minConfidence(maxConfidence, "moderate");
  }

  return {
    ready: understanding.completeness > 0,
    understandingCompleteness: understanding.completeness,
    maxConfidence,
    warnings,
    knowledgeGaps,
  };
}

export function capStrategyConfidence(
  reported: MarketingStrategyConfidence,
  maxAllowed: MarketingStrategyConfidence
): MarketingStrategyConfidence {
  return minConfidence(reported, maxAllowed);
}
