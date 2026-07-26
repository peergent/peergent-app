import type {
  MarketingCampaignDetailViewModel,
  MarketingCampaignLinkedContentItem,
} from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import { truncateCampaignText } from "./marketing-campaign-card-presenter";

export function presentCampaignProgressLabel(
  campaign: Pick<MarketingCampaignDetailViewModel, "progressKnown" | "progress">
): string {
  return campaign.progressKnown ? `${campaign.progress}%` : "Not measured yet";
}

export function presentCampaignConciseGoal(
  campaign: MarketingCampaignDetailViewModel
): string | null {
  const objective =
    campaign.goal.marketingObjective.trim() ||
    campaign.goal.businessObjective.trim() ||
    campaign.description?.trim() ||
    "";
  if (!objective) return null;
  return `Goal: ${truncateCampaignText(objective, 120)}`;
}

export function countDeliverableApprovalStates(
  linkedContent: readonly MarketingCampaignLinkedContentItem[]
): { approved: number; rejected: number } {
  let approved = 0;
  let rejected = 0;
  for (const item of linkedContent) {
    const label = item.statusLabel.toLowerCase();
    if (label.includes("reject")) {
      rejected += 1;
    } else if (
      label.includes("approved") ||
      label.includes("published") ||
      label.includes("ready to publish")
    ) {
      approved += 1;
    }
  }
  return { approved, rejected };
}
