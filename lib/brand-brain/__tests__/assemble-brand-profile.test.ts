import { describe, expect, it } from "vitest";

import {
  assembleBrandProfile,
  BrandProfileOrganizationMismatchError,
} from "../assemble-brand-profile";
import type { BrandProfileSource } from "../brand-profile-source";

const ORG = "org-111";
const ASSEMBLED_AT = "2026-06-01T12:00:00.000Z";

function baseSource(
  overrides: Partial<BrandProfileSource> = {}
): BrandProfileSource {
  return {
    organizationId: ORG,
    assembledAt: ASSEMBLED_AT,
    ...overrides,
  };
}

describe("assembleBrandProfile", () => {
  it("maps full Company DNA and marketing positioning", () => {
    const source = baseSource({
      organizationName: "Acme Co",
      companyDna: {
        id: "dna-1",
        organizationId: ORG,
        mission: "Help teams ship.",
        values: [{ id: "v1", name: "Quality" }],
        toneOfVoice: {
          summary: "Clear and confident",
          personality: ["direct"],
          dos: ["Use active voice"],
          donts: ["Use jargon"],
          examplePhrases: ["Get started today"],
        },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
      },
      marketingProfile: {
        id: "mp-1",
        organizationId: ORG,
        brandPositioning: {
          positioningStatement: "The ops OS for peers.",
          tagline: "Work with your team",
          valueProposition: "Scale without hiring",
          keyMessages: ["AI colleagues", "One workspace"],
          marketCategory: "B2B SaaS",
        },
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
      },
    });

    const result = assembleBrandProfile(source);

    expect(result.profile.organizationId).toBe(ORG);
    expect(result.profile.name).toBe("Acme Co");
    expect(result.profile.id).toBe("dna-1");
    expect(result.profile.status).toBe("active");
    expect(result.profile.updatedAt).toBe("2026-03-01T00:00:00.000Z");

    expect(result.identity.story).toBe("Help teams ship.");
    expect(result.identity.positioningStatement).toBe("The ops OS for peers.");
    expect(result.identity.keyMessages).toEqual(["AI colleagues", "One workspace"]);

    expect(result.voice.summary).toBe("Clear and confident");
    expect(result.voice.personalityTraits).toEqual(["direct"]);
    expect(result.voice.preferredCtaPatterns).toEqual(["Get started today"]);

    expect(result.gaps).not.toContain("identity");
    expect(result.gaps).not.toContain("voice");
    expect(result.gaps).toContain("visual-colors");
    expect(result.gaps).toContain("asset-references");
  });

  it("supports partial Company DNA only", () => {
    const result = assembleBrandProfile(
      baseSource({
        companyDna: {
          id: "dna-2",
          organizationId: ORG,
          mission: "Only mission",
          values: [],
          toneOfVoice: { summary: "Warm" },
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      })
    );

    expect(result.identity.story).toBe("Only mission");
    expect(result.identity.positioningStatement).toBeUndefined();
    expect(result.voice.summary).toBe("Warm");
    expect(result.gaps).not.toContain("voice");
    expect(result.gaps).not.toContain("identity");
  });

  it("enriches identity from marketing positioning", () => {
    const result = assembleBrandProfile(
      baseSource({
        marketingBrandPositioning: {
          tagline: "Built for founders",
          keyMessages: ["Speed"],
        },
      })
    );

    expect(result.identity.tagline).toBe("Built for founders");
    expect(result.identity.keyMessages).toEqual(["Speed"]);
    expect(result.gaps).not.toContain("identity");
  });

  it("uses derived marketing brand as fallback when canonical fields are absent", () => {
    const result = assembleBrandProfile(
      baseSource({
        derivedMarketingBrand: {
          values: [],
          toneOfVoice: {},
          keyMessages: ["Fallback message"],
          tagline: "Fallback tag",
          positioningStatement: "Fallback positioning",
        },
      })
    );

    expect(result.identity.tagline).toBe("Fallback tag");
    expect(result.identity.keyMessages).toEqual(["Fallback message"]);
  });

  it("prefers canonical marketing positioning over derived fallback", () => {
    const result = assembleBrandProfile(
      baseSource({
        marketingBrandPositioning: {
          tagline: "Canonical tag",
          keyMessages: ["Canonical"],
        },
        derivedMarketingBrand: {
          values: [],
          toneOfVoice: {},
          keyMessages: ["Derived"],
          tagline: "Derived tag",
        },
      })
    );

    expect(result.identity.tagline).toBe("Canonical tag");
    expect(result.identity.keyMessages).toEqual(["Canonical"]);
  });

  it("prefers Company DNA tone over derived tone fallback", () => {
    const result = assembleBrandProfile(
      baseSource({
        companyDna: {
          id: "dna-3",
          organizationId: ORG,
          values: [],
          toneOfVoice: { summary: "DNA tone" },
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        derivedMarketingBrand: {
          values: [],
          toneOfVoice: { summary: "Derived tone" },
          keyMessages: [],
        },
      })
    );

    expect(result.voice.summary).toBe("DNA tone");
  });

  it("reports gaps without inventing missing fields", () => {
    const result = assembleBrandProfile(baseSource());

    expect(result.identity.positioningStatement).toBeUndefined();
    expect(result.identity.keyMessages).toEqual([]);
    expect(result.voice.summary).toBeUndefined();
    expect(result.voice.personalityTraits).toEqual([]);
    expect(result.gaps).toContain("identity");
    expect(result.gaps).toContain("voice");
    expect(result.profile.status).toBe("draft");
  });

  it("rejects organization mismatch", () => {
    expect(() =>
      assembleBrandProfile(
        baseSource({
          companyDna: {
            id: "dna-x",
            organizationId: "other-org",
            values: [],
            toneOfVoice: {},
            createdAt: ASSEMBLED_AT,
            updatedAt: ASSEMBLED_AT,
          },
        })
      )
    ).toThrow(BrandProfileOrganizationMismatchError);
  });

  it("does not mutate input objects", () => {
    const source = baseSource({
      companyDna: {
        id: "dna-m",
        organizationId: ORG,
        mission: " Mission ",
        values: [{ id: "v1", name: "Care" }],
        toneOfVoice: {
          personality: [" friendly "],
          dos: [" Be clear "],
        },
        createdAt: ASSEMBLED_AT,
        updatedAt: ASSEMBLED_AT,
      },
      marketingBrandPositioning: {
        keyMessages: [" One "],
        tagline: " Tag ",
      },
    });

    const before = structuredClone(source);
    assembleBrandProfile(source);
    expect(source).toEqual(before);
  });
});
