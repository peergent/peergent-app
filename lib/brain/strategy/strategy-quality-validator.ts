import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { StrategyGraph } from "./strategy-graph";
import { containsGenericMarketingPhrase } from "./generic-marketing-phrases";

export type StrategyQualityDimension =
  | "businessSpecificity"
  | "evidenceDensity"
  | "decisionQuality"
  | "reasoningDepth"
  | "differentiation"
  | "traceability"
  | "unknownAwareness";

export type StrategyQualityScores = Record<StrategyQualityDimension, number> & {
  overallQuality: number;
};

export type StrategyQualityIssue = {
  code: string;
  message: string;
  dimension: StrategyQualityDimension | "overallQuality";
};

export type StrategyQualityResult = {
  valid: boolean;
  scores: StrategyQualityScores;
  issues: readonly StrategyQualityIssue[];
};

const GENERIC_PHRASES = [
  /increase brand awareness/i,
  /reach more customers/i,
  /leverage social media/i,
  /best practices/i,
  /drive engagement/i,
  /optimize your marketing/i,
  /boost visibility/i,
  /comprehensive strategy/i,
  /multi-channel approach/i,
  /targeted campaign/i,
  /grow your business/i,
  /inferred positioning/i,
  /abstract theme/i,
  /campaign goal:/i,
  /pricing model is unknown/i,
];

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function collectText(graph: StrategyGraph): string {
  const parts = [
    graph.businessSummary.description,
    graph.strategicPositioning.description,
    graph.valueProposition.description,
    graph.primaryAudience.description,
    graph.recommendedDirection.description,
    ...graph.priorityOpportunities.map((o) => o.description),
    ...graph.strategicRisks.map((r) => r.description),
  ];
  return parts.join(" ");
}

function countEvidenceRefs(graph: StrategyGraph): number {
  const sections = [
    graph.businessSummary,
    graph.strategicPositioning,
    graph.valueProposition,
    graph.primaryAudience,
    graph.recommendedDirection,
    ...graph.priorityOpportunities,
    ...graph.strategicRisks,
    ...graph.assumptions,
  ];
  return sections.reduce(
    (sum, s) => sum + s.supportingEvidence.length + s.reasoningReferences.length,
    0
  );
}

export function scoreStrategyQuality(
  graph: StrategyGraph,
  context?: { campaignContext?: CampaignContext | null; companyName?: string }
): StrategyQualityScores {
  const text = collectText(graph);
  const companyName = context?.companyName ?? context?.campaignContext?.companyName ?? "";
  const evidenceCount = countEvidenceRefs(graph);

  const businessSpecificity = clampScore(
    (companyName && text.toLowerCase().includes(companyName.toLowerCase()) ? 40 : 0) +
      (graph.businessSummary.description.length > 20 ? 25 : 0) +
      (graph.differentiators.description.length > 10 &&
      !/still unknown|nog onbekend/i.test(graph.differentiators.description)
        ? 20
        : 0) +
      (GENERIC_PHRASES.filter((p) => p.test(text)).length === 0 &&
      !containsGenericMarketingPhrase(text)
        ? 15
        : 0)
  );

  const evidenceDensity = clampScore(
    Math.min(40, evidenceCount * 8) +
      (graph.evidenceSummary.supportingEvidence.length > 0 ? 30 : 0) +
      (graph.decisionRationales[0]?.evidence.length ?? 0) * 5
  );

  const decisionQuality = clampScore(
    (graph.decisionRationales.length > 0 ? 30 : 0) +
      (graph.rejectedAlternatives.length >= 2 ? 35 : graph.rejectedAlternatives.length * 15) +
      (graph.decisionRationales[0]?.alternativesRejected.length >= 2 ? 25 : 0) +
      (graph.recommendedDirection.description.length > 30 ? 10 : 0)
  );

  const reasoningDepth = clampScore(
    (graph.strategicThemes.length > 0 ? 20 : 0) +
      (graph.priorityOpportunities.length > 0 ? 25 : 0) +
      (graph.strategicRisks.length >= 1 ? 20 : 0) +
      (graph.assumptions.length >= 1 ? 20 : 0) +
      (graph.constraints.length > 0 ? 15 : 0)
  );

  const differentiation = clampScore(
    (!/still unknown|nog onbekend|generic/i.test(graph.strategicPositioning.description) ? 35 : 0) +
      (graph.differentiators.description.length > 15 ? 35 : 0) +
      (graph.rejectedAlternatives.some((a) => /price|prijs|generic|breed/i.test(a.alternative)) ? 30 : 0)
  );

  const traceability = clampScore(
    Math.min(50, evidenceCount * 10) +
      (graph.decisionRationales[0]?.evidence.length ? 25 : 0) +
      (graph.evidenceSummary.description.includes("evidence") ||
      graph.evidenceSummary.description.includes("Evidence")
        ? 25
        : 0)
  );

  const unknownAwareness = clampScore(
    (graph.unknowns.length > 0 ? 40 : 0) +
      (!/geen|none/i.test(graph.unknowns.map((u) => u.title).join(" ")) ? 20 : 0) +
      (graph.decisionRationales[0]?.unknowns.length ? 20 : 0) +
      (graph.strategicRisks.length > 0 ? 20 : 0)
  );

  const overallQuality = clampScore(
    (businessSpecificity +
      evidenceDensity +
      decisionQuality +
      reasoningDepth +
      differentiation +
      traceability +
      unknownAwareness) /
      7
  );

  return {
    businessSpecificity,
    evidenceDensity,
    decisionQuality,
    reasoningDepth,
    differentiation,
    traceability,
    unknownAwareness,
    overallQuality,
  };
}

