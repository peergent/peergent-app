import { describe, expect, it } from "vitest";

import { BrandProfileOrganizationMismatchError } from "../errors";
import {
  BrandBrainService,
  createBrandBrainService,
  type BrandBrainServiceReadContext,
} from "../brand-brain-service";
import type {
  BrandBrainOrganization,
  BrandBrainRepository,
} from "../brand-brain-repository";
import {
  BrandBrainInvalidOrganizationIdError,
  BrandBrainOrganizationNotFoundError,
  BrandBrainSourceLoadError,
} from "../errors";
import type {
  BrandProfileSourceCompanyDna,
  BrandProfileSourceMarketingProfile,
} from "../brand-profile-source";

const ORG = "org-aaa";
const READ_CONTEXT: BrandBrainServiceReadContext = {
  assembledAt: "2026-06-15T10:00:00.000Z",
};

function createFakeRepository(
  overrides: Partial<BrandBrainRepository> = {}
): BrandBrainRepository & {
  calls: { organizationId: string; method: string }[];
} {
  const calls: { organizationId: string; method: string }[] = [];

  const organization: BrandBrainOrganization = {
    organizationId: ORG,
    name: "Acme",
  };

  const companyDna: BrandProfileSourceCompanyDna = {
    id: "dna-1",
    organizationId: ORG,
    mission: "Mission",
    values: [],
    toneOfVoice: { summary: "Clear" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  const marketingProfile: BrandProfileSourceMarketingProfile = {
    id: "mp-1",
    organizationId: ORG,
    brandPositioning: {
      tagline: "Tag",
      keyMessages: ["One"],
    },
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-04T00:00:00.000Z",
  };

  return {
    calls,
    getOrganization: overrides.getOrganization ??
      (async (organizationId) => {
        calls.push({ organizationId, method: "getOrganization" });
        return organization.organizationId === organizationId ? organization : null;
      }),
    getCompanyDna: overrides.getCompanyDna ??
      (async (organizationId) => {
        calls.push({ organizationId, method: "getCompanyDna" });
        return companyDna.organizationId === organizationId ? companyDna : null;
      }),
    getMarketingProfile: overrides.getMarketingProfile ??
      (async (organizationId) => {
        calls.push({ organizationId, method: "getMarketingProfile" });
        return marketingProfile.organizationId === organizationId
          ? marketingProfile
          : null;
      }),
  };
}

describe("BrandBrainService", () => {
  it("loads and assembles a full brand profile", async () => {
    const repository = createFakeRepository();
    const service = createBrandBrainService(repository);

    const result = await service.getBrandProfile(ORG, READ_CONTEXT);

    expect(result.profile.organizationId).toBe(ORG);
    expect(result.profile.name).toBe("Acme");
    expect(result.identity.story).toBe("Mission");
    expect(result.identity.tagline).toBe("Tag");
    expect(result.voice.summary).toBe("Clear");
    expect(result.gaps).not.toContain("identity");
  });

  it("returns a partial profile when Company DNA is missing", async () => {
    const repository = createFakeRepository({
      getCompanyDna: async () => null,
    });
    const service = createBrandBrainService(repository);

    const result = await service.getBrandProfile(ORG, READ_CONTEXT);

    expect(result.identity.tagline).toBe("Tag");
    expect(result.identity.story).toBeUndefined();
    expect(result.voice.summary).toBeUndefined();
    expect(result.gaps).toContain("voice");
  });

  it("returns a partial profile when marketing profile is missing", async () => {
    const repository = createFakeRepository({
      getMarketingProfile: async () => null,
    });
    const service = createBrandBrainService(repository);

    const result = await service.getBrandProfile(ORG, READ_CONTEXT);

    expect(result.identity.story).toBe("Mission");
    expect(result.identity.tagline).toBeUndefined();
    expect(result.gaps).not.toContain("voice");
  });

  it("returns gaps when both optional sources are missing but organization exists", async () => {
    const repository = createFakeRepository({
      getCompanyDna: async () => null,
      getMarketingProfile: async () => null,
    });
    const service = createBrandBrainService(repository);

    const result = await service.getBrandProfile(ORG, READ_CONTEXT);

    expect(result.profile.name).toBe("Acme");
    expect(result.profile.status).toBe("draft");
    expect(result.gaps).toContain("identity");
    expect(result.gaps).toContain("voice");
  });

  it("rejects an invalid organization id", async () => {
    const service = createBrandBrainService(createFakeRepository());

    await expect(service.getBrandProfile("  ", READ_CONTEXT)).rejects.toBeInstanceOf(
      BrandBrainInvalidOrganizationIdError
    );
  });

  it("rejects a missing or inaccessible organization", async () => {
    const repository = createFakeRepository({
      getOrganization: async () => null,
    });
    const service = createBrandBrainService(repository);

    await expect(service.getBrandProfile(ORG, READ_CONTEXT)).rejects.toBeInstanceOf(
      BrandBrainOrganizationNotFoundError
    );
  });

  it("translates repository failures into typed source load errors", async () => {
    const repository = createFakeRepository({
      getCompanyDna: async () => {
        throw new Error("supabase down");
      },
    });
    const service = createBrandBrainService(repository);

    try {
      await service.getBrandProfile(ORG, READ_CONTEXT);
      expect.unreachable("Expected BrandBrainSourceLoadError");
    } catch (error) {
      expect(error).toBeInstanceOf(BrandBrainSourceLoadError);
      expect((error as Error).message).not.toMatch(/supabase down/);
    }
  });

  it("rejects organization mismatch from assembled sources", async () => {
    const repository = createFakeRepository({
      getCompanyDna: async (organizationId) => ({
        id: "dna-bad",
        organizationId: "other-org",
        values: [],
        toneOfVoice: {},
        createdAt: READ_CONTEXT.assembledAt,
        updatedAt: READ_CONTEXT.assembledAt,
      }),
    });
    const service = createBrandBrainService(repository);

    await expect(service.getBrandProfile(ORG, READ_CONTEXT)).rejects.toBeInstanceOf(
      BrandProfileOrganizationMismatchError
    );
  });

  it("scopes repository calls to the requested organization id", async () => {
    const repository = createFakeRepository();
    const service = createBrandBrainService(repository);

    await service.getBrandProfile(ORG, READ_CONTEXT);

    for (const call of repository.calls) {
      expect(call.organizationId).toBe(ORG);
    }
    expect(repository.calls.some((c) => c.method === "getOrganization")).toBe(true);
    expect(repository.calls.some((c) => c.method === "getCompanyDna")).toBe(true);
    expect(repository.calls.some((c) => c.method === "getMarketingProfile")).toBe(true);
  });

  it("does not mutate repository return values", async () => {
    const companyDna: BrandProfileSourceCompanyDna = {
      id: "dna-m",
      organizationId: ORG,
      values: [{ id: "v1", name: "Care" }],
      toneOfVoice: { personality: ["warm"] },
      createdAt: READ_CONTEXT.assembledAt,
      updatedAt: READ_CONTEXT.assembledAt,
    };
    const marketingProfile: BrandProfileSourceMarketingProfile = {
      id: "mp-m",
      organizationId: ORG,
      brandPositioning: { keyMessages: ["Stay"] },
      createdAt: READ_CONTEXT.assembledAt,
      updatedAt: READ_CONTEXT.assembledAt,
    };

    const repository = createFakeRepository({
      getCompanyDna: async () => companyDna,
      getMarketingProfile: async () => marketingProfile,
    });
    const service = new BrandBrainService(repository);

    const dnaBefore = structuredClone(companyDna);
    const marketingBefore = structuredClone(marketingProfile);

    await service.getBrandProfile(ORG, READ_CONTEXT);

    expect(companyDna).toEqual(dnaBefore);
    expect(marketingProfile).toEqual(marketingBefore);
  });
});
