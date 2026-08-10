import type { StrategyRunState } from "@/lib/office/campaign/strategy-run-types";
import type {
  CampaignPublicationState,
  CampaignRunState,
} from "../campaign-execution/campaign-run-types";

/** Customer-facing assignment — Emma's private WorkUnits execute underneath. */

export type MarketingProjectStatus =
  | "planning"
  | "preparing"
  | "waiting_for_review"
  | "scheduled"
  | "publishing"
  | "monitoring_results"
  | "completed"
  | "archived";

export const MARKETING_PROJECT_STATUS_LABELS: Record<MarketingProjectStatus, string> = {
  planning: "Planning",
  preparing: "Preparing",
  waiting_for_review: "Waiting for Review",
  scheduled: "Scheduled",
  publishing: "Publishing",
  monitoring_results: "Monitoring Results",
  completed: "Completed",
  archived: "Archived",
};

export type MarketingCampaignType =
  | "instagram_campaign"
  | "linkedin_campaign"
  | "newsletter"
  | "seo_audit"
  | "google_ads"
  | "meta_campaign"
  | "product_launch"
  | "brand_awareness"
  | "content_series"
  | "website_refresh"
  | "custom";

export const MARKETING_CAMPAIGN_TYPE_LABELS: Record<MarketingCampaignType, string> = {
  instagram_campaign: "Instagram Campaign",
  linkedin_campaign: "LinkedIn Campaign",
  newsletter: "Newsletter",
  seo_audit: "SEO Audit",
  google_ads: "Google Ads Optimisation",
  meta_campaign: "Meta Campaign",
  product_launch: "Product Launch",
  brand_awareness: "Brand Awareness Campaign",
  content_series: "Content Series",
  website_refresh: "Website Refresh",
  custom: "Custom Project",
};

import type { MarketingProjectOrigin } from "../responsibilities/types";
import type { CampaignApprovalMode } from "@/lib/campaign";

/** Optional wizard fields persisted on the project (session workspace storage). */
export type CampaignSetupChannel =
  | "linkedin"
  | "instagram"
  | "email"
  | "blog"
  | "website_landing"
  | "meta_ads"
  | "google_ads"
  | "other"
  | "decide_later";

export type CampaignSetupDeliverable =
  | "social_post"
  | "carousel"
  | "advertisement"
  | "email"
  | "blog_article"
  | "landing_page"
  | "campaign_concept"
  | "other"
  | "decide_later";

import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";

/** Session-persisted Brain capability outputs for live campaign workflow reuse. */
export type CampaignBrainOutputs = {
  readonly contextVersion: number;
} & Partial<Record<Extract<BrainCapabilityId, "strategy" | "channel_planning" | "campaign_planning" | "creative_generation" | "validation">, BrainStructuredOutput>>;

