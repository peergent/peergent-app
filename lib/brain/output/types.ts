/**
 * Brain Output Layer — customer-facing intelligence contracts.
 *
 * Brains store structure (BrainStructuredOutput, Decision, PlanningGraph).
 * This layer derives every UI-facing object. Surfaces never read raw campaign fields.
 */

/** Which layer produced this intelligence. */
export type BrainSource =
  | "research"
  | "reasoning"
  | "marketing_intelligence"
  | "strategy"
  | "planning"
  | "creative"
  | "validation"
  | "memory"
  | "optimization";

export type ConfidenceScore = {
  /** 0–1 normalized score when available */
  value: number;
  /** Customer label: High / Medium / Low */
  label: string;
};

/** Answers: what did we discover, why does it matter, what decision, what's next, expected impact. */
export type ExecutiveSummary = {
  whatWeDiscovered: string;
  whyItMatters: string;
  decisionMade: string;
  whatHappensNext: string;
  expectedBusinessImpact: string;
  /** Single editorial paragraph for display */
  narrative: string;
};

export type BusinessIntelligenceBulletTone =
  | "positive"
  | "attention"
  | "insight"
  | "neutral"
  | "recommendation";

/** Each bullet explains a change — never metrics alone. */
export type BusinessIntelligenceBullet = {
  id: string;
  text: string;
  tone: BusinessIntelligenceBulletTone;
  source: BrainSource;
};

export type BusinessIntelligence = {
  headline: string;
  bullets: readonly BusinessIntelligenceBullet[];
};

/** Recommendation with full business rationale. */
export type BrainOutputRecommendation = {
  id: string;
  headline: string;
  reason: string;
  expectedOutcome: string;
  confidence: ConfidenceScore;
  businessImpact: string;
  whyNow: string;
  href: string | null;
  source: BrainSource;
};

export type ContextGap = {
  id: string;
  label: string;
  whyNeeded: string;
  source: BrainSource;
};

export type BusinessRisk = {
  id: string;
  title: string;
  description: string;
  mitigation: string | null;
  source: BrainSource;
};

export type BusinessOpportunity = {
  id: string;
  title: string;
  description: string;
  expectedImpact: string | null;
  source: BrainSource;
};

export type RecentDiscovery = {
  id: string;
  title: string;
  summary: string;
  sourceBrain: BrainSource;
  at: string;
};

export type RecentDecision = {
  id: string;
  title: string;
  rationale: string;
  at: string;
  source: BrainSource;
};

export type RecentLearning = {
  id: string;
  title: string;
  summary: string;
  at: string;
  source: BrainSource;
};

export type SuggestedAction = {
  id: string;
  label: string;
  reason: string;
  urgency: "low" | "medium" | "high";
  source: BrainSource;
};

/** Real Brain event — not a log line. */
export type LiveActivityEvent = {
  id: string;
  timestamp: string;
  timeLabel: string;
  title: string;
  subtitle: string;
  tone: "success" | "insight" | "attention" | "neutral";
  sourceBrain: BrainSource;
  whyItMatters: string;
  href: string | null;
};

export type ProgressStepState = "done" | "waiting" | "upcoming";

/** Progress explains decisions, not workflow stages. */
export type ProgressStepNarrative = {
  id: string;
  label: string;
  state: ProgressStepState;
  /** e.g. "We analysed 8 competitors and identified a pricing gap." */
  narrative: string;
  expansion: {
    whatHappened: string;
    whyItHappened: string;
    businessImpact: string;
    decisionTaken: string | null;
  } | null;
  source: BrainSource;
};

export type ProgressNarrative = {
  percent: number;
  statusHeadline: string;
  steps: readonly ProgressStepNarrative[];
};

export type CampaignNarrative = {
  executiveSummary: ExecutiveSummary;
  sections: {
    businessGoal: string;
    currentStatus: string;
    expectedImpact: string;
    nextDecision: string;
  };
};

export type ApprovalReason = {
  summary: string;
  unblocks: string;
  expectedImpact: string;
};

export type ExpectedBusinessImpact = {
  summary: string;
  metrics: readonly { label: string; value: string }[];
};

export type MissingContext = {
  items: readonly ContextGap[];
};

/** Provenance for a capability contribution. */
export type BrainOutputSource = {
  capabilityId: string;
  source: BrainSource;
  generatedAt: string;
};

/**
 * Complete intelligence package for one campaign.
 * Campaign Experience consumes ONLY this object (via office mappers).
 */
export type CampaignBrainOutput = {
  campaignId: string;
  peerId: string;
  generatedAt: string;
  executiveSummary: ExecutiveSummary;
  campaignNarrative: CampaignNarrative;
  businessIntelligence: BusinessIntelligence;
  recommendations: readonly BrainOutputRecommendation[];
  contextGaps: readonly ContextGap[];
  businessRisks: readonly BusinessRisk[];
  businessOpportunities: readonly BusinessOpportunity[];
  recentDiscoveries: readonly RecentDiscovery[];
  recentDecisions: readonly RecentDecision[];
  recentLearnings: readonly RecentLearning[];
  suggestedActions: readonly SuggestedAction[];
  activity: readonly LiveActivityEvent[];
  progress: ProgressNarrative;
  approvalReason: ApprovalReason | null;
  expectedBusinessImpact: ExpectedBusinessImpact;
  confidenceScore: ConfidenceScore;
  missingContext: MissingContext;
  sources: readonly BrainOutputSource[];
};

/**
 * Peer-level intelligence aggregated across active campaigns.
 * Marketing Workspace consumes ONLY this object (via office mappers).
 */
export type WorkspaceBrainOutput = {
  peerId: string;
  generatedAt: string;
  executiveSummary: ExecutiveSummary;
  businessIntelligence: BusinessIntelligence;
  recommendations: readonly BrainOutputRecommendation[];
  activity: readonly LiveActivityEvent[];
  recentDiscoveries: readonly RecentDiscovery[];
  recentDecisions: readonly RecentDecision[];
  confidenceScore: ConfidenceScore;
  sources: readonly BrainOutputSource[];
};
