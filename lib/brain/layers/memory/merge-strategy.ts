import type {
  MemoryConfidence,
  MemoryDecision,
  MemoryDomainId,
  MemoryEvolutionEntry,
  MemoryImportance,
  MemoryQualityAction,
  MemoryRecord,
} from "./types";

export function memoryMergeKey(category: MemoryDomainId, title: string): string {
  return `${category}:${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)}`;
}

function titleSimilarity(a: string, b: string): number {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = new Set(na.split(/\s+/));
  const wordsB = new Set(nb.split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

export function findMergeTarget(
  candidate: Pick<MemoryRecord, "category" | "title" | "mergeKey">,
  existing: readonly MemoryRecord[]
): MemoryRecord | null {
  const exact = existing.find(
    (m) => m.lifecycle === "active" && m.mergeKey === candidate.mergeKey
  );
  if (exact) return exact;

  for (const mem of existing) {
    if (mem.lifecycle !== "active" || mem.category !== candidate.category) continue;
    if (titleSimilarity(mem.title, candidate.title) >= 0.75) return mem;
  }
  return null;
}

export function mergeMemories(
  existing: MemoryRecord,
  incoming: MemoryRecord
): MemoryRecord {
  const evidenceIds = new Set(existing.evidence.map((e) => e.id));
  const mergedEvidence = [
    ...existing.evidence,
    ...incoming.evidence.filter((e) => !evidenceIds.has(e.id)),
  ];

  const confidence = bumpConfidence(existing.confidence, incoming.confidence);

  return {
    ...existing,
    description: incoming.description.length > existing.description.length
      ? incoming.description
      : existing.description,
    confidence,
    importance: maxImportance(existing.importance, incoming.importance),
    updatedAt: incoming.updatedAt,
    evidence: mergedEvidence,
    relatedCampaigns: [...new Set([...existing.relatedCampaigns, ...incoming.relatedCampaigns])],
    relatedDecisions: [...new Set([...existing.relatedDecisions, ...incoming.relatedDecisions])],
    relatedAssets: [...new Set([...existing.relatedAssets, ...incoming.relatedAssets])],
    tags: [...new Set([...existing.tags, ...incoming.tags])],
    expiresAt: existing.expiresAt,
  };
}

function bumpConfidence(a: MemoryConfidence, b: MemoryConfidence): MemoryConfidence {
  const order: MemoryConfidence[] = ["low", "medium", "high"];
  return order[Math.min(order.indexOf(a) + (order.indexOf(b) >= 1 ? 1 : 0), 2)]!;
}

function maxImportance(a: MemoryImportance, b: MemoryImportance): MemoryImportance {
  const order: MemoryImportance[] = ["low", "medium", "high", "critical"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))]!;
}

export function decideMemoryAction(input: {
  candidate: MemoryRecord;
  existing: readonly MemoryRecord[];
  approvalGranted: boolean;
}): { action: MemoryQualityAction; target: MemoryRecord | null } {
  if (input.candidate.importance === "low" && input.candidate.confidence === "low") {
    return { action: "skip", target: null };
  }

  const target = findMergeTarget(input.candidate, input.existing);
  if (target) {
    return { action: "merge", target };
  }

  if (
    input.candidate.category === "validation_memory" &&
    input.candidate.tags.includes("blocking")
  ) {
    return { action: "store_permanent", target: null };
  }

  if (input.candidate.confidence === "high" && input.candidate.importance !== "low") {
    return { action: "store_permanent", target: null };
  }

  if (input.approvalGranted && input.candidate.importance === "critical") {
    return { action: "store_permanent", target: null };
  }

  if (input.candidate.confidence === "low") {
    return { action: "store_temporary", target: null };
  }

  return { action: "store_permanent", target: null };
}

export function applyMemoryDecision(input: {
  candidate: MemoryRecord;
  action: MemoryQualityAction;
  target: MemoryRecord | null;
}): { record: MemoryRecord | null; decision: MemoryDecision; evolution: MemoryEvolutionEntry | null } {
  const decision: MemoryDecision = {
    id: `mem-dec-${input.candidate.id}`,
    action: input.action,
    memoryId: input.candidate.id,
    targetMemoryId: input.target?.id ?? null,
    reason:
      input.action === "merge"
        ? `Merged with existing memory "${input.target?.title}".`
        : input.action === "skip"
          ? "Insufficient confidence or importance to store."
          : `Stored as ${input.action.replace("_", " ")}.`,
    category: input.candidate.category,
  };

  if (input.action === "skip" || input.action === "forget") {
    return { record: null, decision, evolution: null };
  }

  if (input.action === "merge" && input.target) {
    const merged = mergeMemories(input.target, input.candidate);
    return {
      record: merged,
      decision,
      evolution: {
        id: `evo-${input.candidate.id}`,
        memoryId: merged.id,
        action: "merge",
        previousTitle: input.target.title,
        newTitle: merged.title,
        reason: decision.reason,
        at: input.candidate.updatedAt,
      },
    };
  }

  const record: MemoryRecord = {
    ...input.candidate,
    expiresAt:
      input.action === "store_temporary"
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        : null,
  };

  return {
    record,
    decision,
    evolution: {
      id: `evo-${input.candidate.id}`,
      memoryId: record.id,
      action: input.action,
      previousTitle: null,
      newTitle: record.title,
      reason: decision.reason,
      at: record.createdAt,
    },
  };
}
