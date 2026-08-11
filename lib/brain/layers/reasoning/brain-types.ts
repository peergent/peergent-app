/**
 * Reasoning Brain — PX-42 canonical types.
 * Judgment layer — transforms evidence into structured understanding.
 */

import type { CompanyGraph } from "../company/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningGraph } from "./types";

export const REASONING_BRAIN_VERSION = "1.0.0";

export type ReasoningConfidenceLabel = "low" | "medium" | "high";

export type ReasoningPriority = "high" | "medium" | "low";

export type ReasoningImportance = "low" | "medium" | "high" | "critical";

export type ReasoningEvidenceRef = {
  readonly id: string;
  readonly source: "company_fact" | "research_evidence" | "research_finding" | "memory";
  readonly refId: string;
  readonly summary: string;
  readonly confidence: ReasoningConfidenceLabel;
  readonly capturedAt: string;
};

export type ReasoningInterpretation = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly confidence: ReasoningConfidenceLabel;
  readonly importance: ReasoningImportance;
  readonly supportedEvidence: readonly string[];
  readonly relatedFacts: readonly string[];
  readonly relatedResearch: readonly string[];
  readonly businessImpact: string;
  readonly customerImpact: string;
  readonly marketImpact: string;
  readonly confidenceReason: string;
  readonly createdAt: string;
};

export type ReasoningBrainAssumption = {
  readonly id: string;
  readonly statement: string;
  readonly confidence: ReasoningConfidenceLabel;
  readonly whyAssumed: string;
  readonly requiredEvidence: readonly string[];
  readonly validationNeeded: boolean;
  readonly relatedEvidence: readonly string[];
  readonly createdAt: string;
};

export type ReasoningBrainContradiction = {
  readonly id: string;
  readonly companyClaim: string;
  readonly researchClaim: string;
  readonly interpretation: string;
  readonly resolutionStatus: "unresolved" | "interpreted" | "escalated";
  readonly relatedFactIds: readonly string[];
  readonly relatedResearchIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly confidence: ReasoningConfidenceLabel;
  readonly createdAt: string;
};

export type ReasoningBrainHypothesis = {
  readonly id: string;
  readonly statement: string;
  readonly confidence: ReasoningConfidenceLabel;
  readonly supportingEvidence: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly createdAt: string;
};

export type ReasoningBrainOpportunity = {
  readonly id: string;
  readonly description: string;
  readonly reason: string;
  readonly expectedImpact: string;
  readonly confidence: ReasoningConfidenceLabel;
  readonly requiredEffort: ReasoningPriority;
  readonly supportingEvidence: readonly string[];
  readonly priority: ReasoningPriority;
  readonly createdAt: string;
};

export type ReasoningBrainRisk = {
  readonly id: string;
  readonly description: string;
  readonly likelihood: ReasoningPriority;
  readonly severity: ReasoningImportance;
  readonly businessImpact: string;
  readonly mitigationSuggestion: string;
  readonly confidence: ReasoningConfidenceLabel;
  readonly supportingEvidence: readonly string[];
  readonly createdAt: string;
};

export type ReasoningBrainUnknown = {
  readonly id: string;
  readonly category: "missing_information" | "missing_research" | "uncertain_assumption" | "investigation_required";
  readonly description: string;
  readonly question: string | null;
  readonly relatedEvidence: readonly string[];
  readonly createdAt: string;
};

export type ReasoningDecisionOption = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly advantages: readonly string[];
  readonly disadvantages: readonly string[];
  readonly confidence: ReasoningConfidenceLabel;
  readonly requiredEffort: ReasoningPriority;
  readonly expectedOutcome: string;
  readonly dependencies: readonly string[];
  readonly createdAt: string;
};

export type ReasoningEscalationKind =
  | "company_research_conflict"
  | "inconclusive_research"
  | "insufficient_evidence"
  | "customer_confirmation_required"
  | "legal_uncertainty"
  | "brand_conflict";

export type ReasoningEscalation = {
  readonly id: string;
  readonly kind: ReasoningEscalationKind;
  readonly title: string;
  readonly reason: string;
  readonly relatedContradictionId: string | null;
  readonly relatedEvidence: readonly string[];
  readonly priority: ReasoningPriority;
  readonly requiresCustomerInput: boolean;
  readonly createdAt: string;
};

