import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { ExplainabilityView } from "./types";

export function buildUnderstandingExplainability(
  understanding: MarketingUnderstanding
): ExplainabilityView {
  const evidence: string[] = [];
  if (understanding.brand.positioningStatement) {
    evidence.push(`Positioning: ${understanding.brand.positioningStatement}`);
  }
  if (understanding.products.length) {
    evidence.push(`${understanding.products.length} products in context`);
  }
  if (understanding.customerSegments.length) {
    evidence.push(`${understanding.customerSegments.length} customer segments identified`);
  }

  return {
    artifact: "understanding",
    title: "Marketing understanding",
    reasoning:
      "I assembled this from Company DNA, Business Brain, and your marketing profile so every recommendation stays grounded in verified business facts.",
    evidence,
    sourceReferences: [
      "Company DNA",
      "Business Brain",
      "Marketing profile",
      ...(understanding.gaps.length
        ? [`${understanding.gaps.length} knowledge gaps flagged`]
        : []),
    ],
    confidence:
      understanding.completeness >= 70
        ? "high"
        : understanding.completeness >= 40
          ? "moderate"
          : "low",
  };
}

export function buildStrategyExplainability(
  strategy: MarketingStrategy
): ExplainabilityView {
  const evidence = [
    strategy.summary,
    ...strategy.positioningRecommendations.slice(0, 2).map((p) => p.recommendation),
    ...strategy.marketingPriorities.slice(0, 2).map((p) => p.title),
  ].filter(Boolean);

  const sourceSet = new Set<string>();
  for (const item of [
    ...strategy.targetAudiences,
    ...strategy.positioningRecommendations,
    ...strategy.contentPillars,
  ]) {
    for (const ref of item.rationale.basedOn) {
      sourceSet.add(ref);
    }
  }

  return {
    artifact: "strategy",
    title: "Marketing strategy",
    reasoning: strategy.confidenceReason || strategy.summary,
    evidence,
    sourceReferences: [...sourceSet],
    confidence: strategy.confidence,
  };
}

export function buildPlanExplainability(plan: MarketingPlan): ExplainabilityView {
  const evidence = [
    plan.summary,
    ...plan.objectives.slice(0, 2).map((o) => o.title),
    ...plan.priorities.slice(0, 2).map((p) => p.title),
  ].filter(Boolean);

  return {
    artifact: "plan",
    title: "Marketing plan",
    reasoning: plan.confidenceReason || plan.basedOnStrategySummary,
    evidence,
    sourceReferences: ["marketing-strategy", plan.basedOnStrategySummary],
    confidence: plan.confidence,
  };
}

export function buildDraftExplainability(draft: MarketingContentDraft): ExplainabilityView {
  const evidence = [
    draft.objective,
    ...draft.rationale.strategyLinks.map((l) => `${l.type}: ${l.reference}`),
  ].filter(Boolean);

  return {
    artifact: "draft",
    title: draft.title,
    reasoning: draft.rationale.why,
    evidence,
    sourceReferences: [
      ...draft.sourceReferences.map((s) => `${s.source}: ${s.reference}`),
      `Plan activity: ${draft.planActivityReference}`,
    ],
    confidence: draft.confidence,
  };
}
