import type { MemoryDomainId, MemoryRecord } from "./types";

export type MemoryIndex = {
  byCategory: Readonly<Record<MemoryDomainId, readonly string[]>>;
  byCampaign: Readonly<Record<string, readonly string[]>>;
  byTag: Readonly<Record<string, readonly string[]>>;
  byMergeKey: Readonly<Record<string, string>>;
};

/** Index memories for fast retrieval by category, campaign, tag, and merge key. */
export class MemoryIndexer {
  build(memories: readonly MemoryRecord[]): MemoryIndex {
    const byCategory = {} as Record<MemoryDomainId, string[]>;
    const byCampaign: Record<string, string[]> = {};
    const byTag: Record<string, string[]> = {};
    const byMergeKey: Record<string, string> = {};

    for (const mem of memories) {
      if (mem.lifecycle !== "active") continue;

      const catList = byCategory[mem.category] ?? [];
      catList.push(mem.id);
      byCategory[mem.category] = catList;

      byMergeKey[mem.mergeKey] = mem.id;

      for (const campaignId of mem.relatedCampaigns) {
        const list = byCampaign[campaignId] ?? [];
        list.push(mem.id);
        byCampaign[campaignId] = list;
      }

      for (const tag of mem.tags) {
        const list = byTag[tag] ?? [];
        list.push(mem.id);
        byTag[tag] = list;
      }
    }

    return { byCategory, byCampaign, byTag, byMergeKey };
  }
}

export function createMemoryIndexer(): MemoryIndexer {
  return new MemoryIndexer();
}

export function indexMemories(memories: readonly MemoryRecord[]): MemoryIndex {
  return createMemoryIndexer().build(memories);
}
