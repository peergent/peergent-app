/** Marketing Peer Operating System — shared domain types. */

export type MarketingResultMetricSource =
  | "google_analytics"
  | "meta"
  | "linkedin"
  | "instagram"
  | "crm"
  | "peer_engine"
  | "manual"
  | "unavailable";

export type MarketingResultMetricStatus = "live" | "estimated" | "setup_required";

export type MarketingResultMetric = {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  comparison?: {
    value: number;
    direction: "up" | "down" | "neutral";
    periodLabel: string;
  };
  source: MarketingResultMetricSource;
  sourceLabel?: string;
  status: MarketingResultMetricStatus;
  trend?: Array<{ timestamp: string; value: number }>;
  setupMessage?: string;
  setupCta?: {
    label: string;
    href: string;
  };
  performanceHref?: string;
  estimatedNote?: string;
};

export type MarketingBrainInsightCategory =
  | "opportunity"
  | "risk"
  | "pattern"
  | "optimization"
  | "forecast"
  | "competitor"
  | "seo"
  | "content"
  | "ads"
  | "email";

export type MarketingBrainInsightActionType =
  | "view_evidence"
  | "apply"
  | "review"
  | "create_work"
  | "open_performance"
  | "open_automation"
  | "dismiss";

export type MarketingBrainInsight = {
  id: string;
  category: MarketingBrainInsightCategory;
  title: string;
  observation: string;
  businessImpact?: string;
  evidence?: {
    source: string;
    period?: string;
    currentValue?: string | number;
    comparisonValue?: string | number;
    changePercent?: number;
    sampleSize?: number;
  };
  recommendation?: {
    summary: string;
    expectedOutcome?: string;
  };
  actionTaken?: {
    summary: string;
    automatic: boolean;
    occurredAt?: string;
    reversible?: boolean;
  };
  confidence: "low" | "medium" | "high";
  status: "new" | "monitoring" | "action_taken" | "needs_approval" | "dismissed";
  priority: number;
  actions: Array<{
    id: string;
    label: string;
    type: MarketingBrainInsightActionType;
    href?: string;
  }>;
};

/** @deprecated Use category on MarketingBrainInsight */
export type MarketingBrainInsightType = MarketingBrainInsightCategory;

export type MarketingApprovalQueueItem = {
  id: string;
  draftId: string;
  deliverableId: string;
  channel: string;
  title: string;
  thumbnailUrl?: string;
  attentionReason: string;
  dueLabel?: string;
  status: string;
  reviewHref: string;
  projectId?: string;
  projectTitle?: string;
  projectHref?: string;
};

export type MarketingResponsibilityType =
  | "instagram"
  | "linkedin"
  | "facebook"
  | "seo"
  | "newsletter"
  | "blog"
  | "google_ads"
  | "meta_ads"
  | "analytics"
  | "competitor_monitoring";

export type UpcomingMarketingTask = {
  id: string;
  title: string;
  responsibility: MarketingResponsibilityType;
  channelLabel: string;
  plannedAt: string;
  timeLabel: string;
  origin: "automation" | "goal" | "manual" | "recommendation";
  originLabel: string;
  approvalPolicy: "prepare_only" | "approval_required" | "fully_automatic";
  approvalPolicyLabel: string;
  status: "planned" | "queued" | "running" | "blocked";
  statusLabel: string;
  blockerReason?: string;
  workUnitId?: string;
  projectId?: string;
  automationId?: string;
  href: string;
};

export type MarketingActivityTargetKind =
  | "content"
  | "project"
  | "work"
  | "review"
  | "performance"
  | "automation";

export type MarketingActivity = {
  id: string;
  type:
    | "published"
    | "scheduled"
    | "generated"
    | "optimized"
    | "completed"
    | "approved"
    | "sent"
    | "measured";
  typeLabel: string;
  title: string;
  summary?: string;
  occurredAt: string;
  timeLabel: string;
  channel?: string;
  actionLabel: string;
  target: {
    kind: MarketingActivityTargetKind;
    id?: string;
    href: string;
  };
};

export type MarketingResponsibilityAutonomy =
  | "prepare_only"
  | "approval_required"
  | "fully_automatic";

export type MarketingResponsibilityStatus =
  | "active"
  | "paused"
  | "needs_setup"
  | "blocked";

export type MarketingResponsibility = {
  id: string;
  type: MarketingResponsibilityType;
  label: string;
  enabled: boolean;
  objective?: string;
  cadence?: {
    type: "daily" | "weekly" | "monthly" | "event_based" | "adaptive" | "custom";
    config?: unknown;
  };
  autonomy: MarketingResponsibilityAutonomy;
  limits?: {
    maxPostsPerWeek?: number;
    maxBudgetChangePercent?: number;
    maxMonthlySpend?: number;
    allowedChannels?: string[];
  };
  status: MarketingResponsibilityStatus;
  lastRunAt?: string;
  nextRunAt?: string;
};

export type MarketingContentStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "scheduled"
  | "published";

export type MarketingContentPerformanceMetric = {
  id: string;
  label: string;
  value: string;
  status: "live" | "unavailable";
};

export type MarketingContentItem = {
  id: string;
  draftId: string;
  title: string;
  channel: string;
  contentType: string;
  status: MarketingContentStatus;
  publishedAt?: string;
  scheduledAt?: string;
  campaign?: string;
  projectId?: string;
  projectTitle?: string;
  projectHref?: string;
  thumbnailUrl?: string;
  performanceSummary?: string;
  href: string;
  performanceHref: string;
};

export type MarketingWorkFilter = "active" | "upcoming" | "waiting" | "completed";

/** @deprecated Prefer MarketingProjectItem — work units are internal execution only. */
export type MarketingWorkItem = {
  id: string;
  workUnitId: string;
  title: string;
  responsibility: string;
  statusLabel: string;
  progress: number;
  startedAt: string;
  etaLabel?: string;
  approvalPolicy: MarketingResponsibilityAutonomy;
  blocker?: string;
  relatedContentId?: string;
  automationSource?: string;
  href: string;
  reviewHref?: string;
};

export type MarketingProjectFilter = MarketingWorkFilter;

export type MarketingProjectItem = {
  id: string;
  title: string;
  goal: string;
  statusLabel: string;
  progress: number;
  startedAt: string;
  updatedAt: string;
  startedLabel: string;
  nextStep?: string;
  campaignTypeLabel: string;
  approvalStatus?: string;
  href: string;
  reviewHref?: string;
};

export type MarketingReviewFilter =
  | "needs_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published";

export type MarketingReviewQueueItem = {
  id: string;
  draftId: string;
  title: string;
  channel: string;
  status: MarketingReviewFilter;
  scheduledAt?: string;
  thumbnailUrl?: string;
};

export type MarketingPerformanceFilters = {
  contentId?: string;
  campaignId?: string;
  channel?: string;
  period?: string;
  view?: string;
};

export type MarketingMorningBriefLine = {
  id: string;
  text: string;
  kind: "completed" | "priority" | "approval" | "insight" | "upcoming";
};

export type MarketingMorningBriefViewModel = {
  greeting: string;
  userName: string;
  intro: string;
  highlights: MarketingMorningBriefLine[];
};
