export type {
  ApplyCampaignReviewDecisionInput,
  CampaignArtifactVersionMap,
  CampaignReviewDecision,
  CampaignReviewDecisionHistoryMap,
  CampaignReviewDecisionMap,
  CampaignReviewDecisionResult,
  CampaignReviewDecisionResultStatus,
  CampaignReviewDecisionType,
  CampaignReviewFeedback,
  CampaignReviewFeedbackCategory,
  CampaignReviewRejectionReason,
} from "./campaign-review-decision-types";

export {
  applyCampaignReviewDecision,
  type ApplyCampaignReviewDecisionContext,
  type ApplyCampaignReviewDecisionPersist,
} from "./apply-campaign-review-decision";

export {
  getCampaignArtifactVersion,
  bumpCampaignArtifactVersion,
  ensureInitialCampaignArtifactVersion,
} from "./campaign-artifact-version";

export {
  appendCampaignReviewDecisionHistory,
  resolveCurrentCampaignReviewDecision,
  isCampaignReviewDecisionCurrent,
} from "./campaign-review-decision-history";

export {
  validateCampaignReviewFeedback,
} from "./validate-campaign-review-feedback";

export {
  CampaignReviewDecisionError,
  customerMessageForReviewDecisionError,
} from "./errors";

export {
  canCampaignContinueAfterReviewDecision,
  campaignReviewBlocksContinuation,
  listCampaignReviewArtifactContexts,
  type CampaignReviewArtifactContext,
} from "./can-campaign-continue-after-review-decision";

export {
  activityTitleForReviewDecision,
  customerLabelForReviewDecisionStatus,
  summarizeReviewFeedbackForCustomer,
  type CampaignReviewItemDecisionStatus,
} from "./campaign-review-decision-status";

export { reopenMarketingWorkUnitForRevision } from "./reopen-work-unit-for-revision";

export {
  appendReviewFeedbackToTaskHint,
  buildReviewFeedbackTaskHintAppendix,
} from "./append-review-feedback-to-task-hint";
