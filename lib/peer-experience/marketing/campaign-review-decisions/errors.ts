export type CampaignReviewDecisionErrorCode =
  | "SCOPE_MISMATCH"
  | "ARTIFACT_MISSING"
  | "NOT_REVIEWABLE"
  | "STALE_ARTIFACT_VERSION"
  | "ALREADY_DECIDED"
  | "INVALID_FEEDBACK"
  | "UNKNOWN_ITEM"
  | "PERSISTENCE_FAILED";

export class CampaignReviewDecisionError extends Error {
  readonly code: CampaignReviewDecisionErrorCode;
  readonly customerMessage: string;

  constructor(input: {
    code: CampaignReviewDecisionErrorCode;
    customerMessage: string;
    internalMessage?: string;
  }) {
    super(input.internalMessage ?? input.customerMessage);
    this.name = "CampaignReviewDecisionError";
    this.code = input.code;
    this.customerMessage = input.customerMessage;
  }
}

export function customerMessageForReviewDecisionError(
  code: CampaignReviewDecisionErrorCode
): string {
  switch (code) {
    case "ALREADY_DECIDED":
      return "This item has already been reviewed.";
    case "STALE_ARTIFACT_VERSION":
      return "A newer version is ready. Please review the latest version.";
    case "ARTIFACT_MISSING":
      return "This item is not ready to review yet.";
    case "NOT_REVIEWABLE":
      return "This item cannot be reviewed right now.";
    case "INVALID_FEEDBACK":
      return "Add feedback so Marketing Peer knows what to change.";
    case "UNKNOWN_ITEM":
      return "This review item could not be found.";
    case "PERSISTENCE_FAILED":
      return "Marketing Peer could not save your decision. Try again.";
    case "SCOPE_MISMATCH":
      return "This review item could not be found.";
    default:
      return "Something went wrong. Try again.";
  }
}
