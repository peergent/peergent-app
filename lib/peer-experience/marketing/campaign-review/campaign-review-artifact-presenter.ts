import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";

import type { MarketingProject } from "../projects/types";
import { mapMarketingStrategyToCampaignStrategyOutput } from "../runtime/map-campaign-strategy-output";
import { mapCreativeBriefToWorkUnitOutput } from "../runtime/validate-creative-direction-output";
import { mapEmailCampaignToWorkUnitOutput } from "../runtime/validate-email-campaign-output";
import { mapLinkedInPostToWorkUnitOutput } from "../runtime/validate-linkedin-post-output";
import type {
  CampaignReviewArtifactType,
  CampaignReviewItemPreview,
  CreativeDirectionReviewPreview,
  EmailReviewPreview,
  CampaignStrategyReviewPreview,
  LinkedInReviewPreview,
} from "./campaign-review-types";

export const CAMPAIGN_REVIEW_ARTIFACT_TYPE_LABELS: Record<
  CampaignReviewArtifactType,
  string
> = {
  campaign_strategy: "Campaign strategy",
  creative_direction: "Creative direction",
  linkedin_post: "LinkedIn post",
  email_campaign: "Email campaign",
};

export function buildCampaignStrategyReviewPreview(input: {
  project: MarketingProject;
  strategy: MarketingStrategy;
}): CampaignStrategyReviewPreview {
  const mapped = mapMarketingStrategyToCampaignStrategyOutput({
    project: input.project,
    strategy: input.strategy,
    decision: null,
  });
  return {
    kind: "campaign_strategy",
    strategyTitle: mapped.title,
    summary: mapped.summary,
    positioning: mapped.positioning,
    messagingPillars: mapped.messagingPillars,
    recommendedChannels: mapped.recommendedChannels,
    ctaGuidance: mapped.ctaGuidance,
  };
}

export function buildCreativeDirectionReviewPreview(
  brief: CreativeBrief
): CreativeDirectionReviewPreview {
  const mapped = mapCreativeBriefToWorkUnitOutput(brief);
  return {
    kind: "creative_direction",
    campaignConcept: mapped.campaignConcept,
    campaignAngle: mapped.campaignAngle,
    tone: mapped.tone,
    messagingHierarchy: mapped.messagingHierarchy,
    visualDirection: mapped.visualDirection,
    ctaDirection: mapped.ctaGuidance,
    brandConstraints: mapped.brandConstraints,
    creativeRecommendations: mapped.creativeRecommendations,
  };
}

export function buildLinkedInReviewPreview(post: MarketingLinkedInPost): LinkedInReviewPreview {
  const mapped = mapLinkedInPostToWorkUnitOutput(post);
  return {
    kind: "linkedin_post",
    hook: mapped.hook,
    mainContent: mapped.body,
    cta: mapped.cta,
    hashtags: mapped.hashtags,
    suggestedImageDescription: mapped.suggestedImageDescription,
    publishingRecommendation: mapped.publishingRecommendation,
  };
}

export function buildEmailReviewPreview(email: MarketingEmailCampaign): EmailReviewPreview {
  const mapped = mapEmailCampaignToWorkUnitOutput(email);
  return {
    kind: "email_campaign",
    subject: mapped.subject,
    previewText: mapped.previewText,
    body: mapped.body,
    cta: mapped.cta,
    ...(mapped.secondaryCta ? { secondaryCta: mapped.secondaryCta } : {}),
    ...(mapped.suggestedSendTiming ? { suggestedSendTiming: mapped.suggestedSendTiming } : {}),
    ...(mapped.audienceNote ? { audienceNote: mapped.audienceNote } : {}),
  };
}

export function shortSummaryFromPreview(
  preview: CampaignReviewItemPreview | null
): string {
  if (!preview) {
    return "Prepared by Marketing Peer";
  }
  switch (preview.kind) {
    case "campaign_strategy":
      return preview.summary.slice(0, 160);
    case "creative_direction":
      return preview.campaignConcept.slice(0, 160);
    case "linkedin_post":
      return preview.hook.slice(0, 160);
    case "email_campaign":
      return preview.subject.slice(0, 160);
    default: {
      const _exhaustive: never = preview;
      return _exhaustive;
    }
  }
}
