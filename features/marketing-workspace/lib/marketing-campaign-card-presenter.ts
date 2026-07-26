/**
 * Pure presenter helpers for Marketing Campaign cards (testable without DOM).
 */
import type { MarketingCampaignCardViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";

export type MarketingCampaignCardPresentation = {
  title: string;
  statusLabel: string;
  progressLabel: string;
  goalLine: string | null;
  audienceLine: string | null;
  channelsLine: string | null;
  timelineLine: string | null;
  approvalLine: string | null;
  contentLine: string | null;
  blockedLine: string | null;
  recommendationLine: string | null;
  workforceLine: string | null;
  nextActionLabel: string;
  nextActionHref: string;
  linkEnabled: boolean;
  href: string;
};

export function presentMarketingCampaignCard(
  card: MarketingCampaignCardViewModel
): MarketingCampaignCardPresentation {
  const progressLabel = card.progressKnown
    ? `${card.progress}%`
    : "Not measured yet";

  return {
    title: card.title,
    statusLabel: card.statusLabel,
    progressLabel,
    goalLine: card.goal.trim() ? `Goal: ${card.goal.trim()}` : null,
    audienceLine: card.audienceSummary.trim()
      ? `Audience: ${card.audienceSummary.trim()}`
      : null,
    channelsLine: card.channels.length
      ? `Channels: ${card.channels.join(", ")}`
      : null,
    timelineLine: card.timelineSummary.trim()
      ? `Timeline: ${card.timelineSummary.trim()}`
      : null,
    approvalLine:
      card.approvalCount > 0
        ? `Waiting for approval: ${card.approvalCount}`
        : null,
    contentLine:
      card.generatedContentCount > 0
        ? `Content created: ${card.generatedContentCount}`
        : null,
    blockedLine:
      card.blockedItemCount > 0 ? `Blocked items: ${card.blockedItemCount}` : null,
    recommendationLine: card.recommendationSummary?.trim()
      ? card.recommendationSummary.trim()
      : null,
    workforceLine: card.assignedWorkforce.length
      ? `Team: ${card.assignedWorkforce.map((w) => w.roleLabel).join(", ")}`
      : null,
    nextActionLabel: card.nextAction.label,
    nextActionHref: card.nextAction.href,
    linkEnabled: card.linkEnabled,
    href: card.href,
  };
}

/** Customer-visible strings only — rejects internal vocabulary. */
export function assertCustomerSafeCampaignPresentation(
  presentation: MarketingCampaignCardPresentation
): void {
  const blob = JSON.stringify(presentation).toLowerCase();
  const forbidden = [
    "marketingdecision",
    "creativebrief",
    "context slice",
    "assembler",
    "assemblytrace",
    "evidence",
    "gaps",
    "prompt",
  ];
  for (const term of forbidden) {
    if (blob.includes(term)) {
      throw new Error(`Internal term leaked to campaign presentation: ${term}`);
    }
  }
}

export function presentMarketingCampaignsEmptyMessage(peerName: string): string {
  return `${peerName} has not set up a campaign yet. When strategy and planning are ready, you'll see campaign progress here.`;
}
