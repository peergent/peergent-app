import type { CompanyDna } from "@/lib/company-dna";
import type { BrandPositioning, MarketingProfile } from "@/lib/marketing-intelligence/types/entities";
import type { MarketingBrandUnderstanding } from "@/lib/marketing-intelligence/types/understanding";

/**
 * Read-only inputs for the Brand Brain compatibility assembler.
 *
 * Company DNA and marketing_profiles remain the storage owners; this type only
 * describes data already loaded by callers (repositories, adapters, tests).
 */
export type BrandProfileSourceCompanyDna = Pick<
  CompanyDna,
  | "id"
  | "organizationId"
  | "mission"
  | "values"
  | "toneOfVoice"
  | "createdAt"
  | "updatedAt"
>;

export type BrandProfileSourceMarketingProfile = Pick<
  MarketingProfile,
  "id" | "organizationId" | "brandPositioning" | "createdAt" | "updatedAt"
>;

/**
 * Optional derived Marketing Understanding brand slice — fallback only;
 * canonical fields come from Company DNA and marketing brand positioning.
 */
export type BrandProfileSourceDerivedBrand = MarketingBrandUnderstanding;

export type BrandProfileSource = {
  readonly organizationId: string;
  /** Display name for the brand profile shell when known (e.g. organizations.name). */
  readonly organizationName?: string;
  readonly companyDna?: BrandProfileSourceCompanyDna | null;
  readonly marketingProfile?: BrandProfileSourceMarketingProfile | null;
  /** Shorthand when only positioning JSON is available without profile metadata. */
  readonly marketingBrandPositioning?: BrandPositioning | null;
  readonly derivedMarketingBrand?: BrandProfileSourceDerivedBrand | null;
  /**
   * Timestamps for the assembled profile shell when persisted updated_at is unavailable.
   * Must be supplied by the caller; the assembler does not read the clock.
   */
  readonly assembledAt: string;
};
