import type { Campaign } from "@/lib/campaign";

import { getMarketingCampaignHref, getReviewHref, getPerformanceHref } from "../navigation/marketing-peer-links";
import type { MarketingCampaignNextAction } from "./marketing-campaign-types";

export function deriveMarketingCampaignNextAction(input: {
  peerId: string;
  campaignId: string;
  status: Campaign["execution"]["status"];
  approvalCount: number;
  blockedItemCount: number;
  draftIds: string[];
  drafts: readonly { id: string; status: string }[];
  planActivityCount: number;
  performanceKnown: boolean;
  hasPublishedContent: boolean;
}): MarketingCampaignNextAction {
  const reviewHref = getReviewHref(input.peerId);

  if (input.approvalCount > 0) {
    return {
      label: "Review approvals",
      reason: `${input.approvalCount} deliverable(s) need your review before publishing.`,
      href: reviewHref,
    };
  }

  if (input.status === "blocked" || input.blockedItemCount > 0) {
    return {
      label: "Resolve blocker",
      reason: "Work is blocked until you clear the outstanding issue.",
      href: getMarketingCampaignHref(input.peerId, input.campaignId),
    };
  }

  if (input.status === "planning" || input.status === "draft") {
    const missingCreative =
      input.planActivityCount > 0 && input.draftIds.length < input.planActivityCount;
    if (missingCreative) {
      return {
        label: "Generate missing creative",
        reason: "Some planned activities do not have draft content yet.",
        href: getMarketingCampaignHref(input.peerId, input.campaignId),
      };
    }
    return {
      label: "Continue planning",
      reason: "Strategy and plan are in place — keep shaping the campaign.",
      href: getMarketingCampaignHref(input.peerId, input.campaignId),
    };
  }

  const readyToPublish = input.drafts.some(
    (d) => input.draftIds.includes(d.id) && d.status === "ready_to_publish"
  );
  if (readyToPublish) {
    return {
      label: "Publish approved content",
      reason: "Approved content is ready to publish.",
      href: getReviewHref(input.peerId),
    };
  }

  if (input.hasPublishedContent && !input.performanceKnown) {
    return {
      label: "Inspect performance",
      reason: "Published content is live — performance will appear as channels sync.",
      href: getPerformanceHref(input.peerId, { campaignId: input.campaignId }),
    };
  }

  return {
    label: "Continue planning",
    reason: "No urgent action — keep the campaign moving forward.",
    href: getMarketingCampaignHref(input.peerId, input.campaignId),
  };
}
