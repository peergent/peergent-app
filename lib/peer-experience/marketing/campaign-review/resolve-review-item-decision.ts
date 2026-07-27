import {
  customerLabelForReviewDecisionStatus,
  summarizeReviewFeedbackForCustomer,
  type CampaignReviewItemDecisionStatus,
} from "../campaign-review-decisions/campaign-review-decision-status";
import { getCampaignArtifactVersion } from "../campaign-review-decisions/campaign-artifact-version";
import { resolveCurrentCampaignReviewDecision } from "../campaign-review-decisions/campaign-review-decision-history";
import type { CampaignReviewBuildInput, CampaignReviewItem } from "./campaign-review-types";
import { isCustomerReviewRelevant } from "./campaign-review-status";

export type ReviewItemDecisionOverlay = Pick<
  CampaignReviewItem,
  | "decisionStatus"
  | "decisionStatusLabel"
  | "currentDecision"
  | "artifactVersion"
  | "decidedAt"
  | "feedbackSummary"
  | "inReviewQueue"
  | "continuationBlocked"
  | "canRequestRevision"
  | "status"
  | "statusLabel"
  | "reviewRequired"
  | "blockingNextWork"
>;

export function overlayReviewDecisionOnItem(input: {
  base: Omit<
    CampaignReviewItem,
    | "decisionStatus"
    | "decisionStatusLabel"
    | "currentDecision"
    | "artifactVersion"
    | "decidedAt"
    | "feedbackSummary"
    | "inReviewQueue"
    | "continuationBlocked"
    | "canRequestRevision"
  >;
  buildInput: CampaignReviewBuildInput;
  reviewReady: boolean;
  hasArtifact: boolean;
}): ReviewItemDecisionOverlay {
  const artifactVersion = getCampaignArtifactVersion(
    input.base.workUnitId,
    input.buildInput.campaignArtifactVersionByWorkUnitId
  );
  const currentDecision = resolveCurrentCampaignReviewDecision({
    workUnitId: input.base.workUnitId,
    artifactVersion,
    decisions: input.buildInput.campaignReviewDecisionByWorkUnitId,
  });

  const activeWorkUnitId = input.buildInput.activeWorkUnitId ?? null;
  const isUpdating =
    activeWorkUnitId === input.base.workUnitId &&
    (input.base.status === "in_progress" || Boolean(input.buildInput.continuationRunning));

  let decisionStatus: CampaignReviewItemDecisionStatus = "ready_for_review";
  if (isUpdating) {
    decisionStatus = "updating";
  } else if (!input.hasArtifact || !input.reviewReady) {
    decisionStatus = "ready_for_review";
  } else if (!currentDecision) {
    decisionStatus = "awaiting_review";
  } else if (currentDecision.decision === "approved") {
    decisionStatus = "approved";
  } else if (currentDecision.decision === "changes_requested") {
    decisionStatus = "changes_requested";
  } else {
    decisionStatus = "rejected";
  }

  const reviewRelevant = isCustomerReviewRelevant(input.buildInput.approvalMode);

  const inReviewQueue =
    input.hasArtifact &&
    input.reviewReady &&
    reviewRelevant &&
    decisionStatus === "awaiting_review";

  const continuationBlocked =
    reviewRelevant &&
    input.buildInput.approvalMode === "approval_before_generation" &&
    input.reviewReady &&
    input.hasArtifact &&
    currentDecision?.decision !== "approved";

  const canRequestRevision =
    decisionStatus === "changes_requested" || decisionStatus === "rejected";

  let status = input.base.status;
  let statusLabel = input.base.statusLabel;
  if (decisionStatus === "awaiting_review") {
    status = "awaiting_review";
    statusLabel = customerLabelForReviewDecisionStatus("awaiting_review");
  } else if (decisionStatus === "approved") {
    status = "prepared";
    statusLabel = customerLabelForReviewDecisionStatus("approved");
  } else if (decisionStatus === "changes_requested") {
    status = "prepared";
    statusLabel = customerLabelForReviewDecisionStatus("changes_requested");
  } else if (decisionStatus === "rejected") {
    status = "prepared";
    statusLabel = customerLabelForReviewDecisionStatus("rejected");
  } else if (decisionStatus === "updating") {
    statusLabel = customerLabelForReviewDecisionStatus("updating");
  }

  const feedbackSummary = currentDecision
    ? summarizeReviewFeedbackForCustomer({
        decision: currentDecision.decision,
        message: currentDecision.feedback?.message,
      })
    : null;

  const reviewRequired =
    reviewRelevant &&
    input.reviewReady &&
    input.hasArtifact &&
    decisionStatus === "awaiting_review";

  return {
    decisionStatus,
    decisionStatusLabel: customerLabelForReviewDecisionStatus(decisionStatus),
    currentDecision,
    artifactVersion,
    decidedAt: currentDecision?.decidedAt ?? null,
    feedbackSummary,
    inReviewQueue,
    continuationBlocked,
    canRequestRevision,
    status,
    statusLabel,
    reviewRequired: reviewRequired,
    blockingNextWork: continuationBlocked,
  };
}

export function pickNextPendingReviewItemId(
  items: readonly CampaignReviewItem[],
  afterWorkUnitId?: string
): string | undefined {
  const queue = items.filter((i) => i.inReviewQueue && i.preview);
  if (queue.length === 0) return undefined;
  if (!afterWorkUnitId) return queue[0]?.id;
  const idx = queue.findIndex((i) => i.workUnitId === afterWorkUnitId);
  if (idx >= 0 && idx < queue.length - 1) {
    return queue[idx + 1]?.id;
  }
  return queue.find((i) => i.workUnitId !== afterWorkUnitId)?.id;
}

export function mergeDecisionIntoReviewItem(
  base: Omit<
    CampaignReviewItem,
    | "decisionStatus"
    | "decisionStatusLabel"
    | "currentDecision"
    | "artifactVersion"
    | "decidedAt"
    | "feedbackSummary"
    | "inReviewQueue"
    | "continuationBlocked"
    | "canRequestRevision"
  >,
  overlay: ReviewItemDecisionOverlay
): CampaignReviewItem {
  return { ...base, ...overlay };
}
