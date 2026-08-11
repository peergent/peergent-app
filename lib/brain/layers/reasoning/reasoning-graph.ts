/**
 * Reasoning Brain — graph builder.
 * Transforms CompanyGraph + ResearchBrainGraph into structured judgment.
 */

import type { CompanyGraph } from "../company/types";
import type { MemoryGraph } from "../memory/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import {
  emptyReasoningBrainGraph,
  type ReasoningBrainGraph,
  type ReasoningBrainHypothesis,
  type ReasoningBrainUnknown,
  type ReasoningEvidenceRef,
  type ReasoningInterpretation,
} from "./brain-types";
import { buildReasoningContradictions } from "./reasoning-contradictions";
import { buildReasoningAssumptions } from "./reasoning-assumptions";
import { buildReasoningOpportunities, containsStrategyLanguage } from "./reasoning-opportunities";
import { buildReasoningRisks } from "./reasoning-risks";
import { buildDecisionOptions } from "./reasoning-options";
import { buildEscalations } from "./reasoning-escalations";
import { buildPrioritySignals } from "./reasoning-prioritization";
import {
  aggregateGraphConfidence,
  deriveInterpretationConfidence,
  enforceReasoningConfidenceCeiling,
} from "./reasoning-confidence";

let hypothesisCounter = 0;
let unknownCounter = 0;
let interpretationCounter = 0;

export function resetReasoningGraphCounters(): void {
  hypothesisCounter = 0;
  unknownCounter = 0;
  interpretationCounter = 0;
}

function collectEvidenceRefs(input: {
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  memoryGraph?: MemoryGraph | null;
  createdAt: string;
}): ReasoningEvidenceRef[] {
  const refs: ReasoningEvidenceRef[] = [];

  for (const fact of input.companyGraph.facts) {
    refs.push({
      id: `ev-co-${fact.id}`,
      source: "company_fact",
      refId: fact.id,
      summary: `${fact.title}: ${fact.value}`,
      confidence: fact.confidence,
      capturedAt: fact.updatedAt,
    });
  }

  for (const ev of input.researchGraph.evidence) {
    refs.push({
      id: `ev-rs-${ev.id}`,
      source: "research_evidence",
      refId: ev.id,
      summary: ev.normalizedSummary,
      confidence: ev.confidence,
      capturedAt: ev.capturedAt,
    });
  }

  for (const finding of input.researchGraph.findings) {
    refs.push({
      id: `ev-rf-${finding.id}`,
      source: "research_finding",
      refId: finding.id,
      summary: finding.summary,
      confidence: finding.confidence,
      capturedAt: finding.createdAt,
    });
  }

  for (const memory of input.memoryGraph?.memories ?? []) {
    refs.push({
      id: `ev-mem-${memory.id}`,
      source: "memory",
      refId: memory.id,
      summary: memory.description,
      confidence: memory.confidence,
      capturedAt: memory.updatedAt,
    });
  }

  return refs;
}

function buildInterpretations(input: {
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  evidence: readonly ReasoningEvidenceRef[];
  createdAt: string;
}): ReasoningInterpretation[] {
  const interpretations: ReasoningInterpretation[] = [];

  const positioningFact = input.companyGraph.facts.find(
    (f) => f.domain === "competitive_position" || f.key === "positioning"
  );
  if (positioningFact) {
    const relatedEvidence = input.evidence
      .filter((e) => e.refId === positioningFact.id || e.summary.includes(positioningFact.value))
      .map((e) => e.id);
    const { label, reason } = deriveInterpretationConfidence({
      evidence: input.evidence.filter((e) => relatedEvidence.includes(e.id)),
      contradictions: 0,
    });

    interpretationCounter += 1;
    interpretations.push({
      id: `int-${interpretationCounter}`,
      title: "Company positioning context",
      summary: `Organization positions as: ${positioningFact.value}`,
      confidence: enforceReasoningConfidenceCeiling(label, relatedEvidence.length),
      importance: positioningFact.customerConfirmed ? "high" : "medium",
      supportedEvidence: relatedEvidence,
      relatedFacts: [positioningFact.id],
      relatedResearch: input.researchGraph.findings.slice(0, 3).map((f) => f.id),
      businessImpact: "Anchors all downstream strategic interpretation.",
      customerImpact: "Shapes how customers may perceive the brand.",
      marketImpact: "Defines competitive frame of reference.",
      confidenceReason: reason,
      createdAt: input.createdAt,
    });
  }

  for (const insight of input.researchGraph.audienceInsights.slice(0, 3)) {
    interpretationCounter += 1;
    const { label, reason } = deriveInterpretationConfidence({
      evidence: input.evidence.filter((e) => insight.evidenceIds.includes(e.refId)),
      contradictions: 0,
    });
    interpretations.push({
      id: `int-${interpretationCounter}`,
      title: `Audience signal: ${insight.segment}`,
      summary: `Audience segment "${insight.segment}" shows research-backed enrichment potential.`,
      confidence: label,
      importance: "medium",
      supportedEvidence: insight.evidenceIds,
      relatedFacts: [],
      relatedResearch: insight.evidenceIds,
      businessImpact: "May expand addressable market understanding.",
      customerImpact: "Potential segment may have distinct needs.",
      marketImpact: "Segment may be underserved in category messaging.",
      confidenceReason: reason,
      createdAt: input.createdAt,
    });
  }

  for (const signal of input.researchGraph.marketSignals.slice(0, 3)) {
    interpretationCounter += 1;
    interpretations.push({
      id: `int-${interpretationCounter}`,
      title: `Market signal: ${signal.signalType}`,
      summary: signal.description,
      confidence: signal.confidence,
      importance: "medium",
      supportedEvidence: signal.evidenceIds,
      relatedFacts: [],
      relatedResearch: signal.evidenceIds,
      businessImpact: "Informs category context.",
      customerImpact: "May affect buyer expectations.",
      marketImpact: "External market dynamics signal.",
      confidenceReason: "Derived from evidenced market research.",
      createdAt: input.createdAt,
    });
  }

  return interpretations;
}

