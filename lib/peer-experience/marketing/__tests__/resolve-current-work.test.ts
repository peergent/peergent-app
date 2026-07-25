import { describe, expect, it } from "vitest";
import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
} from "@/lib/marketing-intelligence";
import { EMPLOYEE_WORKFLOW_STAGES } from "@/lib/peer-experience/marketing/emma-narrative";
import { resolveCurrentWork } from "@/lib/peer-experience/marketing/resolve-current-work";

const basePlan: MarketingPlan = {
  summary: "Campaign plan",
  confidence: "high",
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      scheduledWeek: 1,
      objective: "Awareness",
    },
  ],
  successMetrics: [],
  expectedOutcomes: [],
  distributionChannels: [],
};

const baseStrategy: MarketingStrategy = {
  summary: "Strategy",
  confidence: "high",
  campaignIdeas: [],
  seoOpportunities: [],
  positioning: "",
  targetAudiences: [],
  messagingPillars: [],
  competitiveNotes: [],
};

function draft(partial: Partial<MarketingContentDraft>): MarketingContentDraft {
  return {
    id: "d1",
    planActivityReference: "LinkedIn launch post",
    contentType: "linkedin_post",
    status: "draft",
    title: "Launch post",
    body: "Body",
    objective: "",
    keywords: [],
    rationale: { why: "", planActivityReference: "LinkedIn launch post", strategyLinks: [] },
    sourceReferences: [],
    confidence: "high",
    warnings: [],
    generatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("resolveCurrentWork", () => {
  const baseInput = {
    campaignTitle: "AI Workforce Campaign",
    generating: null,
    understanding: { available: true, completeness: 100, gaps: [], summary: "", lastUpdated: "" },
    strategy: baseStrategy,
    plan: basePlan,
    drafts: [] as MarketingContentDraft[],
    publicationPackages: [],
  };

  it("shows pipeline while generating draft", () => {
    const result = resolveCurrentWork({
      ...baseInput,
      generating: "draft",
      generatingActivity: "LinkedIn post",
    });

    expect(result.stages.length).toBe(EMPLOYEE_WORKFLOW_STAGES.length);
    expect(result.stages.some((stage) => stage.status === "active")).toBe(true);
    expect(result.isActive).toBe(true);
  });

  it("keeps stages when generating clears but write_next focus remains", () => {
    const result = resolveCurrentWork({
      ...baseInput,
      generating: null,
      drafts: [],
    });

    expect(result.stages.length).toBeGreaterThan(0);
    expect(result.stages.some((stage) => stage.status === "active")).toBe(true);
    expect(result.campaignTitle).toBeTruthy();
  });

  it("shows approval pipeline when a draft awaits review", () => {
    const result = resolveCurrentWork({
      ...baseInput,
      drafts: [draft({ status: "ready_for_review" })],
    });

    expect(result.stages.length).toBeGreaterThan(0);
    expect(result.sectionSubtitle).toMatch(/review/i);
    expect(result.isActive).toBe(true);
  });

  it("does not erase stages on partial update with fewer drafts", () => {
    const withDraft = resolveCurrentWork({
      ...baseInput,
      drafts: [draft({ status: "ready_for_review" })],
    });

    const afterPartial = resolveCurrentWork({
      ...baseInput,
      drafts: [draft({ status: "ready_for_review", body: "" })],
    });

    expect(afterPartial.stages.length).toBe(withDraft.stages.length);
    expect(afterPartial.isActive).toBe(true);
  });

  it("uses delegation stages when generating visual content", () => {
    const result = resolveCurrentWork({
      ...baseInput,
      generating: "draft",
      generatingActivity: "Instagram post",
      delegationTaskTitle: "Instagram campaign",
      delegationNeedsVisual: true,
    });

    expect(result.campaignTitle).toBe("Instagram campaign");
    expect(result.stages[0]?.label).toMatch(/Understanding your request/i);
  });

  it("returns explicit idle monitoring when campaign is complete", () => {
    const result = resolveCurrentWork({
      ...baseInput,
      drafts: [draft({ status: "published" })],
      plan: {
        ...basePlan,
        contentCalendar: basePlan.contentCalendar.map((entry) => ({
          ...entry,
          title: "LinkedIn launch post",
        })),
      },
    });

    expect(result.statusLine).toMatch(/complete|monitoring/i);
  });
});
