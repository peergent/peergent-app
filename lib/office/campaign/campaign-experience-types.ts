import type { MarketingChartMetricId } from "@/lib/office/workspace/types";

export type CampaignExperienceHeader = {
  title: string;
  statusLabel: string;
  isLive: boolean;
  channelLabel: string;
  objective: string;
  ownerLabel: string;
  createdLabel: string;
  updatedLabel: string;
};

export type CampaignExperienceBrief = {
  narrative: string;
  sections: {
    executiveSummary: string;
    researchFindings: string;
    audienceInsight: string;
    strategicDecision: string;
    creativeDirection: string;
    expectedBusinessImpact: string;
    nextRecommendation: string;
  };
};

export type CampaignExperienceChartMetric = {
  id: MarketingChartMetricId | "conversions";
  label: string;
  heroValue: string;
  delta: string | null;
  deltaPositive: boolean;
  chartLabel: string;
  points: readonly { at: string; value: number }[];
  insight: string | null;
  valueFormat: "currency" | "number" | "percent" | "multiplier";
};

export type CampaignExperiencePerformance = {
  periodLabel: string;
  title: string;
  metrics: CampaignExperienceChartMetric[];
  defaultMetricId: CampaignExperienceChartMetric["id"];
};

export type CampaignCreativeAssetKind =
  | "linkedin"
  | "ads"
  | "email"
  | "blog"
  | "landing"
  | "display";

export type CampaignCreativeAsset = {
  id: string;
  kind: CampaignCreativeAssetKind;
  channelLabel: string;
  title: string;
  preview: string;
  statusLabel: string;
  statusTone: "live" | "draft" | "scheduled" | "review";
  href: string | null;
};

export type CampaignProgressStepState = "done" | "waiting" | "upcoming";

export type CampaignProgressStepExpansion = {
  whatHappened: string;
  whyItHappened: string;
  businessImpact: string;
  decisionTaken: string | null;
};

export type CampaignProgressStep = {
  id: string;
  label: string;
  state: CampaignProgressStepState;
  expansion: CampaignProgressStepExpansion | null;
};

export type CampaignExperienceProgress = {
  percent: number;
  statusHeadline: string;
  steps: readonly CampaignProgressStep[];
};

export type CampaignBrainTimelineStep = {
  id: string;
  label: string;
  state: "done" | "active" | "upcoming" | "skipped";
  detail: string | null;
};

export type CampaignExperienceRecommendation = {
  headline: string;
  impact: string | null;
  primaryLabel: string;
  href: string | null;
  impactMetrics?: readonly { id: string; label: string }[];
};

export type CampaignExperienceActivityItem = {
  id: string;
  timestamp: string;
  timeLabel: string;
  message: string;
  href: string | null;
};

export type CampaignExperienceModel = {
  peerId: string;
  projectId: string;
  header: CampaignExperienceHeader;
  brief: CampaignExperienceBrief;
  performance: CampaignExperiencePerformance | null;
  assets: readonly CampaignCreativeAsset[];
  progress: CampaignExperienceProgress;
  brainTimeline: readonly CampaignBrainTimelineStep[];
  recommendation: CampaignExperienceRecommendation | null;
  activity: readonly CampaignExperienceActivityItem[];
  backHref: string;
};
