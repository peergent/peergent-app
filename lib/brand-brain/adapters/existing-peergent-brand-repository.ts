import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { CompanyDnaRepository } from "@/lib/company-dna/repositories";
import { MarketingProfileRepository } from "@/lib/marketing-intelligence/repositories";
import type { CompanyDna } from "@/lib/company-dna";
import type { MarketingProfile } from "@/lib/marketing-intelligence/types/entities";

import type {
  BrandBrainOrganization,
  BrandBrainRepository,
} from "../brand-brain-repository";
import { BrandBrainSourceLoadError } from "../errors";
import type {
  BrandProfileSourceCompanyDna,
  BrandProfileSourceMarketingProfile,
} from "../brand-profile-source";

function toCompanyDnaSource(dna: CompanyDna): BrandProfileSourceCompanyDna {
  return {
    id: dna.id,
    organizationId: dna.organizationId,
    mission: dna.mission,
    values: dna.values,
    toneOfVoice: dna.toneOfVoice,
    createdAt: dna.createdAt,
    updatedAt: dna.updatedAt,
  };
}

function toMarketingProfileSource(
  profile: MarketingProfile
): BrandProfileSourceMarketingProfile {
  return {
    id: profile.id,
    organizationId: profile.organizationId,
    brandPositioning: profile.brandPositioning,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Read-only adapter over existing Peergent repositories (Company DNA, marketing profile, organizations).
 * Does not call getOrCreate or any write path.
 */
export class ExistingPeergentBrandRepository implements BrandBrainRepository {
  private readonly companyDnaRepository: CompanyDnaRepository;
  private readonly marketingProfileRepository: MarketingProfileRepository;

  constructor(private readonly supabase: AppSupabaseClient) {
    this.companyDnaRepository = new CompanyDnaRepository(supabase);
    this.marketingProfileRepository = new MarketingProfileRepository(supabase);
  }

  async getOrganization(
    organizationId: string
  ): Promise<BrandBrainOrganization | null> {
    try {
      const { data, error } = await this.supabase
        .from("organizations")
        .select("id, name")
        .eq("id", organizationId)
        .maybeSingle();

      if (error) {
        throw new BrandBrainSourceLoadError("organization", organizationId, error);
      }

      if (!data) {
        return null;
      }

      return {
        organizationId: data.id,
        name: data.name,
      };
    } catch (error) {
      if (error instanceof BrandBrainSourceLoadError) {
        throw error;
      }
      throw new BrandBrainSourceLoadError("organization", organizationId, error);
    }
  }

  async getCompanyDna(
    organizationId: string
  ): Promise<BrandProfileSourceCompanyDna | null> {
    try {
      const dna =
        await this.companyDnaRepository.findByOrganizationId(organizationId);
      return dna ? toCompanyDnaSource(dna) : null;
    } catch (error) {
      throw new BrandBrainSourceLoadError("Company DNA", organizationId, error);
    }
  }

  async getMarketingProfile(
    organizationId: string
  ): Promise<BrandProfileSourceMarketingProfile | null> {
    try {
      const profile =
        await this.marketingProfileRepository.findByOrganizationId(
          organizationId
        );
      return profile ? toMarketingProfileSource(profile) : null;
    } catch (error) {
      throw new BrandBrainSourceLoadError(
        "marketing profile",
        organizationId,
        error
      );
    }
  }
}

export function createExistingPeergentBrandRepository(
  supabase: AppSupabaseClient
): ExistingPeergentBrandRepository {
  return new ExistingPeergentBrandRepository(supabase);
}
