import { describe, expect, it } from "vitest";
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

describe("buildMarketingUnderstanding", () => {
  it("returns empty understanding when all inputs are sparse", () => {
    const result = buildMarketingUnderstanding({
      companyDna: emptyCompanyDnaContextSlice(),
      businessBrain: emptyBusinessBrainContextSlice(),
      marketingProfile: emptyProfile,
    });

    expect(result.available).toBe(false);
    expect(result.completeness).toBe(0);
    expect(result.gaps).toHaveLength(8);
    expect(result.sparse).toBe(true);
  });

  it("scores completeness across all marketing dimensions", () => {
    const result = buildMarketingUnderstanding({
      companyDna: {
        available: true,
        mission: "Help teams grow",
        values: [{ id: "v1", name: "Clarity" }],
        toneOfVoice: { summary: "Confident and helpful" },
        riskProfile: {},
        decisionPrinciples: [],
      },
      businessBrain: {
        available: true,
        products: [
          {
            id: "p1",
            businessBrainId: "bb1",
            name: "Platform",
            metadata: {},
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
        services: [
          {
            id: "s1",
            businessBrainId: "bb1",
            name: "Onboarding",
            metadata: {},
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
        customerSegments: [
          {
            id: "seg1",
            businessBrainId: "bb1",
            name: "SMB founders",
            segments: [],
            painPoints: ["Limited time"],
            buyingTriggers: ["Growth pressure"],
            metadata: {},
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
        competitors: [
          {
            id: "c1",
            businessBrainId: "bb1",
            name: "Rival Co",
            strengths: [],
            weaknesses: [],
            differentiators: ["Faster setup"],
            metadata: {},
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
        internalProcesses: [],
        knowledgeSources: [],
        facts: [],
      },
      marketingProfile: {
        ...emptyProfile,
        brandPositioning: {
          positioningStatement: "The AI employee platform for growing teams",
          keyMessages: ["Hire AI peers, not more tools"],
        },
        goals: [
          {
            id: "g1",
            marketingProfileId: "profile-1",
            title: "Increase inbound leads",
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
            title: "Launch blog post",
            contentType: "blog_post",
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
    });

    expect(result.available).toBe(true);
    expect(result.completeness).toBe(100);
    expect(result.gaps).toHaveLength(0);
    expect(result.sparse).toBe(false);
    expect(result.brand.positioningStatement).toContain("AI employee");
    expect(result.products).toHaveLength(1);
    expect(result.goals[0]?.title).toBe("Increase inbound leads");
    expect(result.existingContent[0]?.contentType).toBe("blog_post");
  });

  it("clears companyDna gap when only decision principles are saved", () => {
    const result = buildMarketingUnderstanding({
      companyDna: {
        available: true,
        values: [],
        toneOfVoice: {},
        riskProfile: {},
        decisionPrinciples: [{ id: "p1", name: "Customer first" }],
      },
      businessBrain: emptyBusinessBrainContextSlice(),
      marketingProfile: emptyProfile,
    });

    expect(result.gaps).not.toContain("companyDna");
    expect(result.completeness).toBeGreaterThan(0);
  });

  it("clears gaps incrementally as knowledge dimensions are filled", () => {
    const companyDna = {
      available: true,
      mission: "Help teams grow",
      values: [{ id: "v1", name: "Clarity" }],
      toneOfVoice: { summary: "Confident" },
      riskProfile: {},
      decisionPrinciples: [],
    };

    const businessBrain = {
      ...emptyBusinessBrainContextSlice(),
      available: true,
      products: [
        {
          id: "p1",
          businessBrainId: "bb1",
          name: "Platform",
          metadata: {},
          sortOrder: 0,
          createdAt: "",
          updatedAt: "",
        },
      ],
      services: [
        {
          id: "s1",
          businessBrainId: "bb1",
          name: "Onboarding",
          metadata: {},
          sortOrder: 0,
          createdAt: "",
          updatedAt: "",
        },
      ],
      customerSegments: [
        {
          id: "seg1",
          businessBrainId: "bb1",
          name: "SMB founders",
          segments: [],
          painPoints: [],
          buyingTriggers: [],
          metadata: {},
          sortOrder: 0,
          createdAt: "",
          updatedAt: "",
        },
      ],
    };

    const afterKnowledgeSave = buildMarketingUnderstanding({
      companyDna,
      businessBrain,
      marketingProfile: emptyProfile,
    });

    expect(afterKnowledgeSave.gaps).not.toContain("companyDna");
    expect(afterKnowledgeSave.gaps).not.toContain("products");
    expect(afterKnowledgeSave.gaps).not.toContain("services");
    expect(afterKnowledgeSave.gaps).not.toContain("customerSegments");
    expect(afterKnowledgeSave.brand.mission).toBe("Help teams grow");
    expect(afterKnowledgeSave.products).toHaveLength(1);
  });

  it("clears brandPositioning gap when positioning is saved", () => {
    const result = buildMarketingUnderstanding({
      companyDna: emptyCompanyDnaContextSlice(),
      businessBrain: emptyBusinessBrainContextSlice(),
      marketingProfile: {
        ...emptyProfile,
        brandPositioning: {
          positioningStatement: "The AI employee platform for growing teams",
          keyMessages: [],
        },
      },
    });

    expect(result.gaps).not.toContain("brandPositioning");
  });

  it("clears competitors gap when at least one competitor exists", () => {
    const result = buildMarketingUnderstanding({
      companyDna: emptyCompanyDnaContextSlice(),
      businessBrain: {
        ...emptyBusinessBrainContextSlice(),
        available: true,
        competitors: [
          {
            id: "c1",
            businessBrainId: "bb1",
            name: "Rival Co",
            strengths: [],
            weaknesses: [],
            differentiators: [],
            metadata: {},
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
      marketingProfile: emptyProfile,
    });

    expect(result.gaps).not.toContain("competitors");
    expect(result.competitors).toHaveLength(1);
  });

  it("clears goals gap when at least one marketing goal exists", () => {
    const result = buildMarketingUnderstanding({
      companyDna: emptyCompanyDnaContextSlice(),
      businessBrain: emptyBusinessBrainContextSlice(),
      marketingProfile: {
        ...emptyProfile,
        goals: [
          {
            id: "g1",
            marketingProfileId: "profile-1",
            title: "Increase qualified pipeline",
            status: "active",
            priority: 1,
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
    });

    expect(result.gaps).not.toContain("goals");
    expect(result.goals[0]?.title).toBe("Increase qualified pipeline");
  });

  it("clears existingContent gap when at least one content item exists", () => {
    const result = buildMarketingUnderstanding({
      companyDna: emptyCompanyDnaContextSlice(),
      businessBrain: emptyBusinessBrainContextSlice(),
      marketingProfile: {
        ...emptyProfile,
        contentItems: [
          {
            id: "content-1",
            marketingProfileId: "profile-1",
            title: "Launch blog post",
            contentType: "blog_post",
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
    });

    expect(result.gaps).not.toContain("existingContent");
    expect(result.existingContent).toHaveLength(1);
  });
});
