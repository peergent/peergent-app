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
};

export type MarketingProjectTimelineEntry = {
  id: string;
  at: string;
  timeLabel: string;
  label: string;
  kind: "milestone" | "work" | "review" | "publish" | "performance";
};
