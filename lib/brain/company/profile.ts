import type { FreshnessMetadata } from "../domain/freshness";
import type { CompanyProfileField } from "./source-priority";

/** Canonical organization-level company profile — not campaign-specific. */
export type CompanyProfile = {
  organizationId: string;
  companyName: CompanyProfileField;
  industry: CompanyProfileField;
  website: CompanyProfileField;
  products: CompanyProfileField<readonly string[]>;
  services: CompanyProfileField<readonly string[]>;
  markets: CompanyProfileField<readonly string[]>;
  targetAudiences: CompanyProfileField<readonly string[]>;
  uniqueSellingPoints: CompanyProfileField<readonly string[]>;
  positioning: CompanyProfileField;
  tone: CompanyProfileField;
  businessModel: CompanyProfileField;
  regions: CompanyProfileField<readonly string[]>;
  languages: CompanyProfileField<readonly string[]>;
  mission: CompanyProfileField;
  vision: CompanyProfileField;
  customerTypes: CompanyProfileField<readonly string[]>;
  typicalCustomerSize: CompanyProfileField;
  salesProcess: CompanyProfileField;
  mainCompetitors: CompanyProfileField<readonly string[]>;
  brandPromises: CompanyProfileField<readonly string[]>;
  pricingStyle: CompanyProfileField;
  goals: CompanyProfileField<readonly string[]>;
  knownLimitations: CompanyProfileField<readonly string[]>;
  assumptions: CompanyProfileField<readonly string[]>;
  unknowns: readonly string[];
  metadata: FreshnessMetadata;
};

export function emptyCompanyProfile(organizationId: string): CompanyProfile {
  const empty = () => ({
    value: null,
    source: "unknown" as const,
    confidence: "low" as const,
    lastUpdatedAt: null,
    freshness: "unknown" as const,
    customerConfirmed: false,
  });
  const emptyList = () => ({ ...empty(), value: [] as readonly string[] });

  return {
    organizationId,
    companyName: empty(),
    industry: empty(),
    website: empty(),
    products: emptyList(),
    services: emptyList(),
    markets: emptyList(),
    targetAudiences: emptyList(),
    uniqueSellingPoints: emptyList(),
    positioning: empty(),
    tone: empty(),
    businessModel: empty(),
    regions: emptyList(),
    languages: emptyList(),
    mission: empty(),
    vision: empty(),
    customerTypes: emptyList(),
    typicalCustomerSize: empty(),
    salesProcess: empty(),
    mainCompetitors: emptyList(),
    brandPromises: emptyList(),
    pricingStyle: empty(),
    goals: emptyList(),
    knownLimitations: emptyList(),
    assumptions: emptyList(),
    unknowns: [],
    metadata: { freshness: "unknown", lastUpdatedAt: null },
  };
}
