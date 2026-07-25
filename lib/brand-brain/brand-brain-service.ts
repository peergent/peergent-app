import {
  assembleBrandProfile,
  type AssembledBrandProfile,
} from "./assemble-brand-profile";
import type { BrandBrainRepository } from "./brand-brain-repository";
import type { BrandProfileSource } from "./brand-profile-source";
import {
  BrandBrainInvalidOrganizationIdError,
  BrandBrainOrganizationNotFoundError,
  BrandBrainSourceLoadError,
} from "./errors";

export type BrandBrainServiceReadContext = {
  /** ISO timestamp supplied by caller; avoids implicit clock reads in tests. */
  readonly assembledAt: string;
};

function normalizeOrganizationId(organizationId: string): string {
  return organizationId.trim();
}

function assertOrganizationId(organizationId: string): string {
  const normalized = normalizeOrganizationId(organizationId);
  if (!normalized) {
    throw new BrandBrainInvalidOrganizationIdError();
  }
  return normalized;
}

/**
 * Read-only Brand Brain service. Loads existing org-scoped sources and assembles
 * the canonical Brand Brain read model.
 */
export class BrandBrainService {
  constructor(private readonly repository: BrandBrainRepository) {}

  async getBrandProfile(
    organizationId: string,
    context: BrandBrainServiceReadContext
  ): Promise<AssembledBrandProfile> {
    const orgId = assertOrganizationId(organizationId);

    const organization = await this.loadOrganization(orgId);
    const [companyDna, marketingProfile] = await Promise.all([
      this.loadCompanyDna(orgId),
      this.loadMarketingProfile(orgId),
    ]);

    const source: BrandProfileSource = {
      organizationId: orgId,
      organizationName: organization.name,
      companyDna,
      marketingProfile,
      assembledAt: context.assembledAt,
    };

    return assembleBrandProfile(source);
  }

  private async loadOrganization(orgId: string) {
    let organization;
    try {
      organization = await this.repository.getOrganization(orgId);
    } catch (error) {
      if (error instanceof BrandBrainSourceLoadError) {
        throw error;
      }
      throw new BrandBrainSourceLoadError("organization", orgId, error);
    }

    if (!organization) {
      throw new BrandBrainOrganizationNotFoundError(orgId);
    }

    if (organization.organizationId !== orgId) {
      throw new BrandBrainSourceLoadError("organization", orgId);
    }

    return organization;
  }

  private async loadCompanyDna(orgId: string) {
    try {
      return await this.repository.getCompanyDna(orgId);
    } catch (error) {
      if (error instanceof BrandBrainSourceLoadError) {
        throw error;
      }
      throw new BrandBrainSourceLoadError("Company DNA", orgId, error);
    }
  }

  private async loadMarketingProfile(orgId: string) {
    try {
      return await this.repository.getMarketingProfile(orgId);
    } catch (error) {
      if (error instanceof BrandBrainSourceLoadError) {
        throw error;
      }
      throw new BrandBrainSourceLoadError("marketing profile", orgId, error);
    }
  }
}

export function createBrandBrainService(
  repository: BrandBrainRepository
): BrandBrainService {
  return new BrandBrainService(repository);
}