export function validateStrategyQuality(
  graph: StrategyGraph,
  context?: { campaignContext?: CampaignContext | null; companyName?: string; minOverall?: number }
): StrategyQualityResult {
  const scores = scoreStrategyQuality(graph, context);
  const minOverall = context?.minOverall ?? 45;
  const issues: StrategyQualityIssue[] = [];
  const text = collectText(graph);
  const companyName = context?.companyName ?? context?.campaignContext?.companyName ?? "";

  if (companyName && !text.toLowerCase().includes(companyName.toLowerCase())) {
    issues.push({
      code: "business_name_absent",
      message: "Strategy text does not mention the business name.",
      dimension: "businessSpecificity",
    });
  }

  if (scores.evidenceDensity < 25) {
    issues.push({
      code: "insufficient_evidence",
      message: "Strategy lacks evidence density — too few research or reasoning references.",
      dimension: "evidenceDensity",
    });
  }

  if (graph.rejectedAlternatives.length < 2 && graph.decisionRationales.length > 0) {
    issues.push({
      code: "missing_rejected_alternatives",
      message: "Strategy must include at least two rejected alternatives.",
      dimension: "decisionQuality",
    });
  }

  if (graph.strategicRisks.length === 0) {
    issues.push({
      code: "missing_risks",
      message: "Strategy must surface at least one risk.",
      dimension: "reasoningDepth",
    });
  }

  if (graph.unknowns.length === 0) {
    issues.push({
      code: "missing_unknowns",
      message: "Strategy must preserve unknowns — never hide uncertainty.",
      dimension: "unknownAwareness",
    });
  }

  for (const phrase of GENERIC_PHRASES) {
    if (phrase.test(text)) {
      issues.push({
        code: "generic_marketing_advice",
        message: `Generic marketing phrase detected: ${phrase.source}`,
        dimension: "differentiation",
      });
      break;
    }
  }

  if (/still unknown|nog onbekend/i.test(graph.primaryAudience.description) && scores.businessSpecificity < 50) {
    issues.push({
      code: "audience_too_generic",
      message: "Target audience is unknown and strategy lacks business specificity.",
      dimension: "businessSpecificity",
    });
  }

  if (scores.overallQuality < minOverall) {
    issues.push({
      code: "overall_quality_low",
      message: `Overall strategy quality score ${scores.overallQuality} is below threshold ${minOverall}.`,
      dimension: "overallQuality",
    });
  }

  const valid = issues.length === 0;

  return { valid, scores, issues };
}