function buildHypotheses(input: {
  researchGraph: ResearchBrainGraph;
  createdAt: string;
}): ReasoningBrainHypothesis[] {
  const hypotheses: ReasoningBrainHypothesis[] = [];

  const researchHypotheses = input.researchGraph.findings.filter(
    (f) => f.findingType === "hypothesis"
  );

  for (const finding of researchHypotheses) {
    hypothesisCounter += 1;
    hypotheses.push({
      id: `hyp-${hypothesisCounter}`,
      statement: finding.summary,
      confidence: "low",
      supportingEvidence: finding.evidenceIds,
      missingEvidence:
        finding.evidenceIds.length === 0
          ? ["External validation required"]
          : ["Additional corroborating sources"],
      createdAt: input.createdAt,
    });
  }

  if (hypotheses.length === 0) {
    hypothesisCounter += 1;
    hypotheses.push({
      id: `hyp-${hypothesisCounter}`,
      statement: "Customers may value speed more than price in this category.",
      confidence: "low",
      supportingEvidence: input.researchGraph.evidence.slice(0, 1).map((e) => e.id),
      missingEvidence: ["Pricing sensitivity research", "Customer interview data"],
      createdAt: input.createdAt,
    });
  }

  if (input.researchGraph.audienceInsights.some((a) => a.enrichmentOnly)) {
    hypothesisCounter += 1;
    hypotheses.push({
      id: `hyp-${hypothesisCounter}`,
      statement: "An underserved segment may exist beyond current company audience facts.",
      confidence: "low",
      supportingEvidence: [],
      missingEvidence: ["Segment validation research", "Customer confirmation"],
      createdAt: input.createdAt,
    });
  }

  return hypotheses;
}

function buildUnknowns(input: {
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  createdAt: string;
}): ReasoningBrainUnknown[] {
  const unknowns: ReasoningBrainUnknown[] = [];

  for (const domain of input.companyGraph.unknownDomains) {
    unknownCounter += 1;
    unknowns.push({
      id: `unk-${unknownCounter}`,
      category: "missing_information",
      description: `Company domain "${domain}" lacks confirmed facts.`,
      question: `What is the canonical truth for ${domain}?`,
      relatedEvidence: [],
      createdAt: input.createdAt,
    });
  }

  for (const q of input.researchGraph.unresolvedQuestions) {
    unknownCounter += 1;
    unknowns.push({
      id: `unk-${unknownCounter}`,
      category: "missing_research",
      description: q.reason,
      question: q.question,
      relatedEvidence: [],
      createdAt: input.createdAt,
    });
  }

  for (const assumption of input.researchGraph.findings.filter((f) => f.findingType === "hypothesis")) {
    unknownCounter += 1;
    unknowns.push({
      id: `unk-${unknownCounter}`,
      category: "uncertain_assumption",
      description: assumption.summary,
      question: "What evidence would confirm or reject this hypothesis?",
      relatedEvidence: assumption.evidenceIds,
      createdAt: input.createdAt,
    });
  }

  if (input.researchGraph.budgetState.exhausted) {
    unknownCounter += 1;
    unknowns.push({
      id: `unk-${unknownCounter}`,
      category: "investigation_required",
      description: "Research budget exhausted before all questions were resolved.",
      question: "Should additional research be scheduled?",
      relatedEvidence: [],
      createdAt: input.createdAt,
    });
  }

  return unknowns;
}

