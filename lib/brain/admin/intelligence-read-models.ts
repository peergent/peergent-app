import type { FreshnessState } from "../domain/freshness";

export type CompanyHealthStatus = "ready" | "partial" | "unknown";

export type CompanyHealth = {
  organizationId: string;
  status: CompanyHealthStatus;
  confirmedFieldCount: number;
  unknownFieldCount: number;
  freshness: FreshnessState;
  missingInformation: readonly string[];
  capabilityReadiness: Readonly<Record<string, boolean>>;
  checkedAt: string;
};

export type WebsiteHealthStatus = "available" | "missing" | "stale" | "failed";

export type WebsiteHealth = {
  organizationId: string;
  url: string | null;
  status: WebsiteHealthStatus;
  state: import("../website/states").WebsiteState;
  freshness: FreshnessState;
  findingCount: number;
  issueCount: number;
  checkedAt: string;
};

export type IntelligenceFreshnessReport = {
  organizationId: string;
  companyFreshness: FreshnessState;
  websiteFreshness: FreshnessState;
  brandFreshness: FreshnessState;
  marketFreshness: FreshnessState;
  checkedAt: string;
};

export type CapabilityReadiness = {
  organizationId: string;
  capabilityId: string;
  ready: boolean;
  missingContext: readonly string[];
  checkedAt: string;
};
