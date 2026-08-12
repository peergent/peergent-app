import { getDefaultMemoryRepository } from "../../layers/memory/memory-repository";
import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import { createContextItem } from "../normalize/context-item";

export const memoryContextAdapter: ContextSourceAdapter = {
  id: "memory",
  categories: ["memory"],
  async acquire(input: ContextAdapterInput): Promise<ContextAdapterResult> {
    const started = Date.now();
    try {
      const memories = getDefaultMemoryRepository().getOrgMemories(input.organizationId);
      const limit = Math.min(input.budget.maxItemsPerAdapter, memories.length);
      const at = new Date().toISOString();

      const items = memories.slice(0, limit).map((mem) =>
        createContextItem({
          category: "memory",
          key: `memory.${mem.id}`,
          label: mem.title ?? mem.category ?? "Memory",
          summary: mem.description.slice(0, input.budget.maxSummaryChars),
          organizationId: input.organizationId,
          projectId: input.projectId,
          provenance: {
            kind: "memory",
            refId: mem.id,
            label: mem.title,
            capturedAt: mem.createdAt ?? at,
          },
          sourceAdapterId: "memory",
          freshness: "fresh",
          confidence:
            mem.confidence === "high"
              ? "high"
              : mem.confidence === "medium"
                ? "medium"
                : mem.confidence === "low"
                  ? "low"
                  : "unknown",
        })
      );

      if (memories.length > limit) {
        items.push(
          createContextItem({
            category: "memory",
            key: "memory.organization",
            label: "Organizational memory index",
            summary: `${memories.length} memories available (${limit} included in package)`,
            organizationId: input.organizationId,
            provenance: { kind: "memory", refId: input.organizationId, capturedAt: at },
            sourceAdapterId: "memory",
            confidence: "medium",
            metadata: { total: memories.length, included: limit },
          })
        );
      } else if (memories.length > 0) {
        items.push(
          createContextItem({
            category: "memory",
            key: "memory.organization",
            label: "Organizational memory",
            summary: `${memories.length} durable memory record(s)`,
            organizationId: input.organizationId,
            provenance: { kind: "memory", refId: input.organizationId, capturedAt: at },
            sourceAdapterId: "memory",
            confidence: "medium",
            metadata: { total: memories.length },
          })
        );
      }

      return {
        adapterId: "memory",
        status: "completed",
        items,
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        adapterId: "memory",
        status: "failed",
        items: [],
        failureCode: "memory_load_failed",
        failureMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      };
    }
  },
};
