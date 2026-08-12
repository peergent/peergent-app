import type { BrainProvenanceRef } from "../../domain/provenance";
import type { FreshnessState } from "../../domain/freshness";
import type { AcquiredContextItem, ContextCategory, ContextConfidence } from "../types";

export function createContextItem(input: {
  category: ContextCategory;
  key: string;
  label: string;
  summary: string;
  organizationId: string;
  projectId?: string;
  peerId?: string;
  observedAt?: string;
  freshness?: FreshnessState;
  confidence?: ContextConfidence;
  provenance: BrainProvenanceRef;
  sourceAdapterId: string;
  metadata?: Readonly<Record<string, string | number | boolean>>;
  maxSummaryChars?: number;
}): AcquiredContextItem {
  const max = input.maxSummaryChars ?? 512;
  const summary =
    input.summary.length > max ? `${input.summary.slice(0, max - 1)}…` : input.summary;

  return {
    id: `${input.sourceAdapterId}:${input.category}:${input.key}`,
    category: input.category,
    key: input.key,
    label: input.label,
    summary,
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    observedAt: input.observedAt ?? new Date().toISOString(),
    freshness: input.freshness ?? "unknown",
    confidence: input.confidence ?? "unknown",
    provenance: input.provenance,
    sourceAdapterId: input.sourceAdapterId,
    metadata: input.metadata,
  };
}

export function itemMatchesRequirement(item: AcquiredContextItem, requirementKey: string): boolean {
  return item.key === requirementKey || item.key.startsWith(`${requirementKey}.`);
}
