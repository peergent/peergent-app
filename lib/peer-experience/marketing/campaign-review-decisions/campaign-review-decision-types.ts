import type { CampaignReviewArtifactType } from "../campaign-review/campaign-review-types";

export type CampaignReviewDecisionType =
  | "approved"
  | "changes_requested"
  | "rejected";

export type CampaignReviewFeedbackCategory =
  | "audience"
  | "positioning"
  | "tone"
  | "messaging"
  | "visual_direction"
  | "call_to_action"
  | "length"
  | "channel_fit"
  | "factual_accuracy"
  | "brand_alignment"
  | "other";

export type CampaignReviewRejectionReason =
  | "wrong_direction"
  | "wrong_audience"
  | "off_brand"
  | "inaccurate"
  | "unusable"
  | "start_over"
  | "other";

export type CampaignReviewFeedback = {
  readonly categories?: readonly CampaignReviewFeedbackCategory[];
  readonly message?: string;
  readonly rejectionReason?: CampaignReviewRejectionReason;
};

export type CampaignReviewDecision = {
  readonly id: string;
  readonly organizationId: string;
  readonly peerId: string;
  readonly projectId: string;
  readonly workUnitId: string;
  readonly artifactType: CampaignReviewArtifactType;
  readonly decision: CampaignReviewDecisionType;
  readonly feedback?: CampaignReviewFeedback;
  readonly artifactVersion: number;
  readonly decidedBy: string;
  readonly decidedAt: string;
  readonly updatedAt: string;
};

export type CampaignReviewDecisionMap = Readonly<
  Record<string, CampaignReviewDecision>
>;

export type CampaignReviewDecisionHistoryMap = Readonly<
  Record<string, readonly CampaignReviewDecision[]>
>;

export type CampaignArtifactVersionMap = Readonly<Record<string, number>>;

export type CampaignReviewDecisionResultStatus =
  | "approved"
  | "changes_requested"
  | "rejected"
  | "already_decided"
  | "invalid"
  | "failed";

export type CampaignReviewDecisionResult = {
  readonly ok: boolean;
  readonly status: CampaignReviewDecisionResultStatus;
  readonly workUnitId: string;
  readonly decision?: CampaignReviewDecision;
  readonly campaignCanContinue: boolean;
  readonly nextReviewItemId?: string;
  readonly message: string;
};

export type ApplyCampaignReviewDecisionInput = {
  readonly organizationId: string;
  readonly peerId: string;
  readonly projectId: string;
  readonly workUnitId: string;
  readonly artifactType: CampaignReviewArtifactType;
  readonly artifactVersion: number;
  readonly decision: CampaignReviewDecisionType;
  readonly feedback?: CampaignReviewFeedback;
  readonly decidedBy: string;
  readonly decidedAt: string;
};
