import type {
  CampaignReviewDecisionType,
  CampaignReviewFeedback,
} from "./campaign-review-decision-types";

export function validateCampaignReviewFeedback(input: {
  decision: CampaignReviewDecisionType;
  feedback?: CampaignReviewFeedback;
}): { ok: true } | { ok: false; reason: string } {
  if (input.decision === "approved") {
    return { ok: true };
  }

  if (input.decision === "rejected") {
    if (!input.feedback?.rejectionReason) {
      return { ok: false, reason: "Rejection reason is required." };
    }
    return { ok: true };
  }

  const categories = input.feedback?.categories ?? [];
  const message = input.feedback?.message?.trim() ?? "";
  if (categories.length === 0 && !message) {
    return {
      ok: false,
      reason: "Add at least one category or describe what should change.",
    };
  }
  return { ok: true };
}
