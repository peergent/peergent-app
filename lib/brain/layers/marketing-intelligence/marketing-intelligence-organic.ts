/**
 * Marketing Intelligence — organic domain.
 */

import type { ChannelIntelligence } from "./brain-types";
import type { MarketingEvidenceRef, OrganicIntelligence } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

export function buildOrganicIntelligence(input: {
  channels: readonly ChannelIntelligence[];
  evidence: readonly MarketingEvidenceRef[];
}): OrganicIntelligence {
  const organicChannels = input.channels.filter(
    (c) => c.organicOrPaid === "organic" || c.organicOrPaid === "both"
  );
  const evidenceIds = organicChannels.flatMap((c) => c.evidenceIds);
  const hasSeo = organicChannels.some((c) => c.channel === "SEO" || c.channel === "Blog");

  return {
    authority: hasSeo ? "medium" : "low",
    contentConsistency: organicChannels.length > 0 ? "medium" : "low",
    searchVisibility: hasSeo ? "medium" : "low",
    socialPresence: organicChannels.some((c) => /Social|LinkedIn/i.test(c.channel)) ? "medium" : "low",
    brandDemand: "low",
    thoughtLeadershipOpportunity: hasSeo ? "medium" : "low",
    communityOpportunity: "low",
    proofAvailability: evidenceIds.length > 0 ? "medium" : "low",
    confidence: enforceMarketingConfidenceCeiling(
      evidenceIds.length >= 2 ? "medium" : "low",
      evidenceIds.length
    ),
    evidenceIds,
  };
}
