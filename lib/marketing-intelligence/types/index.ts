export type {
  BrandPositioning,
  CreateMarketingContentInput,
  CreateMarketingGoalInput,
  MarketingContentItem,
  MarketingContentType,
  MarketingGoal,
  MarketingGoalStatus,
  MarketingProfile,
  MarketingProfileAggregate,
  UpdateMarketingContentInput,
  UpdateMarketingGoalInput,
  UpdateMarketingProfileInput,
} from "./entities";

export type {
  MarketingBrandUnderstanding,
  MarketingCompetitorSummary,
  MarketingContentSummary,
  MarketingGoalSummary,
  MarketingProductSummary,
  MarketingSegmentSummary,
  MarketingServiceSummary,
  MarketingUnderstanding,
  MarketingUnderstandingDimension,
} from "./understanding";

export type {
  CampaignIdea,
  ContentPillar,
  CustomerJourneyRecommendation,
  LeadGenerationOpportunity,
  MarketingPriority,
  MarketingStrategy,
  MarketingStrategyConfidence,
  ParsedMarketingStrategyResult,
  PositioningRecommendation,
  SeoOpportunity,
  SocialMediaStrategy,
  StrategyEvidenceSource,
  StrategyRationale,
  TargetAudienceRecommendation,
} from "./strategy";

export type {
  ContentCalendarEntry,
  EffortLevel,
  ExpectedOutcome,
  ImpactLevel,
  MarketingPlan,
  ParsedMarketingPlanResult,
  PlanDependency,
  PlanObjective,
  PlanPriority,
  PlannedActivityBase,
  PlannedCampaign,
  PlanRationale,
  StrategyLink,
  StrategyLinkType,
  SuccessMetric,
  TimelinePhase,
} from "./plan";

export type {
  ContentDraftRationale,
  ContentDraftStatus,
  ContentDraftValidationContext,
  ContentSourceReference,
  MarketingContentDraft,
  MarketingDraftContentType,
  ParsedMarketingContentDraftResult,
} from "./content-draft";

export { SUPPORTED_DRAFT_CONTENT_TYPES } from "./content-draft";
