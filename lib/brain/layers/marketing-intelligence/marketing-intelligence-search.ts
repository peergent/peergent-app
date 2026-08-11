/**
 * Marketing Intelligence — search/SEO domain.
 */

import type { ResearchBrainGraph } from "../research/brain-types";
import type { MarketingEvidenceRef, SearchIntelligence } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

export function buildSearchIntelligence(input: {
  researchGraph: ResearchBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
}): SearchIntelligence {
  const searchInsights = input.researchGraph.searchInsights;
  const seoFindings = input.researchGraph.findings.filter((f) => f.domain === "search_seo");
  const evidenceIds = [
    ...searchInsights.flatMap((s) => s.evidenceIds),
    ...input.evidence.filter((e) => /search|seo|keyword/i.test(e.summary)).map((e) => e.id),
  ];

  const hasData = evidenceIds.length > 0 || seoFindings.length > 0 || searchInsights.length > 0;

  return {
    commercialIntentClusters: searchInsights.flatMap((s) => s.commercialIntent).length
      ? searchInsights.flatMap((s) => s.commercialIntent)
      : seoFindings.filter((f) => /commercial/i.test(f.summary)).map((f) => f.summary),
    informationalClusters: searchInsights.flatMap((s) => s.informationalIntent).length
      ? searchInsights.flatMap((s) => s.informationalIntent)
      : seoFindings.filter((f) => /informational/i.test(f.summary)).map((f) => f.summary),
    searchOpportunityThemes: searchInsights.flatMap((s) => s.rankingOpportunities).length
      ? searchInsights.flatMap((s) => s.rankingOpportunities)
      : searchInsights.flatMap((s) => s.keywordThemes),
    contentGaps: searchInsights.flatMap((s) => s.contentGaps),
    competitiveSearchPressure:
      input.researchGraph.competitorProfiles.length >= 2 ? "high" : "medium",
    brandDemand: "low",
    nonBrandDemand: hasData ? "medium" : "low",
    questionThemes: searchInsights.flatMap((s) => s.searchQuestions),
    conversionIntentTopics: searchInsights.flatMap((s) => s.commercialIntent).length
      ? searchInsights.flatMap((s) => s.commercialIntent)
      : [],
    confidence: enforceMarketingConfidenceCeiling(hasData ? "medium" : "low", evidenceIds.length),
    evidenceIds: [...new Set(evidenceIds)],
  };
}
