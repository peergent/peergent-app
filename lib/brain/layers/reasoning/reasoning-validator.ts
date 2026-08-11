/**
 * Reasoning Brain — validation.
 */

import type { ReasoningBrainGraph } from "./brain-types";
import {
  assertNoCreativeLanguage,
  assertNoStrategyLanguage,
  reasoningBrainGraphHasEvidenceChain,
} from "./reasoning-graph";

export type ReasoningValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateReasoningBrainGraph(graph: ReasoningBrainGraph): ReasoningValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!graph.organizationId) errors.push("missing_organization_id");
  if (!graph.companyGraphVersion) errors.push("missing_company_graph_version");
  if (!graph.researchGraphVersion) errors.push("missing_research_graph_version");

  if (!reasoningBrainGraphHasEvidenceChain(graph)) {
    errors.push("interpretations_without_evidence");
  }

  if (!assertNoStrategyLanguage(graph)) {
    errors.push("strategy_language_detected");
  }

  if (!assertNoCreativeLanguage(graph)) {
    errors.push("creative_language_detected");
  }

  for (const assumption of graph.assumptions) {
    if (!assumption.validationNeeded) {
      warnings.push(`assumption_not_flagged_for_validation:${assumption.id}`);
    }
  }

  for (const contradiction of graph.contradictions) {
    if (contradiction.resolutionStatus === "unresolved" && !graph.escalations.some(
      (e) => e.relatedContradictionId === contradiction.id
    )) {
      warnings.push(`unresolved_contradiction_without_escalation:${contradiction.id}`);
    }
  }

  const highWithoutEvidence = graph.interpretations.filter(
    (i) => i.confidence === "high" && i.supportedEvidence.length === 0
  );
  if (highWithoutEvidence.length > 0) {
    errors.push("high_confidence_without_evidence");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
