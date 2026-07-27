import type { CampaignReviewDecision } from "../campaign-review-decisions";
import type { CampaignReviewFeedbackCategory } from "../campaign-review-decisions/campaign-review-decision-types";

const CATEGORY_CUSTOMER_LABELS: Record<CampaignReviewFeedbackCategory, string> = {
  audience: "Better targeting",
  positioning: "Clarified positioning",
  tone: "Adjusted tone",
  messaging: "Refined messaging",
  visual_direction: "Updated visual direction",
  call_to_action: "Improved CTA",
  length: "Adjusted length",
  channel_fit: "Updated channel fit",
  factual_accuracy: "Improved accuracy",
  brand_alignment: "Stronger brand alignment",
  other: "Other feedback",
};

export function customerFeedbackLines(decision: CampaignReviewDecision): string[] {
  const lines: string[] = [];
  for (const category of decision.feedback?.categories ?? []) {
    lines.push(CATEGORY_CUSTOMER_LABELS[category] ?? "Feedback noted");
  }
  const message = decision.feedback?.message?.trim();
  if (message) lines.push(message);
  return lines;
}

export function customerLabelForDecisionType(
  type: CampaignReviewDecision["decision"]
): string {
  switch (type) {
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Requested changes";
    case "rejected":
      return "Rejected";
    default:
      return "Updated";
  }
}

export function versionHistoryStatusLabel(input: {
  version: number;
  currentVersion: number;
  decision: CampaignReviewDecision | null;
}): { customerStatusLabel: string; decisionType: "created" | "pending" | CampaignReviewDecision["decision"] } {
  if (input.version === input.currentVersion && !input.decision) {
    return { customerStatusLabel: "Current", decisionType: "pending" };
  }
  if (!input.decision) {
    return { customerStatusLabel: "Created", decisionType: "created" };
  }
  if (input.version === input.currentVersion) {
    return {
      customerStatusLabel: `Current · ${customerLabelForDecisionType(input.decision.decision)}`,
      decisionType: input.decision.decision,
    };
  }
  return {
    customerStatusLabel: customerLabelForDecisionType(input.decision.decision),
    decisionType: input.decision.decision,
  };
}

export function decisionForVersion(
  history: readonly CampaignReviewDecision[] | undefined,
  version: number
): CampaignReviewDecision | null {
  if (!history?.length) return null;
  const matches = history.filter((d) => d.artifactVersion === version);
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))[0]!;
}
