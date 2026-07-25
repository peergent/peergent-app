import { describe, expect, it } from "vitest";
import {
  buildRecommendedActions,
  collectWorkspaceWarnings,
  deriveWorkspacePhase,
} from "@/lib/marketing-workspace/recommendations";
import type {
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";

const understanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 75,
  gaps: ["existingContent"],
  brand: { values: [], toneOfVoice: {}, keyMessages: [] },
  products: [{ id: "1", name: "Platform" }],
  services: [],
  customerSegments: [{ id: "1", name: "SMB", painPoints: [], buyingTriggers: [] }],
  competitors: [],
  goals: [],
  existingContent: [],
  assembledAt: "",
};

const strategy: MarketingStrategy = {
  summary: "Strategy",
  confidence: "high",
  confidenceReason: "ok",
  targetAudiences: [],
  positioningRecommendations: [],
  contentPillars: [],
  campaignIdeas: [],
  seoOpportunities: [],
  socialMediaStrategy: [],
  customerJourneyRecommendations: [],
  leadGenerationOpportunities: [],
  marketingPriorities: [],
  knowledgeGaps: [],
  generatedAt: "",
};

const plan: MarketingPlan = {
  summary: "Plan",
  confidence: "high",
  confidenceReason: "ok",
  basedOnStrategySummary: "Strategy",
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [],
  contentCalendar: [
    {
      title: "Blog slot",
      contentType: "blog_article",
      scheduledWeek: 2,
      rationale: { why: "test" },
      linkedStrategyItems: [],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: "",
};

describe("marketing workspace recommendations", () => {
  it("recommends strategy when missing", () => {
    const actions = buildRecommendedActions({
      understanding,
      strategy: null,
      plan: null,
      drafts: [],
    });
    expect(actions.some((a) => a.kind === "generate-strategy")).toBe(true);
  });

  it("recommends plan when strategy exists", () => {
    const actions = buildRecommendedActions({
      understanding,
      strategy,
      plan: null,
      drafts: [],
    });
    expect(actions.some((a) => a.kind === "generate-plan")).toBe(true);
  });

  it("recommends draft for calendar slot without draft", () => {
    const actions = buildRecommendedActions({
      understanding,
      strategy,
      plan,
      drafts: [],
    });
    expect(actions.some((a) => a.kind === "create-draft" && a.planActivityReference === "Blog slot")).toBe(true);
  });

  it("does not recommend draft for unsupported legacy content types", () => {
    const legacyPlan: MarketingPlan = {
      ...plan,
      contentCalendar: [
        ...plan.contentCalendar,
        {
          title: "Webinar: How to Deploy AI Employees Quickly and Securely",
          contentType: "Webinar" as MarketingPlan["contentCalendar"][number]["contentType"],
          scheduledWeek: 4,
          channel: "Web",
          rationale: { why: "Lead gen event" },
          linkedStrategyItems: [],
          estimatedEffort: "high",
          expectedImpact: "high",
        },
      ],
    };

    const actions = buildRecommendedActions({
      understanding,
      strategy,
      plan: legacyPlan,
      drafts: [],
    });

    expect(
      actions.some(
        (a) =>
          a.kind === "create-draft" &&
          a.planActivityReference === "Webinar: How to Deploy AI Employees Quickly and Securely"
      )
    ).toBe(false);
    expect(actions.some((a) => a.kind === "create-draft" && a.planActivityReference === "Blog slot")).toBe(
      true
    );
  });

  it("collects warnings from understanding gaps", () => {
    const warnings = collectWorkspaceWarnings({
      understanding,
      strategy: null,
      plan: null,
      drafts: [],
      apiWarnings: [],
    });
    expect(warnings.some((w) => w.includes("existingContent"))).toBe(true);
  });

  it("derives reviewing phase when draft pending", () => {
    const { phase } = deriveWorkspacePhase({
      understanding,
      strategy,
      plan,
      drafts: [
        {
          id: "1",
          planActivityReference: "Blog slot",
          contentType: "blog_article",
          objective: "test",
          title: "Title",
          body: "Body",
          keywords: [],
          rationale: { why: "why", planActivityReference: "Blog slot", strategyLinks: [] },
          sourceReferences: [],
          confidence: "high",
          status: "draft",
          warnings: [],
          generatedAt: "",
        },
      ],
      isGenerating: false,
    });
    expect(phase).toBe("reviewing");
  });

  it("recommends prepare-publication for approved drafts", () => {
    const actions = buildRecommendedActions({
      understanding,
      strategy,
      plan,
      drafts: [
        {
          id: "1",
          planActivityReference: "Blog slot",
          contentType: "blog_article",
          objective: "test",
          title: "Title",
          body: "Body",
          keywords: [],
          rationale: { why: "why", planActivityReference: "Blog slot", strategyLinks: [] },
          sourceReferences: [],
          confidence: "high",
          status: "approved",
          warnings: [],
          generatedAt: "",
        },
      ],
    });
    expect(actions.some((action) => action.kind === "prepare-publication")).toBe(true);
  });

  it("recommends mark-published for ready_to_publish drafts", () => {
    const actions = buildRecommendedActions({
      understanding,
      strategy,
      plan,
      drafts: [
        {
          id: "1",
          planActivityReference: "Blog slot",
          contentType: "blog_article",
          objective: "test",
          title: "Title",
          body: "Body",
          keywords: [],
          rationale: { why: "why", planActivityReference: "Blog slot", strategyLinks: [] },
          sourceReferences: [],
          confidence: "high",
          status: "ready_to_publish",
          warnings: [],
          generatedAt: "",
        },
      ],
    });
    expect(actions.some((action) => action.kind === "mark-published")).toBe(true);
  });
});
