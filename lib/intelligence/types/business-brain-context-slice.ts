import type {
  BrainService,
  BusinessBrainProduct,
  BusinessFact,
  Competitor,
  CustomerSegment,
  InternalProcess,
  KnowledgeSource,
} from "@/lib/business-brain";

/** Engine-facing projection of selective Business Brain retrieval. */
export type BusinessBrainContextSlice = {
  available: boolean;
  sparse?: boolean;
  products: BusinessBrainProduct[];
  services: BrainService[];
  customerSegments: CustomerSegment[];
  competitors: Competitor[];
  internalProcesses: InternalProcess[];
  knowledgeSources: KnowledgeSource[];
  facts: BusinessFact[];
  truncated?: boolean;
  omittedCounts?: Partial<Record<string, number>>;
};

export function emptyBusinessBrainContextSlice(): BusinessBrainContextSlice {
  return {
    available: false,
    products: [],
    services: [],
    customerSegments: [],
    competitors: [],
    internalProcesses: [],
    knowledgeSources: [],
    facts: [],
  };
}

export function isBusinessBrainSparse(slice: BusinessBrainContextSlice): boolean {
  return (
    slice.products.length === 0 &&
    slice.services.length === 0 &&
    slice.customerSegments.length === 0 &&
    slice.competitors.length === 0 &&
    slice.internalProcesses.length === 0 &&
    slice.knowledgeSources.length === 0 &&
    slice.facts.length === 0
  );
}

/** Maps a full Business Brain aggregate into the understanding context slice. */
export function businessBrainAggregateToContextSlice(
  aggregate: import("@/lib/business-brain").BusinessBrainAggregate
): BusinessBrainContextSlice {
  const slice: BusinessBrainContextSlice = {
    available: true,
    products: aggregate.products,
    services: aggregate.services,
    customerSegments: aggregate.customerSegments,
    competitors: aggregate.competitors,
    internalProcesses: aggregate.internalProcesses,
    knowledgeSources: aggregate.knowledgeSources,
    facts: aggregate.facts,
  };

  if (isBusinessBrainSparse(slice)) {
    slice.sparse = true;
  }

  return slice;
}
