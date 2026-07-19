import { createMarketingIntelligenceService } from "@/lib/marketing-intelligence";
import { buildMarketingUnderstanding } from "@/lib/marketing-intelligence/understanding";
import { createSupabaseSource } from "@/lib/context-engine/data/sources";
import type { SourceRef } from "@/lib/context-engine/types/sources";
import type { AppSupabaseClient } from "../api/org-context";
import { loadCompanyDnaContext } from "./company-dna-adapter";
import { executeBusinessBrainQuery } from "./business-brain-query-service";
import { planMarketingBusinessBrainQuery } from "../retrieval/marketing-query-planner";
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
  taskHint?: string
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
    const queryPlan = planMarketingBusinessBrainQuery(taskHint);

    const [dnaResult, brainResult, marketingProfile] = await Promise.all([
      loadCompanyDnaContext(supabase, organizationId),
      executeBusinessBrainQuery(supabase, organizationId, queryPlan),
      createMarketingIntelligenceService(supabase).getAggregate(organizationId),
    ]);

    const understanding = buildMarketingUnderstanding({
      companyDna: dnaResult.slice,
      businessBrain: brainResult.slice,
      marketingProfile,
    });

    return {
      slice: toMarketingUnderstandingContextSlice(understanding),
      sources: [
        ...dnaResult.sources,
        ...brainResult.sources,
        createSupabaseSource(
          "marketing_profiles",
          organizationId,
          "Marketing Intelligence"
        ),
      ],
    };
  } catch {
    return {
      slice: emptyMarketingUnderstandingContextSlice(),
      sources: [
        {
          id: "marketing-understanding:error",
          type: "derived",
          label: "Marketing Understanding load failed",
          fetchedAt: new Date().toISOString(),
          freshness: "cached",
        },
      ],
    };
  }
}
