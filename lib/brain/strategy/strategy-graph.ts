import type { BrainConfidence } from "../domain/confidence";

export const STRATEGY_GRAPH_VERSION = "1.0.0";

/** One explainable strategy section — maps to customer findings. */
export type StrategySection = {
  title: string;
  description: string;
  confidence: BrainConfidence;
  supportingEvidence: readonly string[];
  reasoningReferences: readonly string[];
};

export type RejectedAlternative = {
  alternative: string;
  reason: string;
  confidence: BrainConfidence;
};

export type StrategyDecisionRecord = {
  decision: string;
  reason: string;
  evidence: readonly string[];
  alternativesConsidered: readonly string[];
  alternativesRejected: readonly RejectedAlternative[];
  confidence: BrainConfidence;
  risks: readonly string[];
  unknowns: readonly string[];
  futureValidation?: string;
};

/** Internal strategy model — maps to BrainStructuredOutput without changing its shape. */
export type StrategyGraph = {
  version: string;
  organizationId: string;
  campaignId?: string;
  createdAt: string;
  businessSummary: StrategySection;
  strategicPositioning: StrategySection;
  valueProposition: StrategySection;
  primaryAudience: StrategySection;
  secondaryAudience?: StrategySection;
  customerProblems: StrategySection;
  customerMotivations: StrategySection;
  buyingTriggers: StrategySection;
  objections: StrategySection;
  differentiators: StrategySection;
  strategicThemes: readonly StrategySection[];
  priorityOpportunities: readonly StrategySection[];
  strategicRisks: readonly StrategySection[];
  constraints: readonly StrategySection[];
  assumptions: readonly StrategySection[];
  unknowns: readonly StrategySection[];
  evidenceSummary: StrategySection;
  rejectedAlternatives: readonly RejectedAlternative[];
  decisionRationales: readonly StrategyDecisionRecord[];
  recommendedDirection: StrategySection;
  successCriteria: StrategySection;
};