export type MarketingProjectCampaignSetup = {
  readonly description: string;
  readonly primaryGoalId: string;
  readonly customGoalText?: string;
  /** Wizard audience; superseded by `confirmedAudience` after onboarding when set. */
  readonly targetAudience?: string;
  /** Canonical audience after conversational onboarding (`confirmedAudience` wins). */
  readonly confirmedAudience?: string;
  readonly selectedChannels?: readonly CampaignSetupChannel[];
  readonly customChannelLabels?: readonly string[];
  readonly selectedDeliverables?: readonly CampaignSetupDeliverable[];
  readonly customDeliverableLabels?: readonly string[];
  readonly timingDecision?: "dated" | "no_deadline";
  readonly onboardingCompletedAt?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly durationPreset?: import("@/lib/office/campaign/campaign-duration").CampaignDurationPreset;
  readonly budgetAmount?: number;
  readonly budgetCurrency?: string;
  readonly approvalMode?: CampaignApprovalMode;
  /** How the customer started the campaign wizard. */
  readonly setupMode?: "automatic" | "manual";
  readonly secondaryGoalIds?: readonly string[];
  readonly priority?: "low" | "medium" | "high";
  /** Live Office — customer-supplied website URL (no crawl implied). */
  readonly websiteUrl?: string;
  /** Live Office — customer explicitly skipped website context. */
  readonly websiteSkipped?: boolean;
  readonly websiteDecisionAt?: string;
  readonly websiteDecisionSource?: "customer_supplied" | "customer_skipped";
  /** Live Office — customer-supplied competitors (no market scan implied). */
  readonly campaignCompetitors?: readonly { name: string; url?: string }[];
  /** Live Office — customer explicitly skipped competitor analysis. */
  readonly competitorsSkipped?: boolean;
  readonly competitorsDecisionAt?: string;
  readonly competitorsDecisionSource?: "customer_supplied" | "customer_skipped";
  /** Live Office — brand/client being marketed (may differ from account org). */
  readonly campaignBrandName?: string;
  /** Live Office — customer-supplied brand/company context for this campaign. */
  readonly campaignBrandContext?: {
    readonly brandName?: string;
    readonly industry?: string;
    readonly mission?: string;
    readonly uniqueSellingPoints?: readonly string[];
    readonly productsAndServices?: readonly string[];
    readonly positioning?: string;
    readonly tone?: string;
    readonly targetAudience?: string;
  };
  readonly campaignBrandContextAt?: string;
  readonly campaignBrandContextSource?: "customer_supplied";
  /** Live Office — business analysis step completed after successful output. */
  readonly businessAnalyzedApproved?: boolean;
  readonly businessAnalyzedAt?: string;
  /** Live Office — monotonic context version for invalidation. */
  readonly campaignContextVersion?: number;
  /** Live Office — customer review gates (strategy, channels, deliverables). */
  readonly stepApprovals?: Partial<
    Record<
      import("@/lib/office/campaign/workflow-types").CampaignWorkflowStepId,
      import("@/lib/office/demo/demo-workflow-simulation").DemoStepApprovalStatus
    >
  >;
  /** Live Office — strategy capability produced output at this time. */
  readonly strategyGeneratedAt?: string;
  /** Live Office — persisted strategy execution lifecycle. */
  readonly strategyRun?: StrategyRunState;
  /**
   * Live Office — customer-safe structured Brain outputs keyed by capability.
   * Bridged via session workspace storage until durable server persistence exists.
   */
  readonly campaignBrainOutputs?: CampaignBrainOutputs;
  /** Live Office — internal scheduling decision (no external publish implied). */
  readonly campaignSchedule?: LiveCampaignSchedule;
  /** Sprint 9.5 — durable campaign execution run identity. */
  readonly campaignRun?: CampaignRunState;
  /** Sprint 9.5 — explicit publication lifecycle (no boolean flags). */
  readonly campaignPublication?: CampaignPublicationState;
};

/** Live campaign internal schedule — session-persisted until server storage exists. */
export type LiveCampaignSchedule = {
  readonly scheduledAt: string;
  readonly scheduledDate: string;
  readonly scheduledTime: string;
  readonly timezone: string;
  readonly scheduledDecisionAt: string;
  readonly source: "customer_scheduled";
  readonly contextVersion: number;
  readonly channels?: readonly string[];
  readonly deliverableIds?: readonly string[];
};

export type MarketingProject = {
  id: string;
  peerId: string;
  title: string;
  goal: string;
  campaignType: MarketingCampaignType;
  createdAt: string;
  updatedAt: string;
  ownerLabel: string;
  rawRequest: string;
  archivedAt?: string | null;
  responsibilityId?: string | null;
  origin?: MarketingProjectOrigin;
  campaignSetup?: MarketingProjectCampaignSetup;
};

export type MarketingProjectTimelineEntry = {
  id: string;
  at: string;
  timeLabel: string;
  label: string;
  kind: "milestone" | "work" | "review" | "publish" | "performance";
};