export type BuildReasoningBrainGraphInput = {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  memoryGraph?: MemoryGraph | null;
  projectObjective?: string;
  businessGoals?: readonly string[];
  knownConstraints?: readonly string[];
  knownRisks?: readonly string[];
  customerPriorities?: readonly string[];
  createdAt?: string;
};

export function buildReasoningBrainGraph(input: BuildReasoningBrainGraphInput): ReasoningBrainGraph {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const projectObjective =
    input.projectObjective ??
    input.researchGraph.objective.projectObjective ??
    "Interpret evidence into structured understanding.";

  let graph = emptyReasoningBrainGraph({
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    projectObjective,
    companyGraphVersion: input.companyGraph.version,
    researchGraphVersion: input.researchGraph.version,
    createdAt,
  });

  const evidence = collectEvidenceRefs({
    companyGraph: input.companyGraph,
    researchGraph: input.researchGraph,
    memoryGraph: input.memoryGraph,
    createdAt,
  });

  const interpretations = buildInterpretations({
    companyGraph: input.companyGraph,
    researchGraph: input.researchGraph,
    evidence,
    createdAt,
  });

  const contradictionResult = buildReasoningContradictions({
    companyGraph: input.companyGraph,
    researchGraph: input.researchGraph,
    createdAt,
  });

  const allInterpretations = [...interpretations, ...contradictionResult.interpretations];
  const assumptions = buildReasoningAssumptions({
    companyGraph: input.companyGraph,
    researchGraph: input.researchGraph,
    createdAt,
  });
  const hypotheses = buildHypotheses({ researchGraph: input.researchGraph, createdAt });
  const opportunities = buildReasoningOpportunities({
    researchGraph: input.researchGraph,
    createdAt,
  }).filter((o) => !containsStrategyLanguage(o.description));
  const risks = buildReasoningRisks({
    researchGraph: input.researchGraph,
    knownRisks: input.knownRisks,
    createdAt,
  });
  const unknowns = buildUnknowns({
    companyGraph: input.companyGraph,
    researchGraph: input.researchGraph,
    createdAt,
  });

  const brandConflicts = input.companyGraph.facts
    .filter((f) => f.domain === "brand_rules" && f.confidence === "low")
    .map((f) => `Low-confidence brand rule: ${f.title}`);

  const escalations = buildEscalations({
    contradictions: contradictionResult.contradictions,
    unknowns,
    inconclusiveResearch: input.researchGraph.confidence === "low",
    brandConflicts,
    createdAt,
    existing: contradictionResult.escalations,
  });

  const partialGraph = {
    ...graph,
    evidence,
    interpretations: allInterpretations,
    contradictions: contradictionResult.contradictions,
    hypotheses,
    assumptions,
    opportunities,
    risks,
    unknowns,
    escalations,
  };

  const decisionOptions = buildDecisionOptions({
    graph: partialGraph,
    createdAt,
  });

  const prioritySignals = buildPrioritySignals({
    interpretations: allInterpretations,
    opportunities,
    risks,
    createdAt,
  });

  graph = {
    ...partialGraph,
    decisionOptions,
    prioritySignals,
    updatedAt: new Date().toISOString(),
    summary: {
      headline: `${allInterpretations.length} interpretations from ${evidence.length} evidence refs`,
      interpretationCount: allInterpretations.length,
      contradictionCount: contradictionResult.contradictions.length,
      escalationCount: escalations.length,
      unknownCount: unknowns.length,
      optionCount: decisionOptions.length,
    },
    confidence: aggregateGraphConfidence(allInterpretations),
  };

  return graph;
}

export function reasoningBrainGraphHasEvidenceChain(graph: ReasoningBrainGraph): boolean {
  if (graph.interpretations.length === 0) return true;
  return graph.interpretations.every(
    (i) => i.supportedEvidence.length > 0 || i.confidence === "low"
  );
}

export function assertNoCompanyMutation(
  before: CompanyGraph,
  after: CompanyGraph
): boolean {
  return (
    before.organizationId === after.organizationId &&
    before.facts.length === after.facts.length &&
    before.versionMeta.version === after.versionMeta.version
  );
}

export function assertNoStrategyLanguage(graph: ReasoningBrainGraph): boolean {
  const texts = [
    ...graph.interpretations.map((i) => i.summary),
    ...graph.opportunities.map((o) => o.description),
    ...graph.decisionOptions.map((o) => o.description),
  ];
  return !texts.some((t) => containsStrategyLanguage(t));
}

export function assertNoCreativeLanguage(graph: ReasoningBrainGraph): boolean {
  const creativePattern =
    /\b(headline|hook|ad copy|email subject|landing page|campaign creative)\b/i;
  const texts = [
    ...graph.interpretations.map((i) => i.summary),
    ...graph.decisionOptions.map((o) => o.description),
  ];
  return !texts.some((t) => creativePattern.test(t));
}
