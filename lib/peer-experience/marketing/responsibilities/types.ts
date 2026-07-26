/** Long-lived ownership — Emma's permanent responsibilities across peers. */

export type MarketingResponsibilityCategory =
  | "instagram"
  | "linkedin"
  | "seo"
  | "google_ads"
  | "meta_ads"
  | "newsletter"
  | "website"
  | "brand_awareness"
  | "lead_generation"
  | "customer_retention"
  | "content_marketing"
  | "competitor_monitoring"
  | "blog";

export const MARKETING_RESPONSIBILITY_CATEGORY_LABELS: Record<
  MarketingResponsibilityCategory,
  string
> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  seo: "SEO",
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  newsletter: "Newsletter",
  website: "Website",
  brand_awareness: "Brand Awareness",
  lead_generation: "Lead Generation",
  customer_retention: "Customer Retention",
  content_marketing: "Content Marketing",
  competitor_monitoring: "Competitor Monitoring",
  blog: "Blog",
};

export type MarketingAutonomyLevel =
  | "manual"
  | "suggest"
  | "semi_autonomous"
  | "autonomous"
  | "full";

export const MARKETING_AUTONOMY_LEVEL_LABELS: Record<MarketingAutonomyLevel, string> = {
  manual: "Manual",
  suggest: "Suggest only",
  semi_autonomous: "Semi-autonomous",
  autonomous: "Autonomous",
  full: "Full autonomy",
};

export type MarketingResponsibilityHealth =
  | "healthy"
  | "needs_attention"
  | "behind_goal"
  | "blocked"
  | "waiting"
  | "learning";

export const MARKETING_RESPONSIBILITY_HEALTH_LABELS: Record<
  MarketingResponsibilityHealth,
  string
> = {
  healthy: "Healthy",
  needs_attention: "Needs Attention",
  behind_goal: "Behind Goal",
  blocked: "Blocked",
  waiting: "Waiting",
  learning: "Learning",
};

export type MarketingResponsibilityApprovalPolicy =
  | "prepare_only"
  | "approval_required"
  | "fully_automatic";

export type MarketingResponsibilityGuardrails = {
  maxPostsPerWeek?: number;
  brandTone?: string;
  maxBudgetChangePercent?: number;
  maxMonthlySpend?: number;
  allowedPublishTimes?: string[];
  approvalRequired?: boolean;
  allowedHashtags?: string[];
  imageGenerationPolicy?: "always" | "when_needed" | "never";
  competitorMonitoringFrequency?: "daily" | "weekly" | "monthly";
  riskTolerance?: "low" | "medium" | "high";
};

export type MarketingResponsibilityCadence = {
  type: "daily" | "weekly" | "monthly" | "event_based" | "adaptive" | "custom";
  postsPerWeek?: number;
  evaluationIntervalDays?: number;
  label?: string;
};

/** Persisted responsibility entity. */
export type MarketingResponsibility = {
  id: string;
  peerId: string;
  organizationId?: string;
  title: string;
  description: string;
  category: MarketingResponsibilityCategory;
  goal: string;
  successMetric?: string;
  cadence: MarketingResponsibilityCadence;
  autonomyLevel: MarketingAutonomyLevel;
  approvalPolicy: MarketingResponsibilityApprovalPolicy;
  priority: number;
  status: "enabled" | "disabled";
  enabled: boolean;
  guardrails: MarketingResponsibilityGuardrails;
  lastEvaluation?: string | null;
  nextEvaluation?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketingProjectOrigin =
  | "manual_assignment"
  | "responsibility"
  | "brain_insight"
  | "recurring_schedule"
  | "recommendation"
  | "campaign_wizard";

export const MARKETING_PROJECT_ORIGIN_LABELS: Record<MarketingProjectOrigin, string> = {
  manual_assignment: "Manual Assignment",
  responsibility: "Responsibility",
  brain_insight: "Brain Insight",
  recurring_schedule: "Recurring Schedule",
  recommendation: "Recommendation",
  campaign_wizard: "Campaign",
};

export type ResponsibilityEvaluationAction =
  | "no_action"
  | "create_project"
  | "ask_user"
  | "recommend_strategy";

export type ResponsibilityEvaluationResult = {
  responsibilityId: string;
  evaluatedAt: string;
  action: ResponsibilityEvaluationAction;
  reason: string;
  health: MarketingResponsibilityHealth;
  healthReason?: string;
  planningMessage?: string;
  proposedProject?: {
    title: string;
    goal: string;
    channel: string;
    deliverableKind: string;
    rawRequest: string;
  };
};

export type ResponsibilityPlanningItem = {
  responsibilityId: string;
  responsibilityTitle: string;
  message: string;
  action: ResponsibilityEvaluationAction;
  canAutoExecute: boolean;
  approveLabel: string;
  href: string;
};
