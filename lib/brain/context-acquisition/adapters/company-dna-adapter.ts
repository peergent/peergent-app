import { loadCompanyDnaContext } from "@/lib/intelligence/adapters/company-dna-adapter";
import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import { createContextItem } from "../normalize/context-item";

export const companyDnaContextAdapter: ContextSourceAdapter = {
  id: "company_dna",
  categories: ["company_dna"],
  async acquire(input: ContextAdapterInput): Promise<ContextAdapterResult> {
    const started = Date.now();
    try {
      const { slice } = await loadCompanyDnaContext(input.supabase, input.organizationId);
      const at = new Date().toISOString();
      const items = [];

      if (slice.available && slice.toneOfVoice?.summary) {
        items.push(
          createContextItem({
            category: "company_dna",
            key: "dna.tone_of_voice",
            label: "Tone of voice",
            summary: slice.toneOfVoice.summary,
            organizationId: input.organizationId,
            provenance: { kind: "company_profile", refId: "company_dna:tone", capturedAt: at },
            sourceAdapterId: "company_dna",
            freshness: "fresh",
            confidence: "medium",
          })
        );
      }

      if (slice.available && slice.mission) {
        items.push(
          createContextItem({
            category: "company_dna",
            key: "dna.mission",
            label: "Mission",
            summary: slice.mission,
            organizationId: input.organizationId,
            provenance: { kind: "company_profile", refId: "company_dna:mission", capturedAt: at },
            sourceAdapterId: "company_dna",
            confidence: "medium",
          })
        );
      }

      if (slice.available && slice.values?.length) {
        items.push(
          createContextItem({
            category: "company_dna",
            key: "dna.values",
            label: "Values",
            summary: slice.values.slice(0, 8).join("; "),
            organizationId: input.organizationId,
            provenance: { kind: "company_profile", refId: "company_dna:values", capturedAt: at },
            sourceAdapterId: "company_dna",
            confidence: "medium",
          })
        );
      }

      return {
        adapterId: "company_dna",
        status: slice.available ? "completed" : "partial",
        items: items.slice(0, input.budget.maxItemsPerAdapter),
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        adapterId: "company_dna",
        status: "failed",
        items: [],
        failureCode: "company_dna_load_failed",
        failureMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      };
    }
  },
};
