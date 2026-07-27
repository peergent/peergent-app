import type { CampaignReviewArtifactType } from "../campaign-review/campaign-review-types";
import type { CampaignReviewDecisionType } from "../campaign-review-decisions";

export type CampaignVersionHistoryEntry = {
  readonly version: number;
  readonly isCurrent: boolean;
  readonly customerStatusLabel: string;
  readonly decisionType: CampaignReviewDecisionType | "created" | "pending";
  readonly decidedAt: string | null;
  readonly decisionId: string | null;
};

export type CampaignVersionHistoryViewModel = {
  readonly workUnitId: string;
  readonly artifactType: CampaignReviewArtifactType;
  readonly artifactTypeLabel: string;
  readonly title: string;
  readonly currentVersion: number;
  readonly entries: readonly CampaignVersionHistoryEntry[];
};

export type CampaignRevisionTimelineActor = "marketing_peer" | "customer" | "system";

export type CampaignRevisionTimelineEntry = {
  readonly id: string;
  readonly actor: CampaignRevisionTimelineActor;
  readonly customerLabel: string;
  readonly adminLabel: string;
  readonly at: string;
  readonly version: number | null;
  readonly decisionId: string | null;
};

export type CampaignRevisionTimelineViewModel = {
  readonly workUnitId: string;
  readonly artifactTypeLabel: string;
  readonly entries: readonly CampaignRevisionTimelineEntry[];
};

export type CampaignComparisonSectionChange =
  | "unchanged"
  | "changed"
  | "added"
  | "removed";

export type CampaignComparisonSection = {
  readonly id: string;
  readonly label: string;
  readonly change: CampaignComparisonSectionChange;
  readonly oldValue: string | null;
  readonly newValue: string | null;
};

export type CampaignComparisonViewModel = {
  readonly workUnitId: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly sections: readonly CampaignComparisonSection[];
  readonly summary: string;
  readonly priorContentAvailable: boolean;
};

export type CampaignRevisionSummaryViewModel = {
  readonly workUnitId: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly headline: string;
  readonly bullets: readonly string[];
};

export type CampaignFeedbackHistoryEntry = {
  readonly version: number;
  readonly decisionType: CampaignReviewDecisionType;
  readonly customerLabel: string;
  readonly feedbackLines: readonly string[];
  readonly decidedAt: string;
  readonly decisionId: string;
};

export type CampaignFeedbackHistoryViewModel = {
  readonly workUnitId: string;
  readonly artifactTypeLabel: string;
  readonly entries: readonly CampaignFeedbackHistoryEntry[];
};

export type CampaignPublishReadinessStatus =
  | "ready"
  | "waiting_for_review"
  | "waiting_for_revisions"
  | "waiting_for_generation";

export type CampaignPublishReadinessViewModel = {
  readonly status: CampaignPublishReadinessStatus;
  readonly customerLabel: string;
  readonly customerSummary: string;
  readonly diagnostics: readonly string[];
};

export type CampaignPublishTargetId =
  | "linkedin"
  | "email"
  | "website"
  | "blog"
  | "facebook"
  | "google_business"
  | "newsletter";

export type CampaignPublishTargetViewModel = {
  readonly id: CampaignPublishTargetId;
  readonly label: string;
  readonly description: string;
  readonly linkedArtifactTypes: readonly CampaignReviewArtifactType[];
  readonly futureDestination: true;
};

export type CampaignPublishTargetsViewModel = {
  readonly targets: readonly CampaignPublishTargetViewModel[];
  readonly customerHeading: string;
};

export type CampaignArtifactCollaborationViewModel = {
  readonly workUnitId: string;
  readonly artifactType: CampaignReviewArtifactType;
  readonly artifactTypeLabel: string;
  readonly title: string;
  readonly currentVersion: number;
  readonly lastUpdatedAt: string | null;
  readonly versionHistory: CampaignVersionHistoryViewModel;
  readonly timeline: CampaignRevisionTimelineViewModel;
  readonly feedbackHistory: CampaignFeedbackHistoryViewModel;
  readonly comparisonToPrevious: CampaignComparisonViewModel | null;
  readonly revisionSummary: CampaignRevisionSummaryViewModel | null;
};

export type CampaignCollaborationBuildInput = {
  readonly peerId: string;
  readonly peerName: string;
  readonly projectId: string;
  readonly project: import("../projects/types").MarketingProject;
  readonly workUnits: readonly import("@/lib/peer-workflow/work-unit").WorkUnit[];
  readonly reviewItems: readonly import("../campaign-review/campaign-review-types").CampaignReviewItem[];
  readonly strategy: import("@/lib/marketing-intelligence").MarketingStrategy | null;
  readonly creativeBriefByCampaignId?: Readonly<Record<string, import("@/lib/creative-brief").CreativeBrief>>;
  readonly linkedinPostByWorkUnitId?: Readonly<
    Record<string, import("@/lib/marketing-intelligence/linkedin-post-generation").MarketingLinkedInPost>
  >;
  readonly emailByWorkUnitId?: Readonly<
    Record<string, import("@/lib/marketing-intelligence/email-generation").MarketingEmailCampaign>
  >;
  readonly campaignReviewDecisionByWorkUnitId?: import("../campaign-review-decisions").CampaignReviewDecisionMap;
  readonly campaignReviewDecisionHistoryByWorkUnitId?: import("../campaign-review-decisions").CampaignReviewDecisionHistoryMap;
  readonly campaignArtifactVersionByWorkUnitId?: import("../campaign-review-decisions").CampaignArtifactVersionMap;
  readonly approvalMode?: import("@/lib/campaign/types/campaign").CampaignApprovalMode;
  readonly continuationRunning?: boolean;
};

export type CampaignCollaborationViewModel = {
  readonly projectId: string;
  readonly publishReadiness: CampaignPublishReadinessViewModel;
  readonly publishTargets: CampaignPublishTargetsViewModel;
  readonly artifacts: readonly CampaignArtifactCollaborationViewModel[];
};
