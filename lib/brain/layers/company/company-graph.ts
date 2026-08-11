import type { CompanyProfileField } from "../../company/source-priority";
import type {
  CompanyConfidence,
  CompanyDomainId,
  CompanyEvidence,
  CompanyFact,
  CompanyFreshness,
  CompanyKnowledgeSource,
} from "./types";

export function profileConfidence(field: CompanyProfileField<unknown>): CompanyConfidence {
  if (field.customerConfirmed) return "high";
  if (field.confidence === "high") return "high";
  if (field.confidence === "medium") return "medium";
  return "low";
}

export function profileFreshness(field: CompanyProfileField<unknown>): CompanyFreshness {
  if (field.freshness === "fresh") return "fresh";
  if (field.freshness === "stale") return "stale";
  return "unknown";
}

export function createFact(input: {
  id: string;
  domain: CompanyDomainId;
  key: string;
  title: string;
  value: string;
  sourceIds: readonly string[];
  evidence: readonly CompanyEvidence[];
  confidence: CompanyConfidence;
  freshness: CompanyFreshness;
  customerConfirmed: boolean;
  at: string;
  lastValidated?: string | null;
}): CompanyFact {
  return {
    id: input.id,
    domain: input.domain,
    key: input.key,
    title: input.title,
    value: input.value,
    confidence: input.confidence,
    sourceIds: input.sourceIds,
    evidence: input.evidence,
    freshness: input.freshness,
    lastValidated: input.lastValidated ?? (input.customerConfirmed ? input.at : null),
    customerConfirmed: input.customerConfirmed,
    createdAt: input.at,
    updatedAt: input.at,
  };
}

export function evidenceFromSource(
  source: CompanyKnowledgeSource,
  summary: string,
  index: number
): CompanyEvidence {
  return {
    id: `cev-${source.id}-${index}`,
    sourceId: source.id,
    summary,
    capturedAt: source.capturedAt,
  };
}

export function listFacts(
  items: readonly string[],
  input: {
    domain: CompanyDomainId;
    keyPrefix: string;
    titlePrefix: string;
    source: CompanyKnowledgeSource;
    confidence: CompanyConfidence;
    freshness: CompanyFreshness;
    customerConfirmed: boolean;
    at: string;
    startIndex: number;
  }
): CompanyFact[] {
  const facts: CompanyFact[] = [];
  let i = input.startIndex;
  for (const item of items) {
    if (!item.trim()) continue;
    const sourceIds = [input.source.id];
    facts.push(
      createFact({
        id: `cf-${input.keyPrefix}-${i}`,
        domain: input.domain,
        key: `${input.keyPrefix}-${i}`,
        title: `${input.titlePrefix}: ${item.slice(0, 60)}`,
        value: item,
        sourceIds,
        evidence: [evidenceFromSource(input.source, item, i)],
        confidence: input.confidence,
        freshness: input.freshness,
        customerConfirmed: input.customerConfirmed,
        at: input.at,
      })
    );
    i++;
  }
  return facts;
}
