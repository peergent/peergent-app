import { describe, expect, it } from "vitest";

import { assembleCampaign } from "@/lib/campaign";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";

import { deriveMarketingCampaignNextAction } from "../marketing-campaign-next-action";
import { buildMarketingCampaignDetailViewModel } from "../build-marketing-campaign-detail-view-model";
import { MARKETING_PLAN_FALLBACK_CAMPAIGN_ID } from "../build-marketing-campaigns-view-model";
import type { MarketingPeerDomainInput } from "../marketing-peer-domain-input";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "../build-project-campaign-projection";

const assembledAt = "2026-07-20T12:00:00.000Z";
const peerId = "peer-emma";

const sampleStrategy: MarketingStrategy = {
  summary: "Inbound demand",
  confidence: "high",
  confidenceReason: "Ok",
  targetAudiences: [
    {
      segment: "Founders",
      priority: "primary",
      rationale: { why: "ICP", basedOn: ["marketing-understanding"] },
    },
  ],
  positioningRecommendations: [],
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
  rationale: { why: "Launch" },
  linkedStrategyItems: [{ type: "campaignIdea" as const, reference: "Launch" }],
  estimatedEffort: "medium" as const,
  expectedImpact: "high" as const,
};

const samplePlan: MarketingPlan = {
  summary: "Launch plan",
  confidence: "high",
  confidenceReason: "Ok",
  basedOnStrategySummary: "Inbound",
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [],
  contentCalendar: [
    {
      title: "LinkedIn post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
      scheduledWeek: 3,
      ...activityBase,
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

function fullCampaign() {
  return assembleCampaign({
    organizationId: "org-1",
    campaignId: "campaign-detail-1",
    name: "Launch campaign",
    strategy: sampleStrategy,
    plan: samplePlan,
    selectedPlanActivities: samplePlan.contentCalendar,
    creativeBriefIds: ["brief-a"],
    assembledAt,
    status: "planning",
    recommendations: [{ id: "rec-1", summary: "Add a second variant", priority: "high" }],
    budget: { currency: "USD", allocated: 10000, spent: 1000 },
  });
}

const pendingDraft: MarketingContentDraft = {
  id: "draft-pending",
  planActivityReference: "LinkedIn post",
  contentType: "linkedin_post",
  channel: "LinkedIn",
  objective: "Awareness",
  title: "Post",
  body: "Body",
  keywords: [],
  rationale: {
    why: "Plan",
    planActivityReference: "LinkedIn post",
    strategyLinks: [],
  },
  sourceReferences: [],
  confidence: "moderate",
  status: "ready_for_review",
  warnings: [],
  generatedAt: assembledAt,
};

describe("buildMarketingCampaignDetailViewModel", () => {
  it("builds detail from marketing project anchor", () => {
    const input: MarketingPeerDomainInput = {
      peerId: "peer-emma",
      peerName: "Emma",
      userName: "Alex",
      campaignTitle: "Campaign",
      generating: null,
      generatingActivity: null,
      understanding: null,
      strategy: null,
      plan: null,
      drafts: [],
      publicationPackages: [],
      activityFeed: [],
      workUnits: [],
      projects: [
        {
          id: "proj-anchor",
          peerId: "peer-emma",
          title: "Anchor project",
          goal: "Ship launch",
          campaignType: "product_launch",
          createdAt: assembledAt,
          updatedAt: assembledAt,
          ownerLabel: "Alex",
          rawRequest: "Launch",
        },
      ],
      responsibilities: [],
      automations: [],
      connections: [],
    };
    const detail = buildMarketingCampaignDetailViewModel(
      buildMarketingCampaignDetailSourceFromDomainInput(input, "proj-anchor")
    );
    expect(detail?.title).toBe("Anchor project");
    expect(detail?.recommendations).toEqual([]);
  });

  it("builds detail from assembled campaign", () => {
    const campaign = fullCampaign();
    const detail = buildMarketingCampaignDetailViewModel({
      peerId,
      campaignId: campaign.id,
      campaigns: [campaign],
      drafts: [pendingDraft],
      contentIdsByCampaignId: { [campaign.id]: ["draft-pending"] },
      briefLabelsById: { "brief-a": "LinkedIn brief" },
    });

    expect(detail).not.toBeNull();
    expect(detail!.title).toBe("Launch campaign");
    expect(detail!.budgetSummary).toContain("10,000");
    expect(detail!.creativeBriefReferences[0]?.label).toBe("LinkedIn brief");
    expect(detail!.approvalQueue.pendingCount).toBe(1);
    expect(detail!.recommendations).toHaveLength(1);
    expect(detail!.progressKnown).toBe(true);
  });

  it("falls back to plan/strategy when campaign object is absent", () => {
    const detail = buildMarketingCampaignDetailViewModel({
      peerId,
      campaignId: MARKETING_PLAN_FALLBACK_CAMPAIGN_ID,
      strategy: sampleStrategy,
      plan: samplePlan,
    });

    expect(detail).not.toBeNull();
    expect(detail!.status).toBe("planning");
    expect(detail!.progressKnown).toBe(false);
    expect(detail!.recommendations).toEqual([]);
    expect(detail!.budgetSummary).toBeUndefined();
  });

  it("filters internal warnings from customer output", () => {
    const campaign = fullCampaign();
    const detail = buildMarketingCampaignDetailViewModel({
      peerId,
      campaignId: campaign.id,
      campaigns: [campaign],
      warningsByCampaignId: {
        [campaign.id]: [
          "Brand review recommended before publish.",
          "assemblyTrace: internal-only",
          "Marketing decision record blocked channel",
        ],
      },
    });

    expect(detail!.warnings).toEqual(["Brand review recommended before publish."]);
  });

  it("handles unknown performance safely", () => {
    const campaign = assembleCampaign({
      organizationId: "org-1",
      campaignId: "perf-unknown",
      name: "Perf",
      assembledAt,
    });
    const detail = buildMarketingCampaignDetailViewModel({
      peerId,
      campaignId: campaign.id,
      campaigns: [campaign],
    });

    expect(detail!.performance.performanceKnown).toBe(false);
    expect(detail!.performance.summary).toContain("not available");
  });

  it("serializes to JSON without raw domain objects", () => {
    const campaign = fullCampaign();
    const detail = buildMarketingCampaignDetailViewModel({
      peerId,
      campaignId: campaign.id,
      campaigns: [campaign],
    });
    const json = JSON.stringify(detail);
    expect(json).not.toContain("forbiddenWords");
    expect(json).not.toContain("MarketingDecision");
  });
});

describe("deriveMarketingCampaignNextAction", () => {
  it("prioritizes review approvals deterministically", () => {
    const action = deriveMarketingCampaignNextAction({
      peerId,
      campaignId: "c-1",
      status: "planning",
      approvalCount: 2,
      blockedItemCount: 0,
      draftIds: ["d1"],
      drafts: [{ id: "d1", status: "ready_for_review" }],
      planActivityCount: 1,
      performanceKnown: false,
      hasPublishedContent: false,
    });
    expect(action.label).toBe("Review approvals");
  });

  it("suggests generate missing creative when plan outpaces drafts", () => {
    const action = deriveMarketingCampaignNextAction({
      peerId,
      campaignId: "c-1",
      status: "planning",
      approvalCount: 0,
      blockedItemCount: 0,
      draftIds: [],
      drafts: [],
      planActivityCount: 3,
      performanceKnown: false,
      hasPublishedContent: false,
    });
    expect(action.label).toBe("Generate missing creative");
  });
});
