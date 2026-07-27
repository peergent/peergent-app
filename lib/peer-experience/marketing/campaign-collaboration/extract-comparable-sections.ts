import type { CampaignReviewItemPreview } from "../campaign-review/campaign-review-types";

export type ComparableSection = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
};

function joinList(values: readonly string[]): string {
  return values.filter(Boolean).join(", ");
}

export function extractComparableSections(
  preview: CampaignReviewItemPreview
): readonly ComparableSection[] {
  switch (preview.kind) {
    case "campaign_strategy":
      return [
        { id: "headline", label: "Headline", value: preview.strategyTitle },
        { id: "summary", label: "Summary", value: preview.summary },
        { id: "positioning", label: "Positioning", value: preview.positioning },
        {
          id: "messaging_pillars",
          label: "Messaging pillars",
          value: joinList(preview.messagingPillars),
        },
        {
          id: "channels",
          label: "Recommended channels",
          value: joinList(preview.recommendedChannels),
        },
        { id: "cta", label: "CTA guidance", value: preview.ctaGuidance },
      ];
    case "creative_direction":
      return [
        { id: "concept", label: "Campaign concept", value: preview.campaignConcept },
        { id: "angle", label: "Campaign angle", value: preview.campaignAngle },
        { id: "tone", label: "Tone", value: preview.tone },
        {
          id: "messaging_hierarchy",
          label: "Messaging hierarchy",
          value: joinList(preview.messagingHierarchy),
        },
        { id: "visual", label: "Visual direction", value: preview.visualDirection },
        { id: "cta", label: "CTA direction", value: preview.ctaDirection },
      ];
    case "linkedin_post":
      return [
        { id: "hook", label: "Hook", value: preview.hook },
        { id: "body", label: "Main content", value: preview.mainContent },
        { id: "cta", label: "CTA", value: preview.cta },
        { id: "hashtags", label: "Hashtags", value: joinList(preview.hashtags) },
      ];
    case "email_campaign":
      return [
        { id: "subject", label: "Subject", value: preview.subject },
        { id: "preview_text", label: "Preview text", value: preview.previewText },
        { id: "body", label: "Body", value: preview.body },
        { id: "cta", label: "CTA", value: preview.cta },
      ];
    default: {
      const _exhaustive: never = preview;
      return _exhaustive;
    }
  }
}

export function normalizeSectionValue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
