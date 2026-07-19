import type { MarketingStrategy, MarketingStrategyConfidence } from "../types/strategy";

export type PlanReadiness = {
  ready: boolean;
  strategyItemCount: number;
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

function countStrategyItems(strategy: MarketingStrategy): number {
  return (
    strategy.targetAudiences.length +
    strategy.positioningRecommendations.length +
    strategy.contentPillars.length +
    strategy.campaignIdeas.length +
    strategy.seoOpportunities.length +
    strategy.socialMediaStrategy.length +
    strategy.customerJourneyRecommendations.length +
    strategy.leadGenerationOpportunities.length +
    strategy.marketingPriorities.length
  );
}

/** Rule-based readiness assessment before plan generation. */
export function assessPlanReadiness(strategy: MarketingStrategy | undefined): PlanReadiness {
  const warnings: string[] = [];
  const knowledgeGaps: string[] = [];

  if (!strategy?.summary?.trim()) {
    return {
      ready: false,
      strategyItemCount: 0,
      maxConfidence: "low",
      warnings: ["Marketing Strategy is unavailable — cannot generate plan."],
      knowledgeGaps: ["Marketing Strategy not provided"],
    };
  }

  const strategyItemCount = countStrategyItems(strategy);

  if (strategyItemCount === 0) {
    return {
      ready: false,
      strategyItemCount: 0,
      maxConfidence: "low",
      warnings: ["Marketing Strategy contains no actionable recommendations."],
      knowledgeGaps: strategy.knowledgeGaps,
    };
  }

  if (strategyItemCount < 3) {
    warnings.push(
      "Marketing Strategy has few recommendations — the plan may be limited in scope."
    );
  }

  for (const gap of strategy.knowledgeGaps) {
    knowledgeGaps.push(gap);
  }

  let maxConfidence = strategy.confidence;
  if (strategyItemCount < 5) {
    maxConfidence = minConfidence(maxConfidence, "moderate");
  }

  return {
    ready: true,
    strategyItemCount,
    maxConfidence,
    warnings,
    knowledgeGaps,
  };
}

export function capPlanConfidence(
  reported: MarketingStrategyConfidence,
  maxAllowed: MarketingStrategyConfidence
): MarketingStrategyConfidence {
  return minConfidence(reported, maxAllowed);
}
