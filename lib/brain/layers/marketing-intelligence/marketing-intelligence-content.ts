/**
 * Marketing Intelligence — content domain.
 */

import type { ResearchBrainGraph } from "../research/brain-types";
import type { ContentIntelligence, MarketingEvidenceRef } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

export function buildContentIntelligence(input: {
  researchGraph: ResearchBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
}): ContentIntelligence {
  const searchInsights = input.researchGraph.searchInsights;
  const evidenceIds = input.evidence
    .filter((e) => /content|blog|seo|search/i.test(e.summary))
    .map((e) => e.id);

  const contentGaps = [
    ...searchInsights.flatMap((s) => s.contentGaps),
    ...input.researchGraph.unresolvedQuestions.map((q) => q.question),
  ].filter(Boolean);

  return {
    contentThemes: searchInsights.flatMap((s) => s.keywordThemes).length
      ? searchInsights.flatMap((s) => s.keywordThemes)
      : input.researchGraph.competitorProfiles.flatMap((p) => p.contentThemes),
    coverageGaps: contentGaps.slice(0, 5),
    formatOpportunities: [],
    authorityGaps: input.researchGraph.positioningInsights.flatMap((p) => p.proofGaps),
    educationGaps: input.researchGraph.unresolvedQuestions.map((q) => q.question).slice(0, 3),
    objectionContentGaps: [],
    proofGaps: input.researchGraph.positioningInsights.flatMap((p) => p.proofGaps),
    comparisonContentOpportunities: input.researchGraph.competitorProfiles.length
      ? ["Competitor comparison content may be valuable"]
      : [],
    searchIntentContentGaps: searchInsights.flatMap((s) => s.contentGaps),
    confidence: enforceMarketingConfidenceCeiling(
      evidenceIds.length > 0 ? "medium" : "low",
      evidenceIds.length
    ),
    evidenceIds,
  };
}
