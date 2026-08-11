/**
 * Research Brain — provider abstraction.
 * Brain orchestrates evidence; provider adapters retrieve it.
 */

import type { CompanyGraph } from "../company/types";
import type {
  ResearchBudgetState,
  ResearchDomainId,
  ResearchSourceType,
} from "./brain-types";

export type ResearchProviderCapability =
  | "searchWeb"
  | "fetchWebsite"
  | "crawlWebsite"
  | "searchCompetitors"
  | "fetchReviews"
  | "searchAds"
  | "searchKeywords"
  | "fetchMarketSignals";

export type ResearchProviderCapabilities = {
  readonly providerId: string;
  readonly capabilities: readonly ResearchProviderCapability[];
};

export type ResearchSearchRequest = {
  readonly query: string;
  readonly domain: ResearchDomainId;
  readonly limit: number;
  readonly organizationId: string;
};

export type ResearchFetchRequest = {
  readonly url: string;
  readonly domain: ResearchDomainId;
  readonly organizationId: string;
};

export type ResearchProviderEvidenceItem = {
  readonly sourceType: ResearchSourceType;
  readonly identity: string;
  readonly url: string | null;
  readonly label: string;
  readonly rawExcerpt: string;
  readonly normalizedSummary: string;
  readonly directEvidence: boolean;
  readonly capturedAt: string;
};

export type ResearchProviderResult = {
  readonly providerId: string;
  readonly capability: ResearchProviderCapability;
  readonly success: boolean;
  readonly items: readonly ResearchProviderEvidenceItem[];
  readonly requestsUsed: number;
  readonly pagesUsed: number;
  readonly costUsed: number;
  readonly errorCode: string | null;
};

export type ResearchProviderContext = {
  readonly companyGraph: CompanyGraph;
  readonly organizationId: string;
  readonly budgetState: ResearchBudgetState;
};

/** Provider contract — no scraping logic in Brain core. */
export type ResearchProvider = {
  readonly id: string;
  readonly capabilities: ResearchProviderCapabilities;
  search?(request: ResearchSearchRequest, ctx: ResearchProviderContext): Promise<ResearchProviderResult>;
  fetch?(request: ResearchFetchRequest, ctx: ResearchProviderContext): Promise<ResearchProviderResult>;
  extract?(input: {
    contentRef: string;
    domain: ResearchDomainId;
    ctx: ResearchProviderContext;
  }): Promise<ResearchProviderResult>;
  snapshot?(input: {
    target: string;
    domain: ResearchDomainId;
    ctx: ResearchProviderContext;
  }): Promise<ResearchProviderResult>;
};

export function providerSupports(
  provider: ResearchProvider,
  capability: ResearchProviderCapability
): boolean {
  return provider.capabilities.capabilities.includes(capability);
}

export function rejectUnsupportedCapability(
  providerId: string,
  capability: ResearchProviderCapability
): ResearchProviderResult {
  return {
    providerId,
    capability,
    success: false,
    items: [],
    requestsUsed: 0,
    pagesUsed: 0,
    costUsed: 0,
    errorCode: "capability_not_supported",
  };
}
