import type {
  BrandProfileSourceCompanyDna,
  BrandProfileSourceMarketingProfile,
} from "./brand-profile-source";

export type BrandBrainOrganization = {
  readonly organizationId: string;
  readonly name: string;
};

/**
 * Read-only persistence boundary for Brand Brain assembly.
 * Implementations must scope every query to the requested organization id.
 */
export interface BrandBrainRepository {
  getOrganization(organizationId: string): Promise<BrandBrainOrganization | null>;
  getCompanyDna(
    organizationId: string
  ): Promise<BrandProfileSourceCompanyDna | null>;
  getMarketingProfile(
    organizationId: string
  ): Promise<BrandProfileSourceMarketingProfile | null>;
}
