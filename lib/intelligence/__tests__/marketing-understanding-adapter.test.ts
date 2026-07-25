import { describe, expect, it, vi } from "vitest";
import { loadMarketingUnderstandingContext } from "@/lib/intelligence/adapters/marketing-understanding-adapter";
import { companyDnaToContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { CompanyDna } from "@/lib/company-dna";
import type { BusinessBrainAggregate } from "@/lib/business-brain";
import type { MarketingProfileAggregate } from "@/lib/marketing-intelligence";

const supabase = {} as never;

const companyDna: CompanyDna = {
  id: "dna-1",
  organizationId: "org-1",
  mission: "Help teams grow",
  values: [{ id: "v1", name: "Clarity" }],
  toneOfVoice: { summary: "Confident" },
  riskProfile: {},
  decisionPrinciples: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const marketingProfile: MarketingProfileAggregate = {
  id: "profile-1",
  organizationId: "org-1",
  brandPositioning: {
    positioningStatement: "Saved positioning",
    keyMessages: ["On-brand messaging"],
  },
  goals: [
    {
      id: "goal-1",
      marketingProfileId: "profile-1",
      title: "Grow inbound leads",
      status: "active",
      priority: 1,
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  contentItems: [
    {
      id: "content-1",
      marketingProfileId: "profile-1",
      title: "Customer story",
      contentType: "case_study",
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const businessBrain: BusinessBrainAggregate = {
  id: "bb-1",
  organizationId: "org-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  products: [],
  services: [],
  customerSegments: [],
  competitors: [
    {
      id: "comp-1",
      businessBrainId: "bb-1",
      name: "Acme AI",
      strengths: [],
      weaknesses: [],
      differentiators: ["Legacy tooling"],
      metadata: {},
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  internalProcesses: [],
  knowledgeSources: [],
  facts: [],
};

vi.mock("@/lib/company-dna", () => ({
  createCompanyDnaService: () => ({
    getOrCreate: vi.fn(async () => companyDna),
  }),
}));

vi.mock("@/lib/business-brain", () => ({
  createBusinessBrainService: () => ({
    getAggregate: vi.fn(async () => businessBrain),
  }),
}));

vi.mock("@/lib/marketing-intelligence", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/marketing-intelligence")>();
  return {
    ...actual,
    createMarketingIntelligenceService: () => ({
      getAggregate: vi.fn(async () => marketingProfile),
    }),
  };
});

describe("loadMarketingUnderstandingContext", () => {
  it("consumes saved knowledge aggregates and clears populated gaps", async () => {
    const { slice } = await loadMarketingUnderstandingContext(
      supabase,
      "org-1",
      "Marketing"
    );

    expect(slice.brand.positioningStatement).toContain("Saved positioning");
    expect(slice.competitors).toHaveLength(1);
    expect(slice.goals).toHaveLength(1);
    expect(slice.existingContent).toHaveLength(1);
    expect(slice.gaps).not.toContain("brandPositioning");
    expect(slice.gaps).not.toContain("competitors");
    expect(slice.gaps).not.toContain("goals");
    expect(slice.gaps).not.toContain("existingContent");
    expect(slice.gaps).toContain("products");
    expect(companyDnaToContextSlice(companyDna).mission).toContain("Help teams grow");
  });
});
