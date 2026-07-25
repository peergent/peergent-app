import { describe, expect, it } from "vitest";
import { parseBrandPositioning } from "@/lib/marketing-intelligence/repositories/mappers";
import { buildMarketingUnderstanding } from "@/lib/marketing-intelligence/understanding";
import { emptyCompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import { emptyBusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { MarketingProfileAggregate } from "@/lib/marketing-intelligence";

const emptyProfile: MarketingProfileAggregate = {
  id: "profile-1",
  organizationId: "org-1",
  brandPositioning: { keyMessages: [] },
  goals: [],
  contentItems: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("parseBrandPositioning", () => {
  it("reads camelCase keys saved by the Knowledge UI", () => {
    const parsed = parseBrandPositioning({
      positioningStatement: "AI employees for growing teams",
      valueProposition: "Hire peers, not more tools",
      keyMessages: ["Fast setup"],
    });

    expect(parsed.positioningStatement).toContain("AI employees");
    expect(parsed.keyMessages).toEqual(["Fast setup"]);
  });

  it("reads snake_case keys from legacy jsonb payloads", () => {
    const parsed = parseBrandPositioning({
      positioning_statement: "Category leader in AI staffing",
      value_proposition: "Peers that work like teammates",
      key_messages: "Always on brand, Ship faster",
      market_category: "AI workforce platform",
    });

    expect(parsed.positioningStatement).toContain("Category leader");
    expect(parsed.valueProposition).toContain("teammates");
    expect(parsed.keyMessages).toEqual(["Always on brand", "Ship faster"]);
    expect(parsed.marketCategory).toBe("AI workforce platform");
  });

  it("unwraps nested brand positioning objects", () => {
    const parsed = parseBrandPositioning({
      brandPositioning: {
        tagline: "Your AI team",
      },
    });

    expect(parsed.tagline).toBe("Your AI team");
  });
});

describe("saved brand positioning in understanding", () => {
  it("clears the brandPositioning gap when parsed profile fields are present", () => {
    const profile: MarketingProfileAggregate = {
      ...emptyProfile,
      brandPositioning: parseBrandPositioning({
        positioning_statement: "Saved positioning from Knowledge",
      }),
    };

    const understanding = buildMarketingUnderstanding({
      companyDna: emptyCompanyDnaContextSlice(),
      businessBrain: emptyBusinessBrainContextSlice(),
      marketingProfile: profile,
    });

    expect(understanding.gaps).not.toContain("brandPositioning");
    expect(understanding.brand.positioningStatement).toContain("Saved positioning");
  });
});
