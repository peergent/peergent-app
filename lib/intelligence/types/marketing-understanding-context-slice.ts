import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";

/** Engine-facing projection of Marketing Understanding — peer-specific intelligence. */
export type MarketingUnderstandingContextSlice = MarketingUnderstanding & {
  /** True when assembled for a Marketing peer; false for other roles. */
  roleApplicable: boolean;
};

export function emptyMarketingUnderstandingContextSlice(): MarketingUnderstandingContextSlice {
  return {
    roleApplicable: false,
    available: false,
    sparse: true,
    completeness: 0,
    gaps: [
      "companyDna",
      "brandPositioning",
      "products",
      "services",
      "customerSegments",
      "competitors",
      "goals",
      "existingContent",
    ],
    brand: {
      values: [],
      toneOfVoice: {},
      keyMessages: [],
    },
    products: [],
    services: [],
    customerSegments: [],
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt: new Date().toISOString(),
  };
}

export function toMarketingUnderstandingContextSlice(
  understanding: MarketingUnderstanding
): MarketingUnderstandingContextSlice {
  return {
    ...understanding,
    roleApplicable: true,
  };
}
