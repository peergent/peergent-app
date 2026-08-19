import type { CompanyGraph } from "../layers/company/types";
import type { ResearchBrainGraph } from "../layers/research/brain-types";
import type { ReasoningBrainGraph, ReasoningBrainInput } from "../layers/reasoning/brain-types";
import { REASONING_BRAIN_VERSION, emptyReasoningBrainGraph } from "../layers/reasoning/brain-types";
import { buildReasoningBrainGraph } from "../layers/reasoning/reasoning-graph";
import type { ReasoningLlmPayload } from "./reasoning-llm-schema";
import type { IntelligenceProviderMetadata } from "./intelligence-provider-metadata";
import { aggregateGraphConfidence } from "../layers/reasoning/reasoning-confidence";

export function mapReasoningLlmPayloadToGraph(input: {
  payload: ReasoningLlmPayload;
  reasoningInput: ReasoningBrainInput;
  providerMeta: IntelligenceProviderMetadata;
  modelId?: string;
}): ReasoningBrainGraph {
  const createdAt = new Date().toISOString();
  const deterministicBase = buildReasoningBrainGraph(input.reasoningInput);
  const evidence = deterministicBase.evidence;

  const interpretations = input.payload.interpretations.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    confidence: item.confidence,
    importance: item.importance,
    supportedEvidence: [...item.supportedEvidenceIds],
    relatedFacts: [],
    relatedResearch: [...item.supportedEvidenceIds],
    businessImpact: item.claimType === "INFERENCE" ? "Derived inference — verify with evidence." : "Evidence-backed interpretation.",
    customerImpact: "See interpretation summary.",
    marketImpact: "See interpretation summary.",
    confidenceReason:
      item.claimType === "UNKNOWN"
        ? "Insufficient evidence — marked unknown."
        : `Grounded in ${item.supportedEvidenceIds.length} evidence item(s).`,
    createdAt,
  }));

  const graph: ReasoningBrainGraph = {
    ...emptyReasoningBrainGraph({
      organizationId: input.reasoningInput.organizationId,
      projectId: input.reasoningInput.projectId,
      campaignId: input.reasoningInput.campaignId,
      projectObjective: input.reasoningInput.projectObjective ?? "Campaign objective",
      companyGraphVersion: String(input.reasoningInput.companyGraph.versionMeta.version),
      researchGraphVersion: input.reasoningInput.researchGraph.version,
      createdAt,
    }),
    updatedAt: createdAt,
    evidence,
    interpretations,
    contradictions: input.payload.contradictions.map((c) => ({
      id: c.id,
      companyClaim: c.companyClaim,
      researchClaim: c.researchClaim,
      interpretation: c.interpretation,
      resolutionStatus: "interpreted" as const,
      relatedFactIds: [],
      relatedResearchIds: [],
      evidenceIds: [],
      confidence: c.confidence,
      createdAt,
    })),
    hypotheses: input.payload.hypotheses.map((h) => ({
      id: h.id,
      statement: h.statement,
      confidence: h.confidence,
      supportingEvidence: [...h.supportedEvidenceIds],
      missingEvidence: [],
      createdAt,
    })),
    assumptions: deterministicBase.assumptions,
    opportunities: input.payload.opportunities.map((o) => ({
      id: o.id,
      description: o.description,
      reason: o.reason,
      expectedImpact: o.reason,
      confidence: o.confidence,
      requiredEffort: "medium" as const,
      supportingEvidence: [...o.supportedEvidenceIds],
      priority: "medium" as const,
      createdAt,
    })),
    risks: input.payload.risks.map((r) => ({
      id: r.id,
      description: r.description,
      likelihood: "medium" as const,
      severity: r.severity,
      businessImpact: r.description,
      mitigationSuggestion: "Validate with additional research before acting.",
      confidence: r.confidence,
      supportingEvidence: [...r.supportedEvidenceIds],
      createdAt,
    })),
    unknowns: input.payload.unknowns.map((u) => ({
      id: u.id,
      category: "missing_research" as const,
      description: u.reason,
      question: u.question,
      relatedEvidence: [],
      createdAt,
    })),
    decisionOptions: deterministicBase.decisionOptions,
    escalations: deterministicBase.escalations,
    prioritySignals: [
      ...input.payload.strategicImplications.map((s) => ({
        id: s.id,
        subject: s.summary.slice(0, 80),
        priority: "medium" as const,
        rationale: s.summary,
        businessImpact: "high" as const,
        confidence: "medium" as const,
        urgency: "medium" as const,
        effort: "medium" as const,
        risk: "medium" as const,
        relatedInterpretationId: null,
        createdAt,
      })),
    ],
    summary: {
      headline: `LLM reasoning: ${interpretations.length} interpretations from ${evidence.length} evidence refs`,
      interpretationCount: interpretations.length,
      contradictionCount: input.payload.contradictions.length,
      escalationCount: deterministicBase.escalations.length,
      unknownCount: input.payload.unknowns.length,
      optionCount: deterministicBase.decisionOptions.length,
    },
    confidence: aggregateGraphConfidence(interpretations),
    providerMeta: input.providerMeta,
  };

  return graph;
}

export function attachReasoningProviderMeta(
  graph: ReasoningBrainGraph,
  providerMeta: IntelligenceProviderMetadata
): ReasoningBrainGraph {
  return { ...graph, providerMeta };
}
