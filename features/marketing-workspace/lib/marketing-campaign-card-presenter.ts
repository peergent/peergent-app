/**
 * Pure presenter helpers for Marketing Campaign cards (testable without DOM).
 */
import type { MarketingCampaignCardViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";

const MAX_TITLE_LENGTH = 60;
const MAX_GOAL_LENGTH = 80;
const MAX_CHANNEL_LABELS = 3;

export type MarketingCampaignCardPresentation = {
  title: string;
  statusLabel: string;
  progressLabel: string;
  goalLine: string | null;
  channelsLine: string | null;
  approvalLine: string | null;
  contentLine: string | null;
  blockedLine: string | null;
  nextActionLabel: string;
  nextActionHref: string;
  linkEnabled: boolean;
  href: string;
};

export function truncateCampaignText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

function formatChannelsLine(channels: readonly string[]): string | null {
  if (!channels.length) return null;
  const labels = channels.slice(0, MAX_CHANNEL_LABELS);
  const extra = channels.length - labels.length;
  const base = labels.join(", ");
  return extra > 0 ? `Channels: ${base} +${extra}` : `Channels: ${base}`;
}

export function presentMarketingCampaignCard(
  card: MarketingCampaignCardViewModel
): MarketingCampaignCardPresentation {
  const progressLabel = card.progressKnown
    ? `${card.progress}%`
    : "Not measured yet";

  const goalText = truncateCampaignText(card.goal, MAX_GOAL_LENGTH);

  return {
    title: truncateCampaignText(card.title, MAX_TITLE_LENGTH),
    statusLabel: card.statusLabel,
    progressLabel,
    goalLine: goalText ? `Goal: ${goalText}` : null,
    channelsLine: formatChannelsLine(card.channels),
    approvalLine:
      card.approvalCount > 0
        ? `Waiting for approval: ${card.approvalCount}`
        : null,
    contentLine:
      card.generatedContentCount > 0
        ? `Content created: ${card.generatedContentCount}`
        : null,
    blockedLine:
      card.blockedItemCount > 0 ? `Blocked: ${card.blockedItemCount}` : null,
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
    "creative brief",
    "context slice",
    "context package",
    "assembler",
    "assemblytrace",
    "evidence",
    "gaps",
    "prompt",
    "workunit",
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
