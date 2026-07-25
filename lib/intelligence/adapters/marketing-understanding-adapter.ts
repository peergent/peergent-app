import { createBusinessBrainService } from "@/lib/business-brain";
import { createMarketingIntelligenceService } from "@/lib/marketing-intelligence";
import { buildMarketingUnderstanding } from "@/lib/marketing-intelligence/understanding";
import { createSupabaseSource } from "@/lib/context-engine/data/sources";
import type { SourceRef } from "@/lib/context-engine/types/sources";
import type { AppSupabaseClient } from "../api/org-context";
import { loadCompanyDnaContext } from "./company-dna-adapter";
import { businessBrainAggregateToContextSlice } from "../types/business-brain-context-slice";
import {
  emptyMarketingUnderstandingContextSlice,
  toMarketingUnderstandingContextSlice,
  type MarketingUnderstandingContextSlice,
} from "../types/marketing-understanding-context-slice";

export type MarketingUnderstandingLoadResult = {
  slice: MarketingUnderstandingContextSlice;
  sources: SourceRef[];
};

/**
 * Loads and composes Marketing Understanding for the Marketing Peer.
 * Consumes Company DNA, Business Brain, and Marketing Intelligence domain data.
 */
export async function loadMarketingUnderstandingContext(
  supabase: AppSupabaseClient,
  organizationId: string,
  role: string,
  _taskHint?: string
): Promise<MarketingUnderstandingLoadResult> {
  if (role !== "Marketing") {
    return {
      slice: emptyMarketingUnderstandingContextSlice(),
      sources: [],
    };
  }

  if (!supabase) {
    return {
      slice: emptyMarketingUnderstandingContextSlice(),
      sources: [
        {
          id: "marketing-understanding:unavailable",
          type: "derived",
          label: "Marketing Understanding unavailable",
          fetchedAt: new Date().toISOString(),
          freshness: "cached",
        },
      ],
    };
  }

  try {
    const [dnaResult, businessBrain, marketingProfile] = await Promise.all([
      loadCompanyDnaContext(supabase, organizationId),
      createBusinessBrainService(supabase).getAggregate(organizationId),
      createMarketingIntelligenceService(supabase).getAggregate(organizationId),
    ]);

    const brainSlice = businessBrainAggregateToContextSlice(businessBrain);

    const understanding = buildMarketingUnderstanding({
      companyDna: dnaResult.slice,
      businessBrain: brainSlice,
      marketingProfile,
    });

    return {
      slice: toMarketingUnderstandingContextSlice(understanding),
      sources: [
        ...dnaResult.sources,
        createSupabaseSource(
          "business_brains",
          organizationId,
          "Business Brain"
        ),
        createSupabaseSource(
          "marketing_profiles",
          organizationId,
          "Marketing Intelligence"
        ),
      ],
    };
  } catch (error) {
    console.error("[loadMarketingUnderstandingContext] failed:", error);
    throw error;
  }
}
