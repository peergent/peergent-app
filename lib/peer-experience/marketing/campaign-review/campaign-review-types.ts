import type { CampaignApprovalMode, CampaignStatus } from "@/lib/campaign/types/campaign";
import type { MarketingCampaignDetailViewModel } from "../view-models/marketing-campaign-types";
import type { MarketingProject } from "../projects/types";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

export type CampaignReviewArtifactType =
  | "campaign_strategy"
  | "creative_direction"
  | "linkedin_post"
  | "email_campaign";

export type CampaignReviewItemStatus =
  | "awaiting_review"
  | "prepared"
  | "in_progress"
  | "upcoming"
  | "blocked";

export type CampaignStrategyReviewPreview = {
  readonly kind: "campaign_strategy";
  readonly strategyTitle: string;
  readonly summary: string;
  readonly positioning: string;
  readonly messagingPillars: readonly string[];
  readonly recommendedChannels: readonly string[];
  readonly ctaGuidance: string;
};

export type CreativeDirectionReviewPreview = {
  readonly kind: "creative_direction";
  readonly campaignConcept: string;
  readonly campaignAngle: string;
  readonly tone: string;
  readonly messagingHierarchy: readonly string[];
  readonly visualDirection: string;
  readonly ctaDirection: string;
  readonly brandConstraints: readonly string[];
  readonly creativeRecommendations: readonly string[];
};

export type LinkedInReviewPreview = {
  readonly kind: "linkedin_post";
  readonly hook: string;
  readonly mainContent: string;
  readonly cta: string;
  readonly hashtags: readonly string[];
  readonly suggestedImageDescription: string;
  readonly publishingRecommendation: string;
};

export type EmailReviewPreview = {
  readonly kind: "email_campaign";
  readonly subject: string;
  readonly previewText: string;
  readonly body: string;
  readonly cta: string;
  readonly secondaryCta?: string;
  readonly suggestedSendTiming?: string;
  readonly audienceNote?: string;
};

export type CampaignReviewItemPreview =
  | CampaignStrategyReviewPreview
  | CreativeDirectionReviewPreview
  | LinkedInReviewPreview
  | EmailReviewPreview;

export type CampaignReviewItem = {
  readonly id: string;
  readonly workUnitId: string;
  readonly artifactType: CampaignReviewArtifactType;
  readonly artifactTypeLabel: string;
  readonly title: string;
  readonly shortSummary: string;
  readonly status: CampaignReviewItemStatus;
  readonly statusLabel: string;
  readonly preparedByLabel: string;
  readonly preview: CampaignReviewItemPreview | null;
  readonly reviewRequired: boolean;
  readonly blockingNextWork: boolean;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
};

export type CampaignReviewProgressPhase = {
  readonly id: string;
  readonly label: string;
  readonly complete: boolean;
  readonly current: boolean;
};

export type CampaignReviewViewModel = {
  readonly campaignId: string;
  readonly campaignTitle: string;
  readonly campaignStatus: CampaignStatus;
  readonly campaignStatusLabel: string;
  readonly customerSummary: string;
  readonly currentFocus: string;
  readonly progress: {
    readonly preparedCount: number;
    readonly totalCount: number;
    readonly percent: number;
    readonly phases: readonly CampaignReviewProgressPhase[];
  };
  readonly needsAttention: boolean;
  readonly attentionMessage: string | null;
  readonly primaryActionLabel: string | null;
  readonly primaryActionHref: string | null;
  readonly preparedItems: readonly CampaignReviewItem[];
  readonly upcomingItems: readonly CampaignReviewItem[];
  readonly completedItems: readonly CampaignReviewItem[];
  readonly reviewQueue: readonly CampaignReviewItem[];
  readonly activitySummary: {
    readonly currentFocus: string;
    readonly recentlyCompleted: string | null;
    readonly upNext: string | null;
  };
  readonly hasTechnicalDetails: boolean;
  readonly lastUpdated: string | null;
  readonly allReviewItems: readonly CampaignReviewItem[];
};

export type CampaignReviewBuildInput = {
  readonly peerId: string;
  readonly peerName: string;
  readonly projectId: string;
  readonly project: MarketingProject;
  readonly campaignDetail: MarketingCampaignDetailViewModel;
  readonly workUnits: readonly WorkUnit[];
  readonly strategy: MarketingStrategy | null;
  readonly creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  readonly linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  readonly emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
  readonly approvalMode?: CampaignApprovalMode;
  readonly campaignsEnabled: boolean;
  readonly onboardingComplete: boolean;
  readonly hasExecutionWork: boolean;
  readonly continuationRunning?: boolean;
  readonly activeWorkUnitId?: string | null;
};
