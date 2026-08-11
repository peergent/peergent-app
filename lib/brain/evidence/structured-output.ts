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
  /** Sprint 10.2 — full Decision records for executive review (optional, backwards compatible). */
  decisionRecords?: readonly import("../decision/decision-types").Decision[];
  /** Sprint 11.0 — full PlanningGraph for executive review (optional, backwards compatible). */
  planningGraph?: import("../layers/planning/types").PlanningGraph;
  /** Sprint 11.1 — cache identity and diagnostics for campaign_planning output. */
  planningMetadata?: import("../planning/campaign-planning-types").PlanningOutputMetadata;
  /** PX-35 — full CreativeGraph for executive review and Brain Output Layer (optional). */
  creativeGraph?: import("../layers/creative/types").CreativeGraph;
  /** PX-36 — full ValidationGraph for approval and Brain Output Layer (optional). */
  validationGraph?: import("../layers/validation/types").ValidationGraph;
  /** PX-37 — full MemoryGraph for organizational knowledge (optional). */
  memoryGraph?: import("../layers/memory/types").MemoryGraph;
  /** PX-39 — full ExecutionHistory for publish records (optional). */
  executionHistory?: import("../layers/execution/types").ExecutionHistory;
  /** PX-40 — full CompanyGraph for organizational truth (optional). */
  companyGraph?: import("../layers/company/types").CompanyGraph;
  /** PX-41 — full ResearchBrainGraph for external discovery (optional). */
  researchBrainGraph?: import("../layers/research/brain-types").ResearchBrainGraph;
  /** PX-42 — full ReasoningBrainGraph for structured judgment (optional). */
  reasoningBrainGraph?: import("../layers/reasoning/brain-types").ReasoningBrainGraph;
  /** PX-43 — full MarketingIntelligenceBrainGraph (optional). */
  marketingIntelligenceBrainGraph?: import("../layers/marketing-intelligence/brain-types").MarketingIntelligenceBrainGraph;
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
