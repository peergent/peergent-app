/**
 * Reasoning Layer — canonical types.
 * Sprint 9 Phase 1. Understanding only — no recommendations, strategy, or content.
 */

export const REASONING_LAYER_VERSION = "1.0.0";

export type ReasoningConfidenceScore = number;

/** Base node — every reasoning output carries evidence chain and confidence. */
export type ReasoningNode = {
  id: string;
  title: string;
  description: string;
  confidence: ReasoningConfidenceScore;
  /** Research evidence ids supporting this reasoning. */
  supportingEvidence: readonly string[];
  /** Related research evidence or unknown ids. */
  relatedResearch: readonly string[];
  reasoningVersion: string;
  createdAt: string;
};

export type ReasoningPattern = ReasoningNode & {
  patternType: string;
  signalSummary: string;
};

export type ReasoningContradiction = ReasoningNode & {
  evidenceA: string;
  evidenceB: string;
  resolutionStatus: "unresolved" | "deferred";
};

export type ReasoningUnknown = ReasoningNode & {
  reason: string;
};

export type ReasoningOpportunity = ReasoningNode & {
  /** Understanding only — not an action recommendation. */
  opportunityType: string;
};

export type ReasoningRisk = ReasoningNode & {
  severity: "low" | "medium" | "high";
};

export type ReasoningHypothesis = ReasoningNode & {
  validationRequired: true;
};

export type ReasoningConstraint = ReasoningNode & {
  constraintType: string;
};

export type ReasoningAssumption = ReasoningNode & {
  basedOnConfidence: ReasoningConfidenceScore;
};

export type ReasoningTheme = ReasoningNode & {
  themeCategory: string;
};

export type ReasoningPriorityInsight = ReasoningNode & {
  rank: number;
};

/** Canonical Reasoning Layer output — consumed by Strategy Layer (future migration). */
export type ReasoningGraph = {
  version: string;
  organizationId: string;
  campaignId?: string;
  /** Research graph version this reasoning was derived from. */
  researchVersion: string;
  createdAt: string;
  businessModel: readonly ReasoningNode[];
  marketPosition: readonly ReasoningNode[];
  customerModel: readonly ReasoningNode[];
  competitiveLandscape: readonly ReasoningNode[];
  strengths: readonly ReasoningNode[];
  weaknesses: readonly ReasoningNode[];
  opportunities: readonly ReasoningOpportunity[];
  risks: readonly ReasoningRisk[];
  hypotheses: readonly ReasoningHypothesis[];
  constraints: readonly ReasoningConstraint[];
  assumptions: readonly ReasoningAssumption[];
  unknowns: readonly ReasoningUnknown[];
  contradictions: readonly ReasoningContradiction[];
  priorityInsights: readonly ReasoningPriorityInsight[];
  strategicThemes: readonly ReasoningTheme[];
  patterns: readonly ReasoningPattern[];
};

export function emptyReasoningGraph(input: {
  organizationId: string;
  campaignId?: string;
  researchVersion: string;
  createdAt?: string;
}): ReasoningGraph {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    version: REASONING_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    researchVersion: input.researchVersion,
    createdAt,
    businessModel: [],
    marketPosition: [],
    customerModel: [],
    competitiveLandscape: [],
    strengths: [],
    weaknesses: [],
    opportunities: [],
    risks: [],
    hypotheses: [],
    constraints: [],
    assumptions: [],
    unknowns: [],
    contradictions: [],
    priorityInsights: [],
    strategicThemes: [],
    patterns: [],
  };
}
