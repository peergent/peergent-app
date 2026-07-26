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
  readonly budgetAmount?: number;
  readonly budgetCurrency?: string;
  readonly approvalMode?: CampaignApprovalMode;
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
