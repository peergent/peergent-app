/** Sprint 10.2 — Decision Engine types (PROJECT Brain Foundation). */

export const DECISION_ENGINE_VERSION = "1.0.0";

export type DecisionConfidenceLevel = "very_high" | "high" | "medium" | "low";

export type DecisionCategory =
  | "strategy_direction"
  | "audience_focus"
  | "positioning"
  | "channel_choice"
  | "channel_rejection"
  | "content_direction"
  | "timing"
  | "lead_generation";

export type DecisionDependency = {
  readonly decisionId: string;
  readonly relationship: "requires" | "enables" | "informs";
  readonly label?: string;
};

export type RejectedDecisionAlternative = {
  readonly alternative: string;
  readonly reason: string;
};

export type DecisionReviewTrigger = {
  readonly id: string;
  readonly description: string;
  readonly condition: string;
};

/** Proactive objection handling — Part 8. */
export type DecisionCustomerChallenge = {
  readonly question: string;
  readonly answer: string;
};

/**
 * A recorded strategic choice with full traceability.
 * Distinct from legacy BrainDecision (structured-output) which remains for backwards compatibility.
 */
export type Decision = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly recommendation: string;
  readonly confidence: DecisionConfidenceLevel;
  /** Internal numeric score 0–1 for sorting and thresholds. */
  readonly confidenceScore: number;
  readonly businessImpact: string;
  readonly expectedOutcome: string;
  readonly reasoning: string;
  readonly supportingEvidence: readonly string[];
  readonly assumptions: readonly string[];
  readonly knownRisks: readonly string[];
  readonly unknowns: readonly string[];
  readonly alternativesConsidered: readonly string[];
  readonly alternativesRejected: readonly RejectedDecisionAlternative[];
  readonly dependencies: readonly DecisionDependency[];
  readonly reviewTriggers: readonly DecisionReviewTrigger[];
  readonly customerChallenges: readonly DecisionCustomerChallenge[];
  readonly approvalRequired: boolean;
  readonly category: DecisionCategory;
  readonly createdAt: string;
  readonly brainVersion: string;
};

export type DecisionCollection = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId?: string;
  readonly createdAt: string;
  readonly decisions: readonly Decision[];
};

export type DecisionConfidenceInput = {
  readonly researchEvidenceCount: number;
  readonly reasoningConfidence: number;
  readonly brandConfirmed: boolean;
  readonly missingInformationCount: number;
  readonly contradictionCount: number;
  readonly assumptionCount: number;
  readonly dependencyQuality: number;
  readonly sectionConfidence: "low" | "medium" | "high";
};
