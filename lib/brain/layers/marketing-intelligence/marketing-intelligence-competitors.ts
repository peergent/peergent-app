/**
 * Marketing Intelligence — competitive marketing domain.
 */

import type { ResearchBrainGraph } from "../research/brain-types";
import type { MarketingEvidenceRef, CompetitiveMarketingIntelligence } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

let compCounter = 0;

export function resetCompetitiveMarketingCounter(): void {
  compCounter = 0;
}

export function buildCompetitiveMarketingIntelligence(input: {
  researchGraph: ResearchBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
}): CompetitiveMarketingIntelligence[] {
  const results: CompetitiveMarketingIntelligence[] = [];

  for (const profile of input.researchGraph.competitorProfiles) {
    compCounter += 1;
    const evidenceIds =
      profile.evidenceIds.length > 0
        ? input.evidence
            .filter((e) => profile.evidenceIds.includes(e.refId) || e.summary.includes(profile.name))
            .map((e) => e.id)
        : [];

    results.push({
      competitorId: profile.id,
      name: profile.name,
      channelPresence: [...profile.channels],
      messagingShare: profile.positioning,
      campaignThemes: [...profile.contentThemes],
      positioningCluster: profile.positioning,
      offerPatterns: profile.offer ? [profile.offer] : [],
      ctaPatterns: [],
      contentThemes: [...profile.contentThemes],
      creativePatterns: [],
      proofUsage: [...profile.proofPoints],
      marketSaturation: profile.confidence === "high" ? "high" : "medium",
      visibleWeaknesses: [...profile.weaknesses],
      visibleWhitespace: profile.differentiators.length ? [...profile.differentiators] : [],
      confidence: enforceMarketingConfidenceCeiling(profile.confidence, evidenceIds.length),
      evidenceIds,
    });
  }

  return results;
}
