import { describe, expect, it } from "vitest";
import {
  resolveMarketingPrimaryActionIntent,
  resolveMarketingWorkflowFocus,
} from "@/lib/peer-experience";
import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";

const understanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 75,
  gaps: [],
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
      scheduledWeek: 1,
      rationale: { why: "SEO" },
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

const baseDraft: MarketingContentDraft = {
  id: "draft-1",
  planActivityReference: "Blog slot",
  contentType: "blog_article",
  objective: "SEO",
  title: "Blog title",
  body: "Body",
  keywords: [],
  rationale: { why: "why", planActivityReference: "Blog slot", strategyLinks: [] },
  sourceReferences: [],
  confidence: "high",
  status: "draft",
  warnings: [],
  generatedAt: "",
};

describe("resolveMarketingPrimaryActionIntent", () => {
  it("returns null while generating", () => {
    const focus = resolveMarketingWorkflowFocus({
      generating: "draft",
      understanding,
      strategy,
      plan,
      drafts: [],
    });
    expect(resolveMarketingPrimaryActionIntent(focus)).toBeNull();
  });

  it("prioritises mark-published over other draft states", () => {
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts: [
        { ...baseDraft, id: "d1", status: "ready_for_review", title: "Review me" },
        {
          ...baseDraft,
          id: "d2",
          status: "ready_to_publish",
          title: "Publish me",
          planActivityReference: "Blog slot",
        },
      ],
    });
    const action = resolveMarketingPrimaryActionIntent(focus);
    expect(action?.kind).toBe("mark-published");
    expect(action?.draftId).toBe("d2");
  });

  it("prioritises prepare-publication over review", () => {
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts: [
        { ...baseDraft, id: "d1", status: "draft" },
        { ...baseDraft, id: "d2", status: "approved", title: "Approved post" },
      ],
    });
    const action = resolveMarketingPrimaryActionIntent(focus);
    expect(action?.kind).toBe("prepare-publication");
    expect(action?.draftId).toBe("d2");
  });

  it("selects review when a draft awaits feedback", () => {
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts: [{ ...baseDraft, status: "draft" }],
    });
    expect(resolveMarketingPrimaryActionIntent(focus)?.kind).toBe("review-draft");
  });

  it("selects create strategy when understanding is sufficient", () => {
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding,
      strategy: null,
      plan: null,
      drafts: [],
    });
    expect(resolveMarketingPrimaryActionIntent(focus)?.kind).toBe("generate-strategy");
  });

  it("selects create plan when strategy exists without plan", () => {
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding,
      strategy,
      plan: null,
      drafts: [],
    });
    expect(resolveMarketingPrimaryActionIntent(focus)?.kind).toBe("generate-plan");
  });

  it("selects write next when plan has undrafted activity", () => {
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts: [],
    });
    expect(resolveMarketingPrimaryActionIntent(focus)?.kind).toBe("create-draft");
    expect(resolveMarketingPrimaryActionIntent(focus)?.planActivityReference).toBe("Blog slot");
  });

  it("does not use recommendations ordering — publish wins over review", () => {
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts: [
        { ...baseDraft, id: "review", status: "draft", title: "A" },
        {
          ...baseDraft,
          id: "publish",
          status: "ready_to_publish",
          title: "B",
          planActivityReference: "Blog slot",
        },
      ],
    });
    expect(resolveMarketingPrimaryActionIntent(focus)?.draftId).toBe("publish");
  });
});
