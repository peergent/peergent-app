import type { CampaignReviewArtifactType } from "../campaign-review/campaign-review-types";
import type { CampaignReviewDecisionType } from "./campaign-review-decision-types";

export type CampaignReviewItemDecisionStatus =
  | "awaiting_review"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "updating"
  | "ready_for_review";

export function customerLabelForReviewDecisionStatus(
  status: CampaignReviewItemDecisionStatus
): string {
  switch (status) {
    case "awaiting_review":
      return "Ready for your review";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes requested";
    case "rejected":
      return "Needs your direction";
    case "updating":
      return "Marketing Peer is updating";
    case "ready_for_review":
      return "Ready for review";
    default:
      return "In progress";
  }
}

export function summarizeReviewFeedbackForCustomer(input: {
  decision: CampaignReviewDecisionType;
  message?: string;
}): string | null {
  if (input.decision === "approved") return null;
  const trimmed = input.message?.trim();
  if (trimmed) return trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
  if (input.decision === "changes_requested") {
    return "You asked Marketing Peer to revise this item.";
  }
  if (input.decision === "rejected") {
    return "You rejected this item.";
  }
  return null;
}

export function activityTitleForReviewDecision(input: {
  artifactType: CampaignReviewArtifactType;
  decision: CampaignReviewDecisionType;
}): string {
  const subject =
    input.artifactType === "campaign_strategy"
      ? "Campaign strategy"
      : input.artifactType === "creative_direction"
        ? "Creative direction"
        : input.artifactType === "linkedin_post"
          ? "LinkedIn content"
          : "Email campaign";

  switch (input.decision) {
    case "approved":
      return `${subject} approved.`;
    case "changes_requested":
      return `Changes requested for ${subject.toLowerCase()}.`;
    case "rejected":
      return `${subject} rejected.`;
    default:
      return `${subject} updated.`;
  }
}
