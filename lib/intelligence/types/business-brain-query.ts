export type BusinessBrainEntityType =
  | "products"
  | "services"
  | "customerSegments"
  | "competitors"
  | "internalProcesses"
  | "knowledgeSources"
  | "facts";

export type BusinessBrainQueryPlan = {
  includeEntityTypes: BusinessBrainEntityType[];
  productLimit: number;
  serviceLimit: number;
  segmentLimit: number;
  competitorLimit: number;
  processLimit: number;
  sourceLimit: number;
  factLimit: number;
  searchTerms: string[];
};

export const DEFAULT_QUERY_PLAN: BusinessBrainQueryPlan = {
  includeEntityTypes: [
    "products",
    "services",
    "customerSegments",
    "competitors",
    "facts",
  ],
  productLimit: 5,
  serviceLimit: 5,
  segmentLimit: 3,
  competitorLimit: 5,
  processLimit: 5,
  sourceLimit: 5,
  factLimit: 20,
  searchTerms: [],
};
