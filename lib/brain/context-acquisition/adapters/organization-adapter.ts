import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import { fetchOrganizationById } from "@/lib/context-engine/data/queries";
import { createContextItem } from "../normalize/context-item";

export const organizationContextAdapter: ContextSourceAdapter = {
  id: "organization",
  categories: ["organization"],
  async acquire(input: ContextAdapterInput): Promise<ContextAdapterResult> {
    const started = Date.now();
    try {
      const org = await fetchOrganizationById(input.supabase, input.organizationId);
      if (!org) {
        return {
          adapterId: "organization",
          status: "partial",
          items: [],
          failureCode: "organization_not_found",
          failureMessage: "Organization record not found.",
          durationMs: Date.now() - started,
        };
      }

      const item = createContextItem({
        category: "organization",
        key: "organization.identity",
        label: "Organization",
        summary: `${org.name} (${org.slug})`,
        organizationId: input.organizationId,
        provenance: {
          kind: "company_profile",
          refId: org.id,
          label: org.name,
          capturedAt: new Date().toISOString(),
        },
        sourceAdapterId: "organization",
        freshness: "fresh",
        confidence: "high",
      });

      return {
        adapterId: "organization",
        status: "completed",
        items: [item],
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        adapterId: "organization",
        status: "failed",
        items: [],
        failureCode: "organization_load_failed",
        failureMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      };
    }
  },
};
