import { describe, expect, it } from "vitest";

import { assembleMarketingDecision } from "@/lib/marketing-decision";
import type { MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";

import { assembleCampaign, deriveCampaignStatus } from "../assemble-campaign";
import type { CampaignSource } from "../campaign-source";
import {
  CampaignContradictoryStatusError,
  CampaignInvalidBudgetError,
  CampaignInvalidCompletionError,
  CampaignInvalidTimelineError,
  CampaignOrganizationMismatchError,
  CampaignUnsupportedWorkforceRoleError,
} from "../errors";
import type { Campaign } from "../types";

const assembledAt = "2026-07-20T12:00:00.000Z";

const sampleStrategy: MarketingStrategy = {
  summary: "Inbound demand from SMB founders via thought leadership.",
  confidence: "high",
  confidenceReason: "Strong segment context.",
  targetAudiences: [
    {
      segment: "SMB founders",
      priority: "primary",
      rationale: { why: "Primary ICP", basedOn: ["marketing-understanding"] },
    },
  ],
  positioningRecommendations: [
    {
      recommendation: "AI workforce OS vs tool sprawl",
      rationale: { why: "Differentiation", basedOn: ["company-dna"] },
    },
  ],
  contentPillars: [],
  campaignIdeas: [],
  seoOpportunities: [],
  socialMediaStrategy: [],
  customerJourneyRecommendations: [],
  leadGenerationOpportunities: [],
  marketingPriorities: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

const activityBase = {
  rationale: { why: "Supports launch." },
  linkedStrategyItems: [{ type: "campaignIdea" as const, reference: "Launch" }],
  estimatedEffort: "medium" as const,
  expectedImpact: "high" as const,
};

const samplePlan: MarketingPlan = {
  summary: "12-week launch plan",
  confidence: "high",
  confidenceReason: "Aligned to strategy",
  basedOnStrategySummary: "Inbound demand focus",
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [
    {
      title: "Launch campaign",
      channels: ["LinkedIn", "Email"],
      startWeek: 1,
      endWeek: 12,
      milestones: ["Briefs approved"],
      ...activityBase,
    },
  ],
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
      scheduledWeek: 5,
      pillar: "Launch",
      ...activityBase,
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [
    {
      metric: "MQLs",
      target: "120",
      rationale: { why: "Pipeline goal" },
      linkedStrategyItems: [],
    },
  ],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

function buildDecision() {
  return assembleMarketingDecision({
    organizationId: "org-1",
    peerId: "peer-1",
    peerRole: "Marketing",
    objective: "Drive demo requests",
    assembledAt,
    context: {
      companyDnaAvailable: true,
      businessBrainAvailable: true,
      marketingUnderstandingAvailable: true,
      marketingUnderstandingCompleteness: 85,
      customerSegmentCount: 1,
      brandBrainAvailable: true,
    },
    strategy: {
      summary: sampleStrategy.summary,
      confidence: "high",
      channelLabels: ["LinkedIn"],
    },
    plan: {
      summary: samplePlan.summary,
      confidence: "high",
      contentCalendarCount: 1,
      campaignChannelLabels: ["LinkedIn"],
    },
    planActivity: {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
    },
    responsibilityPolicy: {
      responsibilities: [
        {
          category: "linkedin",
          enabled: true,
          approvalPolicy: "fully_automatic",
          autonomyLevel: "autonomous",
        },
      ],
    },
  });
}

function fullSource(overrides: Partial<CampaignSource> = {}): CampaignSource {
  const decision = buildDecision();
  return {
    organizationId: "org-1",
    campaignId: "campaign-launch-1",
    name: "Q3 Launch",
    description: "Cross-channel launch",
    strategy: sampleStrategy,
    plan: samplePlan,
    selectedPlanActivities: samplePlan.contentCalendar,
    decisions: [decision],
    creativeBriefIds: ["brief-1"],
    generatedContentIds: ["content-1"],
    assetIds: ["asset-logo"],
    audience: {
      segments: [{ id: "seg-1", label: "SMB founders" }],
    },
    timeline: {
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      milestones: [{ id: "m1", label: "Launch week", dueDate: "2026-08-01" }],
    },
    budget: { currency: "USD", allocated: 15000, spent: 2500 },
    workforce: [
      {
        role: "copywriter",
        responsibility: "Draft LinkedIn and email copy",
        completion: 40,
        peerId: "peer-copy-1",
      },
    ],
    progress: { percentComplete: 35, summary: "Copy in progress" },
    assembledAt,
    ...overrides,
  };
}

describe("assembleCampaign", () => {
  it("assembles a full campaign from strategy, plan, and decisions", () => {
    const campaign = assembleCampaign(fullSource());

    expect(campaign.id).toBe("campaign-launch-1");
    expect(campaign.goal.marketingObjective).toContain("Inbound demand");
    expect(campaign.goal.businessObjective).toContain("AI workforce OS");
    expect(campaign.goal.successMetrics[0]?.label).toBe("MQLs");
    expect(campaign.audience.targetAudience).toBe("SMB founders");
    expect(campaign.execution.channels.map((c) => c.channelId)).toEqual(
      expect.arrayContaining(["linkedin", "email"])
    );
    expect(campaign.execution.approvalMode).toBe("no_approval_required");
    expect(campaign.execution.budget.allocated).toBe(15000);
    expect(campaign.references.marketingDecisionIds).toHaveLength(1);
    expect(campaign.references.creativeBriefIds).toEqual(["brief-1"]);
    expect(campaign.workforce.workers).toHaveLength(1);
    expect(campaign.workforce.workers[0]?.role).toBe("copywriter");
  });

  it("assembles a minimal campaign without inventing budget or performance", () => {
    const campaign = assembleCampaign({
      organizationId: "org-1",
      campaignId: "campaign-min",
      name: "Minimal",
      assembledAt,
    });

    expect(campaign.execution.status).toBe("draft");
    expect(campaign.execution.budget).toEqual({});
    expect(campaign.performance.kpiPlaceholders).toEqual([]);
    expect(campaign.performance.recommendations).toEqual([]);
    expect(campaign.performance.progress.percentComplete).toBe(0);
    expect(campaign.references.marketingDecisionIds).toEqual([]);
  });

  it("maps strategy and plan into goal without embedding full objects on Campaign", () => {
    const campaign = assembleCampaign(
      fullSource({ workforce: undefined, creativeBriefIds: undefined })
    );
    const keys = Object.keys(campaign);
    expect(keys).not.toContain("strategy");
    expect(keys).not.toContain("plan");
    expect(JSON.stringify(campaign)).not.toContain("targetAudiences");
  });

  it("stores only opaque ids for decisions and briefs", () => {
    const decision = buildDecision();
    const campaign = assembleCampaign(fullSource({ decisions: [decision] }));

    expect(campaign.references.marketingDecisionIds[0]).toBe(decision.id);
    expect(JSON.stringify(campaign.references)).not.toContain("channelRecommendations");
    expect(JSON.stringify(campaign.references)).not.toContain("evidence");
  });

  it("preserves explicit budget and does not read decision budget policy", () => {
    const withBudget = assembleCampaign(fullSource({ budget: { allocated: 9000 } }));
    expect(withBudget.execution.budget.allocated).toBe(9000);

    const withoutBudget = assembleCampaign(fullSource({ budget: undefined }));
    expect(withoutBudget.execution.budget.allocated).toBeUndefined();
    expect(withoutBudget.execution.budget).toEqual({});
    const decisionWithBudget = assembleMarketingDecision({
      organizationId: "org-1",
      peerId: "peer-1",
      assembledAt,
      context: { marketingUnderstandingAvailable: true },
      budgetConstraint: { maxMonthlySpend: 5000 },
    });
    expect(decisionWithBudget.budgetPolicy.maxMonthlySpend).toBe(5000);
    expect(
      assembleCampaign(fullSource({ budget: undefined })).execution.budget.allocated
    ).toBeUndefined();
  });

  it("rejects invalid timeline ordering", () => {
    expect(() =>
      assembleCampaign(
        fullSource({
          timeline: { startDate: "2026-12-01", endDate: "2026-01-01", milestones: [] },
        })
      )
    ).toThrow(CampaignInvalidTimelineError);
  });

  it("rejects organization mismatch on decisions", () => {
    const decision = { ...buildDecision(), organizationId: "org-other" };
    expect(() => assembleCampaign(fullSource({ decisions: [decision] }))).toThrow(
      CampaignOrganizationMismatchError
    );
  });

  it("derives planning status when plan exists without active flag", () => {
    const campaign = assembleCampaign(
      fullSource({ status: undefined, statusFlags: undefined })
    );
    expect(campaign.execution.status).toBe("planning");
  });

  it("allows explicit active status without inferring from plan alone", () => {
    const campaign = assembleCampaign(fullSource({ status: "active", statusFlags: undefined }));
    expect(campaign.execution.status).toBe("active");
  });

  it("rejects contradictory status and flags", () => {
    expect(() =>
      deriveCampaignStatus({
        organizationId: "org-1",
        campaignId: "c-1",
        name: "X",
        assembledAt,
        status: "draft",
        statusFlags: { active: true },
      })
    ).toThrow(CampaignContradictoryStatusError);

    expect(() =>
      deriveCampaignStatus({
        organizationId: "org-1",
        campaignId: "c-1",
        name: "X",
        assembledAt,
        statusFlags: { paused: true, completed: true },
      })
    ).toThrow(CampaignContradictoryStatusError);
  });

  it("seeds canonical workforce when requested", () => {
    const campaign = assembleCampaign(
      fullSource({
        seedCanonicalWorkforce: true,
        workforce: [
          {
            role: "analyst",
            responsibility: "Track launch KPIs",
            completion: 10,
          },
        ],
      })
    );

    expect(campaign.workforce.workers).toHaveLength(6);
    const analyst = campaign.workforce.workers.find((w) => w.role === "analyst");
    expect(analyst?.responsibility).toBe("Track launch KPIs");
    expect(analyst?.completion).toBe(10);
    expect(campaign.workforce.workers.every((w) => !w.peerId || w.role === "analyst")).toBe(
      true
    );
  });

  it("includes only explicit workforce when seeding is off", () => {
    const campaign = assembleCampaign(fullSource());
    expect(campaign.workforce.workers).toHaveLength(1);
  });

  it("rejects invalid completion percentages", () => {
    expect(() =>
      assembleCampaign(
        fullSource({
          workforce: [
            { role: "designer", responsibility: "Visuals", completion: 150 },
          ],
        })
      )
    ).toThrow(CampaignInvalidCompletionError);
  });

  it("rejects unsupported workforce roles", () => {
    expect(() =>
      assembleCampaign(
        fullSource({
          workforce: [
            {
              role: "invalid_role" as CampaignSource["workforce"][number]["role"],
              responsibility: "Nope",
            },
          ],
        })
      )
    ).toThrow(CampaignUnsupportedWorkforceRoleError);
  });

  it("rejects invalid budget values", () => {
    expect(() =>
      assembleCampaign(fullSource({ budget: { allocated: -1 } }))
    ).toThrow(CampaignInvalidBudgetError);
  });

  it("does not invent KPI placeholders or recommendations", () => {
    const campaign = assembleCampaign(fullSource({ kpiPlaceholders: undefined }));
    expect(campaign.performance.kpiPlaceholders).toEqual([]);
    expect(campaign.performance.recommendations).toEqual([]);
  });

  it("uses caller-supplied recommendations and KPI placeholders only", () => {
    const campaign = assembleCampaign(
      fullSource({
        kpiPlaceholders: [{ id: "k1", name: "CTR", targetValue: "TBD" }],
        recommendations: [{ id: "r1", summary: "Add variant", priority: "high" }],
      })
    );
    expect(campaign.performance.kpiPlaceholders).toHaveLength(1);
    expect(campaign.performance.recommendations).toHaveLength(1);
  });

  it("is deterministic for identical input", () => {
    const source = fullSource();
    expect(assembleCampaign(source)).toEqual(assembleCampaign(source));
  });

  it("does not mutate source inputs", () => {
    const source = fullSource();
    const before = JSON.stringify(source);
    assembleCampaign(source);
    expect(JSON.stringify(source)).toBe(before);
  });

  it("round-trips through JSON without embedded dependency payloads", () => {
    const campaign = assembleCampaign(fullSource());
    const parsed = JSON.parse(JSON.stringify(campaign)) as Campaign;
    expect(parsed.references.marketingDecisionIds).toEqual(
      campaign.references.marketingDecisionIds
    );
    expect(Object.keys(parsed)).not.toContain("decisions");
  });
});
