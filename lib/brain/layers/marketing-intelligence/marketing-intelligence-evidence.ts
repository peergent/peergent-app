/**
 * Marketing Intelligence — evidence collection from upstream brains.
 */

import type { CompanyGraph } from "../company/types";
import type { MemoryGraph } from "../memory/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { MarketingEvidenceRef } from "./brain-types";

export function collectMarketingEvidence(input: {
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  memoryGraph?: MemoryGraph | null;
}): MarketingEvidenceRef[] {
  const refs: MarketingEvidenceRef[] = [];

  for (const fact of input.companyGraph.facts.slice(0, 20)) {
    refs.push({
      id: `mi-co-${fact.id}`,
      source: "company",
      refId: fact.id,
      summary: `${fact.title}: ${fact.value}`,
      confidence: fact.confidence,
    });
  }

  for (const ev of input.researchGraph.evidence.slice(0, 15)) {
    refs.push({
      id: `mi-rs-${ev.id}`,
      source: "research",
      refId: ev.id,
      summary: ev.normalizedSummary,
      confidence: ev.confidence,
    });
  }

  for (const finding of input.researchGraph.findings.slice(0, 10)) {
    refs.push({
      id: `mi-rf-${finding.id}`,
      source: "research",
      refId: finding.id,
      summary: finding.summary,
      confidence: finding.confidence,
    });
  }

  for (const interpretation of input.reasoningGraph.interpretations) {
    refs.push({
      id: `mi-rn-${interpretation.id}`,
      source: "reasoning",
      refId: interpretation.id,
      summary: interpretation.summary,
      confidence: interpretation.confidence,
    });
  }

  for (const memory of input.memoryGraph?.memories.slice(0, 5) ?? []) {
    refs.push({
      id: `mi-mem-${memory.id}`,
      source: "memory",
      refId: memory.id,
      summary: memory.description,
      confidence: memory.confidence,
    });
  }

  return refs;
}

export function evidenceIds(refs: readonly MarketingEvidenceRef[]): string[] {
  return refs.map((r) => r.id);
}
