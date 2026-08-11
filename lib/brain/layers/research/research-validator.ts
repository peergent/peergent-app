/**
 * Research Brain — validation.
 */

import type { ResearchBrainGraph } from "./brain-types";
import {
  researchGraphHasEvidenceChain,
  researchGraphNeverHighConfidenceWithoutEvidence,
} from "./research-graph";
import { evidenceProvenanceComplete } from "./research-evidence-builder";

export type ResearchValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateResearchBrainGraph(graph: ResearchBrainGraph): ResearchValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!graph.organizationId) errors.push("missing_organization_id");
  if (!graph.plan?.id) errors.push("missing_plan");
  if (!graph.objective?.id) errors.push("missing_objective");

  if (!researchGraphHasEvidenceChain(graph)) {
    errors.push("unsupported_findings_without_evidence");
  }

  if (!researchGraphNeverHighConfidenceWithoutEvidence(graph)) {
    errors.push("high_confidence_without_evidence");
  }

  if (!evidenceProvenanceComplete(graph.evidence)) {
    warnings.push("incomplete_evidence_provenance");
  }

  for (const contradiction of graph.contradictions) {
    if (!contradiction.unresolved) {
      warnings.push(`contradiction_resolved_silently:${contradiction.id}`);
    }
  }

  for (const proposal of graph.proposedUpdates) {
    if (!proposal.requiresCustomerConfirmation) {
      warnings.push(`proposal_missing_confirmation:${proposal.id}`);
    }
  }

  const unsupportedHigh = graph.findings.filter(
    (f) => f.confidence === "high" && f.evidenceIds.length === 0 && f.findingType !== "hypothesis"
  );
  if (unsupportedHigh.length > 0) {
    errors.push("unsupported_high_confidence_facts");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
