import type { MarketingStrategyConfidence } from "./strategy";
import type { MarketingDraftContentType } from "./content-draft";

/** References a specific item from the Marketing Strategy that drives a plan activity. */
export type StrategyLinkType =
  | "targetAudience"
  | "positioning"
  | "contentPillar"
  | "campaignIdea"
  | "seoOpportunity"
  | "socialMedia"
  | "customerJourney"
  | "leadGeneration"
  | "marketingPriority";

export type StrategyLink = {
  type: StrategyLinkType;
  reference: string;
};

export type PlanRationale = {
  why: string;
};

export type EffortLevel = "low" | "medium" | "high";
export type ImpactLevel = "low" | "medium" | "high";

/** Base fields required on every planned activity. */
export type PlannedActivityBase = {
  title: string;
  rationale: PlanRationale;
  linkedStrategyItems: StrategyLink[];
  estimatedEffort: EffortLevel;
  expectedImpact: ImpactLevel;
};

export type PlanObjective = PlannedActivityBase & {
  description?: string;
  successCriteria?: string;
};

export type PlanPriority = PlannedActivityBase & {
  rank: number;
};

export type TimelinePhase = PlannedActivityBase & {
  phase: string;
  startWeek: number;
  endWeek: number;
  activities: string[];
};

export type PlannedCampaign = PlannedActivityBase & {
  channels: string[];
  startWeek: number;
  endWeek: number;
  milestones: string[];
};

export type ContentCalendarEntry = PlannedActivityBase & {
  contentType: MarketingDraftContentType;
  channel?: string;
  scheduledWeek: number;
  pillar?: string;
};

export type PlanDependency = {
  dependent: string;
  dependsOn: string;
  rationale: PlanRationale;
};

export type ExpectedOutcome = PlannedActivityBase & {
  outcome: string;
  timeframe?: string;
};

export type SuccessMetric = {
  metric: string;
  target: string;
  rationale: PlanRationale;
  linkedStrategyItems: StrategyLink[];
};

/**
 * Actionable execution plan derived from a Marketing Strategy.
 * Future capabilities (Content Creation, Publishing, Performance Review)
 * should consume this object rather than MarketingStrategy directly.
 */
export type MarketingPlan = {
  summary: string;
  confidence: MarketingStrategyConfidence;
  confidenceReason: string;
  basedOnStrategySummary: string;
  objectives: PlanObjective[];
  priorities: PlanPriority[];
  timeline: TimelinePhase[];
  campaigns: PlannedCampaign[];
  contentCalendar: ContentCalendarEntry[];
  dependencies: PlanDependency[];
  expectedOutcomes: ExpectedOutcome[];
  successMetrics: SuccessMetric[];
  knowledgeGaps: string[];
  generatedAt: string;
};

export type ParsedMarketingPlanResult =
  | { success: true; plan: MarketingPlan; warnings: string[] }
  | { success: false; error: string; warnings: string[] };
