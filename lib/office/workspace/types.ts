export type MarketingWorkspaceOverviewPart = {
  text: string;
  attention?: boolean;
};

export type MarketingWorkspaceOverviewBand = {
  parts: readonly MarketingWorkspaceOverviewPart[];
};

export type MarketingWorkspaceKpiItem = {
  id: string;
  label: string;
  value: string;
  methodology?: string | null;
  href?: string | null;
  hero?: boolean;
  accent?: string;
};

export type MarketingWorkspaceKpisBand = {
  items: MarketingWorkspaceKpiItem[];
};

export type MarketingChartMetricId =
  | "revenue"
  | "leads"
  | "traffic"
  | "roas"
  | "ctr"
  | "cpc"
  | "spend";

export type MarketingWorkspaceBiBulletTone =
  | "positive"
  | "attention"
  | "insight"
  | "neutral"
  | "recommendation";

export type MarketingWorkspaceBiBullet = {
  id: string;
  text: string;
  tone: MarketingWorkspaceBiBulletTone;
};

export type MarketingChartMetricOption = {
  id: MarketingChartMetricId;
  label: string;
  heroValue: string;
  delta: string | null;
  deltaPositive: boolean;
  chartLabel: string;
  points: readonly { at: string; value: number }[];
  insight: string | null;
  bullets: readonly MarketingWorkspaceBiBullet[];
  valueFormat: "currency" | "number" | "percent" | "multiplier";
};

export type MarketingWorkspacePerformanceBand = {
  periodLabel: string;
  title: string;
  metrics: MarketingChartMetricOption[];
  defaultMetricId: MarketingChartMetricId;
};

export type MarketingWorkspaceBusinessIntelligenceBand = {
  eyebrow: string;
  title: string;
  href: string | null;
};

export type MarketingCampaignStatus = "live" | "optimizing" | "waiting" | "scheduled";

export type MarketingCampaignThumbnailKind =
  | "linkedin"
  | "google_ads"
  | "multi"
  | "email"
  | "display";

export type MarketingWorkspaceCampaignCard = {
  id: string;
  name: string;
  status: MarketingCampaignStatus;
  channelLabel: string;
  channelsSubtitle: string | null;
  thumbnailKind: MarketingCampaignThumbnailKind;
  previewHeadline: string | null;
  previewBody: string | null;
  previewMeta: string | null;
  budgetLabel: string | null;
  revenueLabel: string | null;
  roasLabel: string | null;
  leadsLabel: string | null;
  progressPercent: number | null;
  progressCaption: string | null;
  milestoneLabel: string;
  milestoneAttention: boolean;
  href: string;
};

export type MarketingWorkspaceCampaignsBand = {
  title: string;
  items: MarketingWorkspaceCampaignCard[];
  viewAllHref: string;
  emptyMessage: string | null;
  emptyLinkLabel: string | null;
  emptyLinkHref: string | null;
};

export type MarketingWorkspaceContentPreviewKind =
  | "linkedin"
  | "instagram"
  | "email"
  | "ads"
  | "blog"
  | "display";

export type MarketingWorkspaceContentPreview = {
  id: string;
  kind: MarketingWorkspaceContentPreviewKind;
  channelLabel: string;
  title: string;
  preview: string;
  statusLabel: string;
  statusTone: "live" | "draft" | "scheduled" | "review";
  performanceWhisper: string | null;
  href: string | null;
};

export type MarketingWorkspaceContentBand = {
  title: string;
  items: MarketingWorkspaceContentPreview[];
  viewAllHref: string;
};

export type MarketingWorkspaceApprovalItem = {
  id: string;
  title: string;
  unblocks: string;
  primaryLabel: string;
  href: string;
  ageLabel: string | null;
};

export type MarketingWorkspaceApprovalsBand = {
  items: MarketingWorkspaceApprovalItem[];
  totalCount: number;
  overflowLabel: string | null;
  overflowHref: string;
};

export type MarketingWorkspaceRecommendationBand = {
  headline: string;
  impact: string | null;
  primaryLabel: string;
  href: string;
  impactMetrics?: readonly { id: string; label: string }[];
};

export type MarketingWorkspaceActivityTone =
  | "success"
  | "insight"
  | "attention"
  | "neutral";

export type MarketingWorkspaceActivityItem = {
  id: string;
  timestamp: string;
  timeLabel: string;
  title: string;
  subtitle: string;
  tone: MarketingWorkspaceActivityTone;
  href: string | null;
};

export type MarketingWorkspaceActivityBand = {
  title: string;
  items: MarketingWorkspaceActivityItem[];
  emptyMessage: string | null;
};

export type MarketingWorkspaceBands = {
  overview: MarketingWorkspaceOverviewBand;
  kpis: MarketingWorkspaceKpisBand;
  performance: MarketingWorkspacePerformanceBand | null;
  businessIntelligence: MarketingWorkspaceBusinessIntelligenceBand | null;
  campaigns: MarketingWorkspaceCampaignsBand | null;
  content: MarketingWorkspaceContentBand | null;
  approvals: MarketingWorkspaceApprovalsBand | null;
  recommendation: MarketingWorkspaceRecommendationBand | null;
  activity: MarketingWorkspaceActivityBand | null;
};
