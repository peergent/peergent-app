import { loadBusinessBrainContext } from "@/lib/intelligence/adapters/business-brain-query-service";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import { emptyBusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import { createStubSource, type ContextLoader } from "./base";

export const businessBrainDomainLoader: ContextLoader<BusinessBrainContextSlice> = {
  key: "business-brain",
  layerKey: "business-brain",
  loadMode: "lazy",
  ttlMs: 15 * 60 * 1000,
  load: async ({ scope, supabase, taskHint }) => {
    const organizationId = scope.organization.organizationId;

    if (!supabase) {
      return {
        key: "business-brain",
        data: emptyBusinessBrainContextSlice(),
        sources: [createStubSource("business-brain-loader-unavailable")],
        priority: 70,
        loadMode: "lazy",
      };
    }

    const result = await loadBusinessBrainContext(
      supabase,
      organizationId,
      scope.peer.role,
      taskHint
    );

    return {
      key: "business-brain",
      data: result.slice,
      sources: result.sources,
      priority: 70,
      loadMode: "lazy",
    };
  },
};

export type { BusinessBrainContextSlice };
