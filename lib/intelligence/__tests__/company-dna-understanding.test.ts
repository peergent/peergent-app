import { describe, expect, it } from "vitest";
import { companyDnaToContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { CompanyDna } from "@/lib/company-dna";
import { buildMarketingUnderstanding } from "@/lib/marketing-intelligence/understanding";
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

function savedCompanyDna(overrides: Partial<CompanyDna> = {}): CompanyDna {
  return {
    id: "dna-1",
    organizationId: "org-1",
    mission: "We help growing teams hire AI peers.",
    values: [{ id: "v1", name: "Clarity" }],
    toneOfVoice: { summary: "Confident and helpful", personality: ["Direct"] },
    riskProfile: { summary: "Measured and transparent" },
    decisionPrinciples: [{ id: "p1", name: "Customer first" }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("companyDnaToContextSlice", () => {
  it("preserves saved DNA fields for marketing understanding", () => {
    const slice = companyDnaToContextSlice(savedCompanyDna());

    expect(slice.available).toBe(true);
    expect(slice.mission).toContain("AI peers");
    expect(slice.riskProfile.summary).toContain("Measured");
  });

  it("marks personality-only DNA as available", () => {
    const slice = companyDnaToContextSlice(
      savedCompanyDna({
        mission: undefined,
        values: [],
        toneOfVoice: { personality: ["Bold", "Helpful"] },
        riskProfile: {},
        decisionPrinciples: [],
      })
    );

    expect(slice.available).toBe(true);
  });
});

describe("saved knowledge in understanding response", () => {
  it("reflects saved Company DNA and clears the companyDna gap", () => {
    const understanding = buildMarketingUnderstanding({
      companyDna: companyDnaToContextSlice(savedCompanyDna()),
      businessBrain: emptyBusinessBrainContextSlice(),
      marketingProfile: emptyProfile,
    });

    expect(understanding.brand.mission).toContain("AI peers");
    expect(understanding.gaps).not.toContain("companyDna");
  });
});
