export type MarketingWorkspaceOverviewBand = {
  summary: string;
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
  | "cpc";

export type MarketingChartMetricOption = {
  id: MarketingChartMetricId;
  label: string;
  heroValue: string;
  delta: string | null;
  deltaPositive: boolean;
  chartLabel: string;
  points: readonly { at: string; value: number }[];
  insight: string | null;
  valueFormat: "currency" | "number" | "percent" | "multiplier";
};

export type MarketingWorkspacePerformanceBand = {
  periodLabel: string;
  metrics: MarketingChartMetricOption[];
  defaultMetricId: MarketingChartMetricId;
};

export type MarketingWorkspaceInsightItem = {
  id: string;
  text: string;
  tone: "positive" | "negative" | "neutral" | "opportunity";
};

export type MarketingWorkspaceInsightsBand = {
  title: string;
  items: MarketingWorkspaceInsightItem[];
};

export type MarketingWorkspaceCampaignCard = {
  id: string;
  name: string;
  statusLabel: string;
  progressLabel: string | null;
  channelLabel: string | null;
  budgetLabel: string | null;
  impactLabel: string | null;
  needsApproval: boolean;
  isLive: boolean;
  href: string;
};

export type MarketingWorkspaceCampaignsBand = {
  title: string;
  items: MarketingWorkspaceCampaignCard[];
  viewAllHref: string;
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

export type MarketingWorkspaceActivityItem = {
  id: string;
  timestamp: string;
  timeLabel: string;
  message: string;
  href: string | null;
};

export type MarketingWorkspaceActivityBand = {
  title: string;
  items: MarketingWorkspaceActivityItem[];
};

export type MarketingWorkspaceResultItem = {
  id: string;
  label: string;
  impactLabel: string | null;
  href: string | null;
};

export type MarketingWorkspaceResultsBand = {
  title: string;
  items: MarketingWorkspaceResultItem[];
};

export type MarketingWorkspaceBands = {
  overview: MarketingWorkspaceOverviewBand;
  kpis: MarketingWorkspaceKpisBand;
  performance: MarketingWorkspacePerformanceBand | null;
  insights: MarketingWorkspaceInsightsBand | null;
  campaigns: MarketingWorkspaceCampaignsBand | null;
  content: MarketingWorkspaceContentBand | null;
  approvals: MarketingWorkspaceApprovalsBand | null;
  recommendation: MarketingWorkspaceRecommendationBand | null;
  activity: MarketingWorkspaceActivityBand | null;
  results: MarketingWorkspaceResultsBand | null;
};
