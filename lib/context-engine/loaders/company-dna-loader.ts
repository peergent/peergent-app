import { loadCompanyDnaContext } from "@/lib/intelligence/adapters/company-dna-adapter";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import { createStubSource, type ContextLoader } from "./base";

export const companyDnaLoader: ContextLoader<CompanyDnaContextSlice> = {
  key: "company-dna",
  layerKey: "company-dna",
  loadMode: "lazy",
  ttlMs: 30 * 60 * 1000,
  load: async ({ scope, supabase }) => {
    const organizationId = scope.organization.organizationId;

    if (!supabase) {
      return {
        key: "company-dna",
        data: { available: false, values: [], toneOfVoice: {}, riskProfile: {}, decisionPrinciples: [] },
        sources: [createStubSource("company-dna-loader-unavailable")],
        priority: 60,
        loadMode: "lazy",
      };
    }

    const { slice, sources } = await loadCompanyDnaContext(supabase, organizationId);

    return {
      key: "company-dna",
      data: slice,
      sources,
      priority: 60,
      loadMode: "lazy",
    };
  },
};

export type { CompanyDnaContextSlice };
