import { loadBrandBrainContext } from "@/lib/intelligence/adapters/brand-brain-adapter";
import type { BrandBrainContextSlice } from "@/lib/intelligence/types/brand-brain-context-slice";
import { createStubSource, type ContextLoader } from "./base";

export const brandBrainLoader: ContextLoader<BrandBrainContextSlice> = {
  key: "brand-brain",
  layerKey: "brand-brain",
  loadMode: "lazy",
  ttlMs: 30 * 60 * 1000,
  load: async ({ scope, supabase }) => {
    const organizationId = scope.organization.organizationId;
    const assembledAt = scope.requestedAt;

    const { slice, sources } = await loadBrandBrainContext(
      supabase,
      organizationId,
      assembledAt
    );

    return {
      key: "brand-brain",
      data: slice,
      sources:
        sources.length > 0
          ? sources
          : [createStubSource("brand-brain-loader-unavailable")],
      priority: 58,
      loadMode: "lazy",
    };
  },
};

export type { BrandBrainContextSlice };
