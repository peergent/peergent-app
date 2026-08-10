import type {
  MemoryConfidence,
  MemoryDomainId,
  MemoryQuery,
  MemoryQueryResult,
  MemoryRecord,
} from "./types";
import type { MemoryIndex } from "./memory-indexer";
import { indexMemories } from "./memory-indexer";

const CONFIDENCE_ORDER: MemoryConfidence[] = ["low", "medium", "high"];

function confidenceMeets(min: MemoryConfidence | undefined, value: MemoryConfidence): boolean {
  if (!min) return true;
  return CONFIDENCE_ORDER.indexOf(value) >= CONFIDENCE_ORDER.indexOf(min);
}

const SCOPE_CATEGORIES: Readonly<Record<MemoryQuery["scope"], readonly MemoryDomainId[]>> = {
  business: ["business_memory"],
  brand: ["brand_memory"],
  campaign: ["creative_memory", "validation_memory", "execution_memory"],
  creative: ["creative_memory"],
  performance: ["performance_memory"],
  learning: ["learning_memory"],
  context: [
    "business_memory",
    "brand_memory",
    "audience_memory",
    "competitive_memory",
    "creative_memory",
    "validation_memory",
  ],
  recent: [],
  relevant: [],
};

function relevanceScore(mem: MemoryRecord, query: MemoryQuery): number {
  let score = CONFIDENCE_ORDER.indexOf(mem.confidence);
  if (query.campaignId && mem.relatedCampaigns.includes(query.campaignId)) score += 3;
  if (query.tags?.some((t) => mem.tags.includes(t))) score += 2;
  if (mem.importance === "critical") score += 2;
  else if (mem.importance === "high") score += 1;
  return score;
}

/** Retrieve organizational memory by scope, relevance, and recency. */
export class MemoryRetriever {
  query(memories: readonly MemoryRecord[], query: MemoryQuery): MemoryQueryResult {
    const limit = query.limit ?? 20;
    let pool = memories.filter((m) => m.lifecycle === "active");

    if (query.categories?.length) {
      pool = pool.filter((m) => query.categories!.includes(m.category));
    } else if (query.scope !== "recent" && query.scope !== "relevant") {
      const cats = SCOPE_CATEGORIES[query.scope];
      if (cats.length) pool = pool.filter((m) => cats.includes(m.category));
    }

    if (query.campaignId) {
      pool = pool.filter((m) => m.relatedCampaigns.includes(query.campaignId!));
    }

    if (query.tags?.length) {
      pool = pool.filter((m) => query.tags!.some((t) => m.tags.includes(t)));
    }

    pool = pool.filter((m) => confidenceMeets(query.minConfidence, m.confidence));

    if (query.scope === "recent") {
      pool = [...pool].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } else if (query.scope === "relevant") {
      pool = [...pool].sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query));
    } else {
      pool = [...pool].sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query));
    }

    return {
      query,
      memories: pool.slice(0, limit),
      retrievedAt: new Date().toISOString(),
    };
  }

  queryFromIndex(
    memories: readonly MemoryRecord[],
    index: MemoryIndex,
    query: MemoryQuery
  ): MemoryQueryResult {
    void index;
    return this.query(memories, query);
  }
}

export function createMemoryRetriever(): MemoryRetriever {
  return new MemoryRetriever();
}

export function retrieveMemories(
  memories: readonly MemoryRecord[],
  query: MemoryQuery
): MemoryQueryResult {
  return createMemoryRetriever().query(memories, query);
}

export function retrieveRelevantMemories(input: {
  memories: readonly MemoryRecord[];
  organizationId: string;
  campaignId?: string;
  tags?: readonly string[];
  limit?: number;
}): MemoryQueryResult {
  return retrieveMemories(input.memories, {
    scope: "relevant",
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    tags: input.tags,
    limit: input.limit ?? 10,
  });
}

export { indexMemories };
