import type { CampaignReviewArtifactType } from "@/lib/peer-experience/marketing/campaign-review/campaign-review-types";
import type { CampaignReviewFeedbackCategory } from "@/lib/peer-experience/marketing/campaign-review-decisions";

export type CustomerReviewFeedbackOption = {
  readonly id: CampaignReviewFeedbackCategory;
  readonly label: string;
};

export function customerFeedbackOptionsForArtifact(
  artifactType: CampaignReviewArtifactType
): readonly CustomerReviewFeedbackOption[] {
  const universal: readonly CustomerReviewFeedbackOption[] = [
    { id: "tone", label: "Make it more professional" },
    { id: "audience", label: "Better targeting" },
    { id: "tone", label: "Different tone" },
    { id: "length", label: "Shorter" },
    { id: "messaging", label: "More detailed" },
    { id: "call_to_action", label: "Stronger CTA" },
    { id: "other", label: "Other" },
  ];

  const artifactSpecific = (() => {
    switch (artifactType) {
      case "campaign_strategy":
        return [
          { id: "audience" as const, label: "Refine audience" },
          { id: "positioning" as const, label: "Change positioning" },
          { id: "channel_fit" as const, label: "Change channels" },
        ];
      case "creative_direction":
        return [{ id: "visual_direction" as const, label: "Change visual direction" }];
      case "linkedin_post":
        return [{ id: "messaging" as const, label: "Stronger hook" }];
      case "email_campaign":
        return [{ id: "messaging" as const, label: "Improve subject line" }];
      default:
        return [];
    }
  })();

  const seen = new Set<string>();
  const merged: CustomerReviewFeedbackOption[] = [];
  for (const opt of [...artifactSpecific, ...universal]) {
    const key = `${opt.id}:${opt.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(opt);
  }
  return merged;
}

export function approveModalTitleForItem(artifactTypeLabel: string): string {
  const lower = artifactTypeLabel.toLowerCase();
  if (lower.includes("strategy")) return "Approve this strategy?";
  if (lower.includes("creative")) return "Approve this creative direction?";
  if (lower.includes("linkedin")) return "Approve this LinkedIn post?";
  if (lower.includes("email")) return "Approve this email campaign?";
  return `Approve this ${lower}?`;
}

export function approvePrimaryButtonLabel(artifactTypeLabel: string): string {
  const lower = artifactTypeLabel.toLowerCase();
  if (lower.includes("strategy")) return "Approve strategy";
  if (lower.includes("creative")) return "Approve creative direction";
  if (lower.includes("linkedin")) return "Approve LinkedIn post";
  if (lower.includes("email")) return "Approve email";
  return "Approve";
}

export const CUSTOMER_REJECTION_OPTIONS = [
  { id: "wrong_direction" as const, label: "Wrong direction" },
  { id: "wrong_audience" as const, label: "Wrong audience" },
  { id: "off_brand" as const, label: "Off brand" },
  { id: "inaccurate" as const, label: "Inaccurate" },
  { id: "start_over" as const, label: "Start over" },
  { id: "other" as const, label: "Other" },
];
