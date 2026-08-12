import { loadMarketingUnderstandingContext } from "@/lib/intelligence/adapters/marketing-understanding-adapter";
import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import { createContextItem } from "../normalize/context-item";

export const intelligenceContextAdapter: ContextSourceAdapter = {
  id: "intelligence",
  categories: ["intelligence"],
  async acquire(input: ContextAdapterInput): Promise<ContextAdapterResult> {
    const started = Date.now();
    const role = input.peerRole ?? "Marketing";

    try {
      const { slice } = await loadMarketingUnderstandingContext(
        input.supabase,
        input.organizationId,
        role,
        "project_context"
      );

      if (!slice.available) {
        return {
          adapterId: "intelligence",
          status: "partial",
          items: [],
          durationMs: Date.now() - started,
        };
      }

      const at = new Date().toISOString();
      const items = [];

      if (slice.competitors.length > 0) {
        items.push(
          createContextItem({
            category: "intelligence",
            key: "intelligence.competitors",
            label: "Competitor intelligence",
            summary: slice.competitors
              .slice(0, 5)
              .map((c) => c.name)
              .join("; "),
            organizationId: input.organizationId,
            provenance: { kind: "market", refId: "marketing_understanding:competitors", capturedAt: at },
            sourceAdapterId: "intelligence",
            confidence: slice.sparse ? "low" : "medium",
            metadata: { count: slice.competitors.length },
          })
        );
      }

      if (slice.goals.length > 0) {
        items.push(
          createContextItem({
            category: "intelligence",
            key: "intelligence.goals",
            label: "Marketing goals",
            summary: slice.goals
              .slice(0, 5)
              .map((g) => g.title)
              .join("; "),
            organizationId: input.organizationId,
            provenance: { kind: "market", refId: "marketing_understanding:goals", capturedAt: at },
            sourceAdapterId: "intelligence",
            confidence: "medium",
          })
        );
      }

      items.push(
        createContextItem({
          category: "intelligence",
          key: "intelligence.coverage",
          label: "Marketing understanding coverage",
          summary: `Completeness ${slice.completeness}%`,
          organizationId: input.organizationId,
          provenance: { kind: "market", refId: "marketing_understanding", capturedAt: at },
          sourceAdapterId: "intelligence",
          confidence: slice.completeness >= 70 ? "medium" : "low",
          metadata: { completenessPercent: slice.completeness, sparse: slice.sparse ?? false },
        })
      );

      return {
        adapterId: "intelligence",
        status: "completed",
        items: items.slice(0, input.budget.maxItemsPerAdapter),
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        adapterId: "intelligence",
        status: "failed",
        items: [],
        failureCode: "intelligence_load_failed",
        failureMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      };
    }
  },
};