export type ReasoningPrioritySignal = {
  readonly id: string;
  readonly subject: string;
  readonly priority: ReasoningPriority;
  readonly rationale: string;
  readonly businessImpact: ReasoningImportance;
  readonly confidence: ReasoningConfidenceLabel;
  readonly urgency: ReasoningPriority;
  readonly effort: ReasoningPriority;
  readonly risk: ReasoningPriority;
  readonly relatedInterpretationId: string | null;
  readonly createdAt: string;
};

export type ReasoningSummary = {
  readonly headline: string;
  readonly interpretationCount: number;
  readonly contradictionCount: number;
  readonly escalationCount: number;
  readonly unknownCount: number;
  readonly optionCount: number;
};

/** Layered Reasoning Graph — judgment without strategy or creative. */
export type ReasoningBrainGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly projectObjective: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly companyGraphVersion: string;
  readonly researchGraphVersion: string;
  readonly evidence: readonly ReasoningEvidenceRef[];
  readonly interpretations: readonly ReasoningInterpretation[];
  readonly contradictions: readonly ReasoningBrainContradiction[];
  readonly hypotheses: readonly ReasoningBrainHypothesis[];
  readonly assumptions: readonly ReasoningBrainAssumption[];
  readonly opportunities: readonly ReasoningBrainOpportunity[];
  readonly risks: readonly ReasoningBrainRisk[];
  readonly prioritySignals: readonly ReasoningPrioritySignal[];
  readonly unknowns: readonly ReasoningBrainUnknown[];
  readonly decisionOptions: readonly ReasoningDecisionOption[];
  readonly escalations: readonly ReasoningEscalation[];
  readonly summary: ReasoningSummary;
  readonly confidence: ReasoningConfidenceLabel;
  /** Strangler — legacy reasoning graph when built from legacy research graph. */
  readonly legacyGraph?: ReasoningGraph;
};

export type ReasoningSnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly graph: ReasoningBrainGraph;
  readonly outputRef: string;
  readonly storedAt: string;
};

export type ReasoningRun = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: "running" | "completed" | "failed";
  readonly snapshotId: string | null;
};

export type ReasoningHistoryEntry = {
  readonly runId: string;
  readonly snapshotId: string;
  readonly version: number;
  readonly storedAt: string;
  readonly changeReason: string;
};

export type ReasoningHistory = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly entries: readonly ReasoningHistoryEntry[];
};

export type ReasoningBrainInput = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly episodeId?: string;
  readonly campaignId?: string;
  readonly locale?: "nl" | "en";
  readonly companyGraph: CompanyGraph;
  readonly researchGraph: ResearchBrainGraph;
  readonly memoryGraph?: import("../memory/types").MemoryGraph | null;
  readonly projectObjective?: string;
  readonly businessGoals?: readonly string[];
  readonly knownConstraints?: readonly string[];
  readonly knownRisks?: readonly string[];
  readonly customerPriorities?: readonly string[];
  readonly correlationId?: string;
};

export type ReasoningBrainOutput = {
  readonly graph: ReasoningBrainGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
  readonly snapshot: ReasoningSnapshot;
  readonly run: ReasoningRun;
};

export type ReasoningBrainPayload = {
  readonly companyGraph?: CompanyGraph | null;
  readonly researchBrainGraph?: ResearchBrainGraph | null;
  readonly memoryGraph?: import("../memory/types").MemoryGraph | null;
  readonly projectObjective?: string;
  readonly businessGoals?: readonly string[];
  readonly knownConstraints?: readonly string[];
  readonly knownRisks?: readonly string[];
  readonly customerPriorities?: readonly string[];
};

export function emptyReasoningBrainGraph(input: {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
  projectObjective: string;
  companyGraphVersion: string;
  researchGraphVersion: string;
  createdAt?: string;
}): ReasoningBrainGraph {
  const now = input.createdAt ?? new Date().toISOString();
  return {
    version: REASONING_BRAIN_VERSION,
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    projectObjective: input.projectObjective,
    createdAt: now,
    updatedAt: now,
    companyGraphVersion: input.companyGraphVersion,
    researchGraphVersion: input.researchGraphVersion,
    evidence: [],
    interpretations: [],
    contradictions: [],
    hypotheses: [],
    assumptions: [],
    opportunities: [],
    risks: [],
    prioritySignals: [],
    unknowns: [],
    decisionOptions: [],
    escalations: [],
    summary: {
      headline: "Reasoning not yet executed",
      interpretationCount: 0,
      contradictionCount: 0,
      escalationCount: 0,
      unknownCount: 0,
      optionCount: 0,
    },
    confidence: "low",
  };
}

export type { CompanyGraph, ResearchBrainGraph };
