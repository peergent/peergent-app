import type { BrainDecision } from "../evidence/structured-output";
import type { BrainProvenanceRef } from "../domain/provenance";
import { campaignProvenance } from "../capabilities/shared/provenance";
import { decisionConfidenceLabel } from "./decision-confidence";
import type { Decision, DecisionCollection } from "./decision-types";

export type DecisionPresentationSummary = {
  id: string;
  title: string;
  summary: string;
  recommendation: string;
  confidence: string;
  confidenceLevel: Decision["confidence"];
  businessImpact: string;
  approvalRequired: boolean;
  category: Decision["category"];
};

export type DecisionExplainabilityView = {
  decisionId: string;
  reasoning: string;
  evidenceIds: readonly string[];
  assumptions: readonly string[];
  alternativesConsidered: readonly string[];
  alternativesRejected: readonly { alternative: string; reason: string }[];
  knownRisks: readonly string[];
  unknowns: readonly string[];
  customerChallenges: readonly { question: string; answer: string }[];
  dependencies: readonly { decisionId: string; relationship: string; label?: string }[];
  reviewTriggers: readonly { description: string; condition: string }[];
};

/** Customer-facing decision summary — concise, Emma voice. */
export function presentDecisionSummary(decision: Decision, nl: boolean): DecisionPresentationSummary {
  return {
    id: decision.id,
    title: decision.title,
    summary: decision.summary,
    recommendation: decision.recommendation,
    confidence: decisionConfidenceLabel(decision.confidence, nl),
    confidenceLevel: decision.confidence,
    businessImpact: decision.businessImpact,
    approvalRequired: decision.approvalRequired,
    category: decision.category,
  };
}

/** Full explainability payload — hidden by default, available on drill-down. */
export function presentDecisionExplainability(decision: Decision): DecisionExplainabilityView {
  return {
    decisionId: decision.id,
    reasoning: decision.reasoning,
    evidenceIds: decision.supportingEvidence,
    assumptions: decision.assumptions,
    alternativesConsidered: decision.alternativesConsidered,
    alternativesRejected: decision.alternativesRejected,
    knownRisks: decision.knownRisks,
    unknowns: decision.unknowns,
    customerChallenges: decision.customerChallenges,
    dependencies: decision.dependencies.map((d) => ({
      decisionId: d.decisionId,
      relationship: d.relationship,
      label: d.label,
    })),
    reviewTriggers: decision.reviewTriggers.map((t) => ({
      description: t.description,
      condition: t.condition,
    })),
  };
}

export function presentTopDecisions(
  collection: DecisionCollection,
  nl: boolean,
  limit = 5
): DecisionPresentationSummary[] {
  const priority: Decision["category"][] = [
    "strategy_direction",
    "channel_choice",
    "audience_focus",
    "positioning",
    "lead_generation",
    "content_direction",
    "channel_rejection",
    "timing",
  ];

  const sorted = [...collection.decisions].sort((a, b) => {
    const pa = priority.indexOf(a.category);
    const pb = priority.indexOf(b.category);
    if (pa !== pb) return pa - pb;
    return b.confidenceScore - a.confidenceScore;
  });

  return sorted.slice(0, limit).map((d) => presentDecisionSummary(d, nl));
}

/** Map Decision → legacy BrainDecision for backwards-compatible structured output. */
export function mapDecisionToBrainDecision(
  decision: Decision,
  campaignId: string
): BrainDecision {
  const provenance: BrainProvenanceRef[] = [
    campaignProvenance(campaignId, `decision:${decision.id}`),
    ...decision.supportingEvidence.map((ref) => ({
      kind: "capability_output" as const,
      refId: ref,
      label: "decision_evidence",
    })),
  ];

  const rejectedSummary =
    decision.alternativesRejected.length > 0
      ? ` Rejected alternatives: ${decision.alternativesRejected.map((a) => `${a.alternative} (${a.reason})`).join("; ")}.`
      : "";

  return {
    id: decision.id,
    label: decision.title,
    rationale: `${decision.recommendation} ${decision.reasoning}${rejectedSummary}`.trim(),
    confidence: decision.confidence === "very_high" || decision.confidence === "high" ? "high" : decision.confidence === "medium" ? "medium" : "low",
    provenance,
  };
}

export function mapDecisionsToBrainDecisions(
  collection: DecisionCollection,
  campaignId: string
): BrainDecision[] {
  return collection.decisions.map((d) => mapDecisionToBrainDecision(d, campaignId));
}
