import { createBusinessBrainService } from "@/lib/business-brain";
import { createSupabaseSource } from "@/lib/context-engine/data/sources";
import type { SourceRef } from "@/lib/context-engine/types/sources";
import type { AppSupabaseClient } from "../api/org-context";
import { rankFacts, trimList } from "../retrieval/fact-ranker";
import { planBusinessBrainQuery } from "../retrieval/query-planner";
import {
  emptyBusinessBrainContextSlice,
  isBusinessBrainSparse,
  type BusinessBrainContextSlice,
} from "../types/business-brain-context-slice";
import type { BusinessBrainQueryPlan } from "../types/business-brain-query";

export type BusinessBrainQueryResult = {
  slice: BusinessBrainContextSlice;
  sources: SourceRef[];
  queryPlan: BusinessBrainQueryPlan;
};

export { planBusinessBrainQuery };

export async function executeBusinessBrainQuery(
  supabase: AppSupabaseClient,
  organizationId: string,
  queryPlan: BusinessBrainQueryPlan
): Promise<BusinessBrainQueryResult> {
  const service = createBusinessBrainService(supabase);
  await service.getOrCreateBrain(organizationId);

  const include = new Set(queryPlan.includeEntityTypes);
  const omittedCounts: Record<string, number> = {};
  let truncated = false;

  const [products, services, customerSegments, competitors, internalProcesses, knowledgeSources, facts] =
    await Promise.all([
      include.has("products") ? service.listProducts(organizationId) : Promise.resolve([]),
      include.has("services") ? service.listServices(organizationId) : Promise.resolve([]),
      include.has("customerSegments")
        ? service.listCustomerSegments(organizationId)
        : Promise.resolve([]),
      include.has("competitors") ? service.listCompetitors(organizationId) : Promise.resolve([]),
      include.has("internalProcesses")
        ? service.listInternalProcesses(organizationId)
        : Promise.resolve([]),
      include.has("knowledgeSources")
        ? service.listKnowledgeSources(organizationId)
        : Promise.resolve([]),
      include.has("facts") ? service.listFacts(organizationId) : Promise.resolve([]),
    ]);

  const trimmedProducts = trimList(products, queryPlan.productLimit);
  const trimmedServices = trimList(services, queryPlan.serviceLimit);
  const trimmedSegments = trimList(customerSegments, queryPlan.segmentLimit);
  const trimmedCompetitors = trimList(competitors, queryPlan.competitorLimit);
  const trimmedProcesses = trimList(internalProcesses, queryPlan.processLimit);
  const trimmedSources = trimList(knowledgeSources, queryPlan.sourceLimit);
  const rankedFacts = rankFacts(facts, queryPlan.searchTerms);
  const trimmedFacts = trimList(rankedFacts, queryPlan.factLimit);

  for (const [key, count] of [
    ["products", trimmedProducts.omitted],
    ["services", trimmedServices.omitted],
    ["customerSegments", trimmedSegments.omitted],
    ["competitors", trimmedCompetitors.omitted],
    ["internalProcesses", trimmedProcesses.omitted],
    ["knowledgeSources", trimmedSources.omitted],
    ["facts", trimmedFacts.omitted],
  ] as const) {
    if (count > 0) {
      omittedCounts[key] = count;
      truncated = true;
    }
  }

  const slice: BusinessBrainContextSlice = {
    available: true,
    sparse: false,
    products: trimmedProducts.items,
    services: trimmedServices.items,
    customerSegments: trimmedSegments.items,
    competitors: trimmedCompetitors.items,
    internalProcesses: trimmedProcesses.items,
    knowledgeSources: trimmedSources.items,
    facts: trimmedFacts.items,
    truncated,
    omittedCounts: Object.keys(omittedCounts).length > 0 ? omittedCounts : undefined,
  };

  if (isBusinessBrainSparse(slice)) {
    slice.sparse = true;
  }

  return {
    slice,
    queryPlan,
    sources: [
      createSupabaseSource(
        "business_brains",
        organizationId,
        "Business Brain (selective query)"
      ),
    ],
  };
}

export async function loadBusinessBrainContext(
  supabase: AppSupabaseClient,
  organizationId: string,
  role: string,
  taskHint?: string
): Promise<BusinessBrainQueryResult> {
  if (!supabase) {
    return {
      slice: emptyBusinessBrainContextSlice(),
      queryPlan: planBusinessBrainQuery(role, taskHint),
      sources: [
        {
          id: "business-brain:unavailable",
          type: "derived",
          label: "Business Brain unavailable",
          fetchedAt: new Date().toISOString(),
          freshness: "cached",
        },
      ],
    };
  }

  try {
    const queryPlan = planBusinessBrainQuery(role, taskHint);
    return await executeBusinessBrainQuery(supabase, organizationId, queryPlan);
  } catch {
    return {
      slice: emptyBusinessBrainContextSlice(),
      queryPlan: planBusinessBrainQuery(role, taskHint),
      sources: [
        {
          id: "business-brain:error",
          type: "derived",
          label: "Business Brain load failed",
          fetchedAt: new Date().toISOString(),
          freshness: "cached",
        },
      ],
    };
  }
}
