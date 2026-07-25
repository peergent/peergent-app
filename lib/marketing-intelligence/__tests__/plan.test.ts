import { describe, expect, it } from "vitest";
import { assessPlanReadiness } from "@/lib/marketing-intelligence/plan/assess-plan-readiness";
import { parseMarketingPlanResponse } from "@/lib/marketing-intelligence/plan/parse-marketing-plan-response";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";

const sampleStrategy: MarketingStrategy = {
  summary: "Focus on inbound demand from SMB founders.",
  confidence: "high",
  confidenceReason: "Strong context available.",
  targetAudiences: [
    {
      segment: "SMB founders",
      priority: "primary",
      rationale: { why: "Primary ICP.", basedOn: ["business-brain"] },
    },
  ],
  positioningRecommendations: [
    {
      recommendation: "AI employees vs tool sprawl",
      rationale: { why: "Differentiator.", basedOn: ["marketing-understanding"] },
    },
  ],
  contentPillars: [
    {
      name: "Growth efficiency",
      themes: ["Time savings"],
      rationale: { why: "Pain point.", basedOn: ["business-brain"] },
    },
  ],
  campaignIdeas: [
    {
      name: "Founder playbook",
      objective: "Inbound leads",
      channels: ["LinkedIn"],
      rationale: { why: "Audience channel.", basedOn: ["marketing-understanding"] },
    },
  ],
  seoOpportunities: [],
  socialMediaStrategy: [],
  customerJourneyRecommendations: [],
  leadGenerationOpportunities: [],
  marketingPriorities: [
    {
      priority: 1,
      title: "Launch content pillars",
      rationale: { why: "Foundation.", basedOn: ["marketing-understanding"] },
    },
  ],
  knowledgeGaps: [],
  generatedAt: "2026-01-01T00:00:00.000Z",
};

const activityBase = {
  rationale: { why: "Implements the founder playbook campaign from strategy." },
  linkedStrategyItems: [{ type: "campaignIdea" as const, reference: "Founder playbook" }],
  estimatedEffort: "medium" as const,
  expectedImpact: "high" as const,
};

const samplePlanJson = {
  summary: "12-week execution plan focused on founder playbook campaign.",
  confidence: "high",
  confidenceReason: "Strategy provides clear campaign and audience direction.",
  basedOnStrategySummary: "Focus on inbound demand from SMB founders.",
  objectives: [
    {
      title: "Increase qualified inbound leads",
      description: "Drive leads via founder playbook campaign",
      successCriteria: "20 MQLs in 12 weeks",
      ...activityBase,
    },
  ],
  priorities: [{ rank: 1, title: "Set up content pillars", ...activityBase }],
  timeline: [
    {
      phase: "Foundation",
      startWeek: 1,
      endWeek: 4,
      activities: ["Define pillars", "Plan calendar"],
      title: "Foundation phase",
      ...activityBase,
    },
  ],
  campaigns: [
    {
      title: "Founder playbook launch",
      channels: ["LinkedIn", "Blog"],
      startWeek: 5,
      endWeek: 12,
      milestones: ["Calendar approved", "First slot scheduled"],
      ...activityBase,
    },
  ],
  contentCalendar: [
    {
      title: "Founder pain points slot",
      contentType: "blog_post",
      channel: "Blog",
      scheduledWeek: 6,
      pillar: "Growth efficiency",
      ...activityBase,
    },
  ],
  dependencies: [
    {
      dependent: "Content calendar",
      dependsOn: "Content pillars defined",
      rationale: { why: "Calendar requires pillar themes first." },
    },
  ],
  expectedOutcomes: [
    {
      title: "Inbound pipeline growth",
      outcome: "Increased MQL volume",
      timeframe: "12 weeks",
      ...activityBase,
    },
  ],
  successMetrics: [
    {
      metric: "MQL count",
      target: "20 in 12 weeks",
      rationale: { why: "Aligns with lead gen campaign objective." },
      linkedStrategyItems: [{ type: "campaignIdea", reference: "Founder playbook" }],
    },
  ],
  knowledgeGaps: [],
};

describe("assessPlanReadiness", () => {
  it("rejects missing strategy", () => {
    const result = assessPlanReadiness(undefined);
    expect(result.ready).toBe(false);
  });

  it("rejects empty strategy", () => {
    const result = assessPlanReadiness({
      ...sampleStrategy,
      targetAudiences: [],
      positioningRecommendations: [],
      contentPillars: [],
      campaignIdeas: [],
      marketingPriorities: [],
    });
    expect(result.ready).toBe(false);
  });

  it("accepts strategy with recommendations", () => {
    const result = assessPlanReadiness(sampleStrategy);
    expect(result.ready).toBe(true);
    expect(result.strategyItemCount).toBeGreaterThan(0);
  });
});

describe("parseMarketingPlanResponse", () => {
  it("parses valid plan JSON with strategy links on activities", () => {
    const result = parseMarketingPlanResponse(JSON.stringify(samplePlanJson));

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.plan.objectives[0]?.linkedStrategyItems[0]?.reference).toBe(
      "Founder playbook"
    );
    expect(result.plan.contentCalendar[0]?.estimatedEffort).toBe("medium");
    expect(result.plan.contentCalendar[0]?.contentType).toBe("blog_article");
    expect(result.plan.dependencies[0]?.dependsOn).toContain("pillars");
    expect(result.plan.successMetrics[0]?.target).toContain("20");
  });

  it("normalizes human-readable content types to canonical draft types", () => {
    const withBlogPostLabel = {
      ...samplePlanJson,
      contentCalendar: [
        {
          title: "Educational Blog Post: AI Employees vs AI Tools",
          contentType: "Blog Post",
          channel: "Blog",
          scheduledWeek: 3,
          pillar: "Education",
          ...activityBase,
        },
      ],
    };

    const result = parseMarketingPlanResponse(JSON.stringify(withBlogPostLabel));
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.plan.contentCalendar[0]?.contentType).toBe("blog_article");
    expect(result.warnings.some((w) => w.includes('normalized from "Blog Post"'))).toBe(true);
  });

  it("skips unsupported content types such as Webinar", () => {
    const withWebinar = {
      ...samplePlanJson,
      contentCalendar: [
        {
          title: "Webinar: How to Deploy AI Employees Quickly and Securely",
          contentType: "Webinar",
          channel: "Web",
          scheduledWeek: 4,
          pillar: "Education",
          ...activityBase,
        },
        {
          title: "Founder pain points slot",
          contentType: "blog_post",
          channel: "Blog",
          scheduledWeek: 6,
          pillar: "Growth efficiency",
          ...activityBase,
        },
      ],
    };

    const result = parseMarketingPlanResponse(JSON.stringify(withWebinar));
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.plan.contentCalendar).toHaveLength(1);
    expect(result.plan.contentCalendar[0]?.title).toBe("Founder pain points slot");
    expect(result.warnings.some((w) => w.includes('"Webinar"'))).toBe(true);
    expect(result.warnings.some((w) => w.includes("entry skipped"))).toBe(true);
  });

  it("rejects plan without valid activities", () => {
    const invalid = {
      summary: "Empty plan",
      confidence: "low",
      confidenceReason: "No data",
      basedOnStrategySummary: "N/A",
      objectives: [],
      priorities: [],
      timeline: [],
      campaigns: [],
      contentCalendar: [],
      dependencies: [],
      expectedOutcomes: [],
      successMetrics: [],
      knowledgeGaps: [],
    };

    const result = parseMarketingPlanResponse(JSON.stringify(invalid));
    expect(result.success).toBe(false);
  });
});
