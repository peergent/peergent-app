/**
 * Research Brain — evidence, source, and citation builders.
 */

import type {
  ResearchBrainEvidence,
  ResearchCitation,
  ResearchConfidenceLabel,
  ResearchSourceRecord,
  ResearchSourceType,
} from "./brain-types";
import { freshnessFromDates, computeValidUntil } from "./research-freshness";
import type { ResearchProviderEvidenceItem } from "./research-provider";

let sourceCounter = 0;
let evidenceCounter = 0;
let citationCounter = 0;

export function resetResearchBrainEvidenceCounters(): void {
  sourceCounter = 0;
  evidenceCounter = 0;
  citationCounter = 0;
}

export function createResearchSourceRecord(input: {
  id?: string;
  type: ResearchSourceType;
  identity: string;
  url?: string | null;
  label: string;
  capturedAt: string;
  maxAgeDays?: number;
}): ResearchSourceRecord {
  sourceCounter += 1;
  const freshness = freshnessFromDates({
    capturedAt: input.capturedAt,
    maxAgeDays: input.maxAgeDays ?? 90,
  });
  return {
    id: input.id ?? `src-${sourceCounter}`,
    type: input.type,
    identity: input.identity,
    url: input.url ?? null,
    label: input.label,
    capturedAt: input.capturedAt,
    freshness,
    lastVerified: input.capturedAt,
    organizationScoped: true,
  };
}

export function createResearchBrainEvidence(input: {
  id?: string;
  sourceId: string;
  sourceType: ResearchSourceType;
  url?: string | null;
  capturedAt: string;
  rawExcerpt: string;
  normalizedSummary: string;
  confidence: ResearchConfidenceLabel;
  directEvidence: boolean;
  maxAgeDays?: number;
}): ResearchBrainEvidence {
  evidenceCounter += 1;
  const freshness = freshnessFromDates({
    capturedAt: input.capturedAt,
    maxAgeDays: input.maxAgeDays ?? 90,
  });
  return {
    id: input.id ?? `rbe-${evidenceCounter}`,
    sourceId: input.sourceId,
    sourceType: input.sourceType,
    url: input.url ?? null,
    capturedAt: input.capturedAt,
    freshness,
    validUntil: computeValidUntil(input.capturedAt, input.maxAgeDays ?? 90),
    rawExcerpt: input.rawExcerpt,
    normalizedSummary: input.normalizedSummary,
    confidence: input.confidence,
    directEvidence: input.directEvidence,
  };
}

export function createResearchCitation(input: {
  evidenceId: string;
  sourceId: string;
  excerpt: string;
  capturedAt: string;
}): ResearchCitation {
  citationCounter += 1;
  return {
    id: `cite-${citationCounter}`,
    evidenceId: input.evidenceId,
    sourceId: input.sourceId,
    excerpt: input.excerpt,
    capturedAt: input.capturedAt,
  };
}

export function providerItemsToEvidence(input: {
  items: readonly ResearchProviderEvidenceItem[];
  defaultConfidence: ResearchConfidenceLabel;
  maxAgeDays?: number;
}): {
  sources: ResearchSourceRecord[];
  evidence: ResearchBrainEvidence[];
  citations: ResearchCitation[];
} {
  const sources: ResearchSourceRecord[] = [];
  const evidence: ResearchBrainEvidence[] = [];
  const citations: ResearchCitation[] = [];
  const sourceByIdentity = new Map<string, ResearchSourceRecord>();

  for (const item of input.items) {
    let source = sourceByIdentity.get(item.identity);
    if (!source) {
      source = createResearchSourceRecord({
        type: item.sourceType,
        identity: item.identity,
        url: item.url,
        label: item.label,
        capturedAt: item.capturedAt,
        maxAgeDays: input.maxAgeDays,
      });
      sourceByIdentity.set(item.identity, source);
      sources.push(source);
    }

    const ev = createResearchBrainEvidence({
      sourceId: source.id,
      sourceType: item.sourceType,
      url: item.url,
      capturedAt: item.capturedAt,
      rawExcerpt: item.rawExcerpt,
      normalizedSummary: item.normalizedSummary,
      confidence: item.directEvidence ? "high" : input.defaultConfidence,
      directEvidence: item.directEvidence,
      maxAgeDays: input.maxAgeDays,
    });
    evidence.push(ev);
    citations.push(
      createResearchCitation({
        evidenceId: ev.id,
        sourceId: source.id,
        excerpt: item.rawExcerpt.slice(0, 240),
        capturedAt: item.capturedAt,
      })
    );
  }

  return { sources, evidence, citations };
}

export function evidenceProvenanceComplete(
  evidence: readonly ResearchBrainEvidence[]
): boolean {
  return evidence.every(
    (e) => e.sourceId.length > 0 && e.capturedAt.length > 0 && e.normalizedSummary.length > 0
  );
}
