import type { BusinessBrainAggregate } from "@/lib/business-brain";
import type { CompanyDna } from "@/lib/company-dna";
import type { BuildContextRequest, ContextScope } from "@/lib/context-engine/types";
import type { SourceRef } from "@/lib/context-engine/types/sources";
import type { BusinessBrainContextSlice } from "./types/business-brain-context-slice";
import type { BusinessBrainEntityType, BusinessBrainQueryPlan } from "./types/business-brain-query";
import type { CompanyDnaContextSlice } from "./types/company-dna-context-slice";
import type { BrandBrainContextSlice } from "./types/brand-brain-context-slice";
import type { MarketingUnderstandingContextSlice } from "./types/marketing-understanding-context-slice";

/** Combined org intelligence snapshot for downstream modules. */
export type OrgIntelligenceSnapshot = {
  companyDna: CompanyDna;
  businessBrain: BusinessBrainAggregate;
};

/** Model-agnostic context contract produced by Context Engine v2. */
export type ContextPackage = {
  version: "2.0";
  traceId: string;
  scope: ContextScope;
  taskHint?: string;
  slices: {
    identity?: unknown;
    organization?: unknown;
    objective?: unknown;
    policy?: unknown;
    companyDna?: CompanyDnaContextSlice;
    businessBrain?: BusinessBrainContextSlice;
    marketingUnderstanding?: MarketingUnderstandingContextSlice;
    brandBrain?: BrandBrainContextSlice;
    peerType?: unknown;
    knowledge?: unknown;
    memory?: unknown;
    tools?: unknown;
  };
  retrieval?: {
    businessBrainQueryPlan?: BusinessBrainQueryPlan;
    truncated?: boolean;
  };
  meta: {
    completeness: number;
    loadedLayers: string[];
    missingLayers: string[];
    warnings: string[];
    sources: SourceRef[];
    assembledAt: string;
    cacheHits: string[];
  };
};

export type BuildContextInput = BuildContextRequest;

export type { AppSupabaseClient, AuthenticatedOrgContext } from "./api/org-context";
export {
  getAuthenticatedOrgContext,
  handleDomainError,
  isAuthContext,
  parseJsonBody,
} from "./api/org-context";

export type {
  BusinessBrainContextSlice,
  BusinessBrainEntityType,
  BusinessBrainQueryPlan,
  CompanyDnaContextSlice,
  MarketingUnderstandingContextSlice,
  BrandBrainContextSlice,
};

export {
  loadCompanyDnaContext,
  loadBrandBrainContext,
  loadBusinessBrainContext,
  loadMarketingUnderstandingContext,
  executeBusinessBrainQuery,
  planBusinessBrainQuery,
} from "./adapters";
