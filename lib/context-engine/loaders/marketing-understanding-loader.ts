import { loadMarketingUnderstandingContext } from "@/lib/intelligence/adapters/marketing-understanding-adapter";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import { createStubSource, type ContextLoader } from "./base";

export const marketingUnderstandingLoader: ContextLoader<MarketingUnderstandingContextSlice> = {
  key: "marketing-understanding",
  layerKey: "marketing-understanding",
  loadMode: "lazy",
  ttlMs: 15 * 60 * 1000,
  load: async ({ scope, supabase, taskHint }) => {
    const organizationId = scope.organization.organizationId;
    const role = scope.peer.role;

    if (role !== "Marketing") {
      return {
        key: "marketing-understanding",
        data: {
          roleApplicable: false,
          available: false,
          sparse: true,
          completeness: 0,
          gaps: [],
          brand: { values: [], toneOfVoice: {}, keyMessages: [] },
          products: [],
          services: [],
          customerSegments: [],
          competitors: [],
          goals: [],
          existingContent: [],
          assembledAt: new Date().toISOString(),
        },
        sources: [],
        priority: 55,
        loadMode: "lazy",
      };
    }

    if (!supabase) {
      return {
        key: "marketing-understanding",
        data: {
          roleApplicable: true,
          available: false,
          sparse: true,
          completeness: 0,
          gaps: [],
          brand: { values: [], toneOfVoice: {}, keyMessages: [] },
          products: [],
          services: [],
          customerSegments: [],
          competitors: [],
          goals: [],
          existingContent: [],
          assembledAt: new Date().toISOString(),
        },
        sources: [createStubSource("marketing-understanding-loader-unavailable")],
        priority: 55,
        loadMode: "lazy",
      };
    }

    const { slice, sources } = await loadMarketingUnderstandingContext(
      supabase,
      organizationId,
      role,
      taskHint
    );

    return {
      key: "marketing-understanding",
      data: slice,
      sources,
      priority: 55,
      loadMode: "lazy",
    };
  },
};
