import { executeBusinessBrainQuery, planBusinessBrainQuery } from "@/lib/intelligence/adapters/business-brain-query-service";
import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import { createContextItem } from "../normalize/context-item";
import { resolveFreshness } from "../../domain/freshness";

export const businessBrainContextAdapter: ContextSourceAdapter = {
  id: "business_brain",
  categories: ["business_brain", "knowledge"],
  async acquire(input: ContextAdapterInput): Promise<ContextAdapterResult> {
    const started = Date.now();
    try {
      const plan = planBusinessBrainQuery(input.peerRole ?? "Marketing", "project_context");
      const result = await executeBusinessBrainQuery(input.supabase, input.organizationId, plan);
      const slice = result.slice;
      const items = [];
      const limit = input.budget.maxItemsPerAdapter;
      const at = new Date().toISOString();

      if (slice.products.length > 0) {
        items.push(
          createContextItem({
            category: "business_brain",
            key: "business.products",
            label: "Products",
            summary: slice.products
              .slice(0, 5)
              .map((p) => p.name)
              .join("; "),
            organizationId: input.organizationId,
            provenance: { kind: "business_brain", refId: "products", capturedAt: at },
            sourceAdapterId: "business_brain",
            freshness: resolveFreshness(at),
            confidence: slice.sparse ? "low" : "medium",
            metadata: { count: slice.products.length },
          })
        );
      }

      if (slice.customerSegments.length > 0) {
        items.push(
          createContextItem({
            category: "business_brain",
            key: "business.target_audience",
            label: "Target audience",
            summary: slice.customerSegments
              .slice(0, 5)
              .map((s) => s.name)
              .join("; "),
            organizationId: input.organizationId,
            provenance: { kind: "business_brain", refId: "customer_segments", capturedAt: at },
            sourceAdapterId: "business_brain",
            confidence: slice.sparse ? "low" : "medium",
            metadata: { count: slice.customerSegments.length },
          })
        );
      }

      if (slice.competitors.length > 0) {
        items.push(
          createContextItem({
            category: "business_brain",
            key: "business.competitors",
            label: "Competitors",
            summary: slice.competitors
              .slice(0, 5)
              .map((c) => c.name)
              .join("; "),
            organizationId: input.organizationId,
            provenance: { kind: "competitor", refId: "competitors", capturedAt: at },
            sourceAdapterId: "business_brain",
            confidence: "medium",
            metadata: { count: slice.competitors.length },
          })
        );
      }

      const facts = slice.facts.slice(0, Math.max(0, limit - items.length));
      for (const fact of facts) {
        items.push(
          createContextItem({
            category: "business_brain",
            key: `business.fact.${fact.id}`,
            label: fact.subject,
            summary: `${fact.predicate}: ${fact.value}`.slice(0, input.budget.maxSummaryChars),
            organizationId: input.organizationId,
            provenance: { kind: "business_brain", refId: fact.id, capturedAt: at },
            sourceAdapterId: "business_brain",
            confidence:
              fact.confidence === "high"
                ? "high"
                : fact.confidence === "moderate"
                  ? "medium"
                  : "low",
          })
        );
      }

      if (slice.knowledgeSources.length > 0) {
        items.push(
          createContextItem({
            category: "knowledge",
            key: "knowledge.sources",
            label: "Knowledge sources",
            summary: `${slice.knowledgeSources.length} registered source(s)`,
            organizationId: input.organizationId,
            provenance: { kind: "document", refId: "knowledge_sources", capturedAt: at },
            sourceAdapterId: "business_brain",
            confidence: "medium",
            metadata: { count: slice.knowledgeSources.length },
          })
        );
      }

      if (slice.products.length > 0 || slice.services.length > 0) {
        items.push(
          createContextItem({
            category: "business_brain",
            key: "business.positioning",
            label: "Business offering",
            summary: `Products: ${slice.products.length}, Services: ${slice.services.length}`,
            organizationId: input.organizationId,
            provenance: { kind: "business_brain", refId: "offering", capturedAt: at },
            sourceAdapterId: "business_brain",
            confidence: slice.available ? "medium" : "unknown",
          })
        );
      }

      return {
        adapterId: "business_brain",
        status: slice.available ? "completed" : "partial",
        items: items.slice(0, limit),
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        adapterId: "business_brain",
        status: "failed",
        items: [],
        failureCode: "business_brain_load_failed",
        failureMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      };
    }
  },
};
