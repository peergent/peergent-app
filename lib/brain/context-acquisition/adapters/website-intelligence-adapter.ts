import { fetchLatestWebsiteIntelligenceAssessment } from "@/lib/website-intelligence/persistence";
import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import { createContextItem } from "../normalize/context-item";
import { resolveFreshness } from "../../domain/freshness";

export const websiteIntelligenceContextAdapter: ContextSourceAdapter = {
  id: "website_intelligence",
  categories: ["website_intelligence"],
  async acquire(input: ContextAdapterInput): Promise<ContextAdapterResult> {
    const started = Date.now();
    try {
      const loaded = await fetchLatestWebsiteIntelligenceAssessment(
        input.supabase,
        input.organizationId
      );
      if (!loaded) {
        return {
          adapterId: "website_intelligence",
          status: "partial",
          items: [],
          durationMs: Date.now() - started,
        };
      }

      const assessment = loaded.assessment;
      const freshness = resolveFreshness(loaded.analyzedAt, 1000 * 60 * 60 * 24 * 30);
      const items = [
        createContextItem({
          category: "website_intelligence",
          key: "website.messaging",
          label: "Website messaging",
          summary: assessment.executiveSummary?.conclusion ?? assessment.meta.url,
          organizationId: input.organizationId,
          provenance: {
            kind: "website",
            refId: assessment.meta.url,
            label: "Website Intelligence",
            capturedAt: loaded.analyzedAt,
          },
          sourceAdapterId: "website_intelligence",
          freshness,
          confidence: "medium",
          metadata: { source: loaded.source },
        }),
      ];

      return {
        adapterId: "website_intelligence",
        status: "completed",
        items,
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        adapterId: "website_intelligence",
        status: "failed",
        items: [],
        failureCode: "website_intelligence_load_failed",
        failureMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      };
    }
  },
};
