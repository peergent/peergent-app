import { describe, expect, it } from "vitest";

import { assembleCampaign } from "@/lib/campaign";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";

import {
  buildMarketingCampaignsViewModel,
  MARKETING_PLAN_FALLBACK_CAMPAIGN_ID,
} from "../build-marketing-campaigns-view-model";
import type { MarketingCampaignViewModelSource } from "../marketing-campaign-types";

const assembledAt = "2026-07-20T12:00:00.000Z";
const peerId = "peer-emma";

const sampleStrategy: MarketingStrategy = {
  summary: "Inbound demand from SMB founders.",
  confidence: "high",
  confidenceReason: "Strong context",
  targetAudiences: [
    {
      segment: "SMB founders",
      priority: "primary",
      rationale: { why: "ICP", basedOn: ["marketing-understanding"] },
    },
  ],
  positioningRecommendations: [],
  contentPillars: [],
  campaignIdeas: [{ name: "Launch series", objective: "Pipeline", channels: ["LinkedIn"], rationale: { why: "Launch", basedOn: ["marketing-understanding"] } }],
  seoOpportunities: [],
  socialMediaStrategy: [],
  customerJourneyRecommendations: [],
  leadGenerationOpportunities: [],
  marketingPriorities: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

const activityBase = {
  rationale: { why: "Launch" },
  linkedStrategyItems: [{ type: "campaignIdea" as const, reference: "Launch" }],
  estimatedEffort: "medium" as const,
  expectedImpact: "high" as const,
};

const samplePlan: MarketingPlan = {
  summary: "12-week launch plan",
  confidence: "high",
  confidenceReason: "Aligned",
  basedOnStrategySummary: "Inbound focus",
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [
    {
      title: "Launch",
      channels: ["LinkedIn"],
      startWeek: 1,
      endWeek: 12,
      milestones: [],
      ...activityBase,
    },
  ],
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
      scheduledWeek: 5,
      ...activityBase,
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

function assembledCampaign() {
  return assembleCampaign({
    organizationId: "org-1",
    campaignId: "campaign-1",
    name: "Q3 Launch",
    strategy: sampleStrategy,
    plan: samplePlan,
    selectedPlanActivities: samplePlan.contentCalendar,
    creativeBriefIds: ["brief-1", "brief-2"],
    assembledAt,
    status: "planning",
    budget: { currency: "USD", allocated: 5000 },
    workforce: [
      {
        role: "copywriter",
        responsibility: "Draft social copy",
        completion: 25,
      },
    ],
    seedCanonicalWorkforce: false,
  });
}

const draft: MarketingContentDraft = {
  id: "draft-1",
  planActivityReference: "LinkedIn launch post",
  contentType: "linkedin_post",
  channel: "LinkedIn",
  objective: "Awareness",
  title: "Launch post",
  body: "Body",
  keywords: [],
  rationale: {
    why: "Calendar",
    planActivityReference: "LinkedIn launch post",
    strategyLinks: [],
  },
  sourceReferences: [],
  confidence: "moderate",
  status: "ready_for_review",
  warnings: [],
  generatedAt: assembledAt,
};

describe("buildMarketingCampaignsViewModel", () => {
  it("builds list cards from assembled campaigns", () => {
    const campaign = assembledCampaign();
    const vm = buildMarketingCampaignsViewModel({
      peerId,
      campaigns: [campaign],
      drafts: [draft],
      contentIdsByCampaignId: { "campaign-1": ["draft-1"] },
    });

    expect(vm.items).toHaveLength(1);
    expect(vm.items[0]?.title).toBe("Q3 Launch");
    expect(vm.items[0]?.status).toBe("planning");
    expect(vm.items[0]?.progressKnown).toBe(true);
    expect(vm.items[0]?.creativeBriefCount).toBe(2);
    expect(vm.items[0]?.approvalCount).toBe(1);
    expect(vm.items[0]?.href).toBe("");
    expect(vm.items[0]?.linkEnabled).toBe(false);
    expect(vm.items[0]?.nextAction.label).toBeTruthy();
  });

  it("builds project-scoped cards instead of fallback when projects exist", () => {
    const vm = buildMarketingCampaignsViewModel({
      peerId,
      strategy: sampleStrategy,
      plan: samplePlan,
      projects: [
        {
          id: "proj-list-1",
          peerId,
          title: "Project card",
          goal: "Goal",
          campaignType: "linkedin_campaign",
          createdAt: assembledAt,
          updatedAt: assembledAt,
          ownerLabel: "Alex",
          rawRequest: "Launch",
        },
      ],
    });
    expect(vm.items).toHaveLength(1);
    expect(vm.items[0]?.id).toBe("proj-list-1");
    expect(vm.items[0]?.linkEnabled).toBe(true);
  });

  it("falls back to strategy/plan without inventing brief counts", () => {
    const vm = buildMarketingCampaignsViewModel({
      peerId,
      strategy: sampleStrategy,
      plan: samplePlan,
      drafts: [draft],
    });

    expect(vm.items).toHaveLength(1);
    expect(vm.items[0]?.id).toBe(MARKETING_PLAN_FALLBACK_CAMPAIGN_ID);
    expect(vm.items[0]?.status).toBe("planning");
    expect(vm.items[0]?.progressKnown).toBe(false);
    expect(vm.items[0]?.creativeBriefCount).toBe(0);
    expect(vm.items[0]?.linkEnabled).toBe(false);
    expect(vm.items[0]?.generatedContentCount).toBe(1);
  });

  it("does not mark fallback campaign active when only plan exists", () => {
    const vm = buildMarketingCampaignsViewModel({ peerId, plan: samplePlan });
    expect(vm.items[0]?.status).not.toBe("active");
  });

  it("surfaces blocked state on assembled campaign", () => {
    const blocked = assembleCampaign({
      organizationId: "org-1",
      campaignId: "blocked-1",
      name: "Blocked",
      assembledAt,
      status: "blocked",
    });
    const vm = buildMarketingCampaignsViewModel({ peerId, campaigns: [blocked] });
    expect(vm.items[0]?.status).toBe("blocked");
    expect(vm.items[0]?.blockedItemCount).toBeGreaterThanOrEqual(1);
  });

  it("maps workforce from assembled campaign", () => {
    const campaign = assembledCampaign();
    const vm = buildMarketingCampaignsViewModel({ peerId, campaigns: [campaign] });
    expect(vm.items[0]?.assignedWorkforce[0]?.roleLabel).toBe("Copywriter");
    expect(vm.items[0]?.assignedWorkforce[0]?.completionKnown).toBe(true);
  });

  it("does not expose internal domain payloads in serialized output", () => {
    const vm = buildMarketingCampaignsViewModel({
      peerId,
      campaigns: [assembledCampaign()],
    });
    const json = JSON.stringify(vm);
    expect(json).not.toContain("MarketingDecisionRecord");
    expect(json).not.toContain("assemblyTrace");
    expect(json).not.toContain("channelRecommendations");
  });

  it("does not mutate source input", () => {
    const source: MarketingCampaignViewModelSource = {
      peerId,
      campaigns: [assembledCampaign()],
      drafts: [draft],
    };
    const before = JSON.stringify(source);
    buildMarketingCampaignsViewModel(source);
    expect(JSON.stringify(source)).toBe(before);
  });
});
