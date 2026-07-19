/** Evidence sources that can justify a strategy recommendation. */
export type StrategyEvidenceSource =
  | "company-dna"
  | "business-brain"
  | "marketing-understanding";

/** Explains why a recommendation was made based on verified context. */
export type StrategyRationale = {
  why: string;
  basedOn: StrategyEvidenceSource[];
};

export type TargetAudienceRecommendation = {
  segment: string;
  priority: "primary" | "secondary" | "tertiary";
  rationale: StrategyRationale;
};

export type PositioningRecommendation = {
  recommendation: string;
  rationale: StrategyRationale;
};

export type ContentPillar = {
  name: string;
  themes: string[];
  rationale: StrategyRationale;
};

export type CampaignIdea = {
  name: string;
  objective: string;
  channels: string[];
  rationale: StrategyRationale;
};

export type SeoOpportunity = {
  topic: string;
  intent: string;
  rationale: StrategyRationale;
};

export type SocialMediaStrategy = {
  platform: string;
  approach: string;
  contentFocus: string[];
  rationale: StrategyRationale;
};

export type CustomerJourneyRecommendation = {
  stage: string;
  recommendation: string;
  rationale: StrategyRationale;
};

export type LeadGenerationOpportunity = {
  opportunity: string;
  tactic: string;
  rationale: StrategyRationale;
};

export type MarketingPriority = {
  priority: number;
  title: string;
  rationale: StrategyRationale;
};

export type MarketingStrategyConfidence = "low" | "moderate" | "high";

/**
 * Structured marketing strategy produced by the Marketing Strategist capability.
 * Each recommendation includes rationale tied to Company DNA, Business Brain,
 * and Marketing Understanding.
 */
export type MarketingStrategy = {
  summary: string;
  confidence: MarketingStrategyConfidence;
  confidenceReason: string;
  targetAudiences: TargetAudienceRecommendation[];
  positioningRecommendations: PositioningRecommendation[];
  contentPillars: ContentPillar[];
  campaignIdeas: CampaignIdea[];
  seoOpportunities: SeoOpportunity[];
  socialMediaStrategy: SocialMediaStrategy[];
  customerJourneyRecommendations: CustomerJourneyRecommendation[];
  leadGenerationOpportunities: LeadGenerationOpportunity[];
  marketingPriorities: MarketingPriority[];
  knowledgeGaps: string[];
  generatedAt: string;
};

export type ParsedMarketingStrategyResult =
  | { success: true; strategy: MarketingStrategy; warnings: string[] }
  | { success: false; error: string; warnings: string[] };
