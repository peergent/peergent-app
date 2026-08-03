import type { BrainConfidence } from "../domain/confidence";
import type { BrainProvenanceRef } from "../domain/provenance";

export type BrainFinding = {
  id: string;
  label: string;
  value: string;
  confidence: BrainConfidence;
  provenance: readonly BrainProvenanceRef[];
};

export type BrainDecision = {
  id: string;
  label: string;
  rationale: string;
  confidence: BrainConfidence;
  provenance: readonly BrainProvenanceRef[];
};

export type BrainRecommendation = {
  id: string;
  label: string;
  priority: "low" | "medium" | "high";
  provenance: readonly BrainProvenanceRef[];
};

export type BrainActionProposal = {
  id: string;
  actionType: string;
  label: string;
  requiresApproval: boolean;
  provenance: readonly BrainProvenanceRef[];
};

export type BrainExecutionResult = {
  id: string;
  actionId: string;
  status: "pending" | "completed" | "failed" | "skipped";
  summary: string;
  provenance: readonly BrainProvenanceRef[];
};

export type BrainWarning = {
  id: string;
  code: string;
  message: string;
  provenance: readonly BrainProvenanceRef[];
};

export type BrainError = {
  id: string;
  code: string;
  message: string;
  retryable: boolean;
  provenance: readonly BrainProvenanceRef[];
};

/** Structured output from a capability — narrative UI text is derived, not stored here. */
export type BrainStructuredOutput = {
  capabilityId: string;
  capabilityVersion: string;
  findings: readonly BrainFinding[];
  decisions: readonly BrainDecision[];
  recommendations: readonly BrainRecommendation[];
  actionProposals: readonly BrainActionProposal[];
  executionResults: readonly BrainExecutionResult[];
  warnings: readonly BrainWarning[];
  errors: readonly BrainError[];
  generatedAt: string;
};

export function emptyBrainStructuredOutput(
  capabilityId: string,
  capabilityVersion: string,
  generatedAt: string
): BrainStructuredOutput {
  return {
    capabilityId,
    capabilityVersion,
    findings: [],
    decisions: [],
    recommendations: [],
    actionProposals: [],
    executionResults: [],
    warnings: [],
    errors: [],
    generatedAt,
  };
}
