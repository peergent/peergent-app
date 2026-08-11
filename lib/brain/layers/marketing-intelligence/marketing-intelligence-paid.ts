/**
 * Marketing Intelligence — paid media domain.
 */

import type { ChannelIntelligence } from "./brain-types";
import type { InsufficientDataReason, MarketingEvidenceRef, PaidMediaIntelligence } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

export function buildPaidMediaIntelligence(input: {
  channels: readonly ChannelIntelligence[];
  evidence: readonly MarketingEvidenceRef[];
  budgetContext?: string | null;
}): PaidMediaIntelligence {
  const paidChannels = input.channels.filter((c) => c.organicOrPaid === "paid" || c.organicOrPaid === "both");
  const searchChannel = paidChannels.find((c) => c.channel === "Google Search");
  const evidenceIds = paidChannels.flatMap((c) => c.evidenceIds);

  const insufficientData: InsufficientDataReason[] = [];
  if (evidenceIds.length === 0) insufficientData.push("channel_data_missing");
  if (!input.budgetContext) insufficientData.push("measurement_not_ready");

  const hasSearch = Boolean(searchChannel);

  return {
    intentQuality: hasSearch ? searchChannel!.intentFit : "low",
    audienceAvailability: paidChannels.length > 0 ? "medium" : "low",
    messageMarketFit: "medium",
    measurementReadiness: hasSearch ? "high" : insufficientData.includes("measurement_not_ready") ? "low" : "medium",
    landingPageReadiness: "low",
    competitivePressure: paidChannels.some((c) => c.competitiveIntensity === "high") ? "high" : "medium",
    creativeDemand: paidChannels.length > 1 ? "medium" : "low",
    budgetSensitivity: input.budgetContext ? "medium" : "high",
    confidence: enforceMarketingConfidenceCeiling(
      hasSearch ? "medium" : "low",
      evidenceIds.length
    ),
    evidenceIds,
    insufficientData,
  };
}
