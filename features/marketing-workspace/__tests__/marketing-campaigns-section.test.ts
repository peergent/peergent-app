import { describe, expect, it, vi, afterEach } from "vitest";

import { assembleCampaign } from "@/lib/campaign";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";
import { MARKETING_PEER_TABS } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import {
  isMarketingCampaignWorkspaceEnabled,
  marketingCampaignWorkspaceEnabled,
} from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import {
  buildMarketingCampaignsViewModel,
  buildMarketingCampaignViewModelSourceFromDomainInput,
  MARKETING_PLAN_FALLBACK_CAMPAIGN_ID,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-campaigns-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  assertCustomerSafeCampaignPresentation,
  presentMarketingCampaignCard,
  presentMarketingCampaignsEmptyMessage,
} from "../lib/marketing-campaign-card-presenter";

const assembledAt = "2026-07-20T12:00:00.000Z";

const baseDomainInput = {
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
  projects: [],
  responsibilities: [],
  automations: [],
  connections: [],
} satisfies MarketingPeerDomainInput;

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
      scheduledWeek: 2,
      rationale: { why: "Launch" },
      linkedStrategyItems: [],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

describe("marketing workspace campaigns section (presenter)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders assembled campaign presentation with progress", () => {
    const campaign = assembleCampaign({
      organizationId: "org-1",
      campaignId: "campaign-ui-1",
      name: "Launch",
      assembledAt,
      status: "planning",
      progress: { percentComplete: 40 },
    });
    const vm = buildMarketingCampaignsViewModel({
      peerId: "peer-emma",
      campaigns: [campaign],
    });
    const presentation = presentMarketingCampaignCard(vm.items[0]!);
    expect(presentation.progressLabel).toBe("40%");
    assertCustomerSafeCampaignPresentation(presentation);
  });

  it("shows not measured yet for plan fallback", () => {
    const vm = buildMarketingCampaignsViewModel({
      peerId: "peer-emma",
      plan: samplePlan,
    });
    const presentation = presentMarketingCampaignCard(vm.items[0]!);
    expect(presentation.progressLabel).toBe("Not measured yet");
    expect(presentation.statusLabel).toBe("Planning");
  });

  it("shows blocked state and counts", () => {
    const draft: MarketingContentDraft = {
      id: "d1",
      planActivityReference: "LinkedIn post",
      contentType: "linkedin_post",
      objective: "x",
      title: "Post",
      body: "b",
      keywords: [],
      rationale: { why: "y", planActivityReference: "LinkedIn post", strategyLinks: [] },
      sourceReferences: [],
      confidence: "moderate",
      status: "ready_for_review",
      warnings: [],
      generatedAt: assembledAt,
    };
    const vm = buildMarketingCampaignsViewModel({
      peerId: "peer-emma",
      plan: samplePlan,
      drafts: [draft],
    });
    const item = vm.items[0]!;
    expect(item.approvalCount).toBe(1);
    expect(item.generatedContentCount).toBe(1);
    const presentation = presentMarketingCampaignCard(item);
    expect(presentation.approvalLine).toContain("Waiting for approval");
    expect(presentation.contentLine).toContain("Content created");
  });

  it("disables link for synthetic fallback campaign", () => {
    const vm = buildMarketingCampaignsViewModel({ peerId: "peer-emma", plan: samplePlan });
    expect(vm.items[0]?.id).toBe(MARKETING_PLAN_FALLBACK_CAMPAIGN_ID);
    expect(vm.items[0]?.linkEnabled).toBe(false);
  });

  it("enables link when campaign id matches a project", () => {
    const campaign = assembleCampaign({
      organizationId: "org-1",
      campaignId: "project-42",
      name: "Linked project campaign",
      assembledAt,
    });
    const vm = buildMarketingCampaignsViewModel({
      peerId: "peer-emma",
      campaigns: [campaign],
      projects: [
        {
          id: "project-42",
          peerId: "peer-emma",
          title: "Linked project campaign",
          goal: "Grow",
          campaignType: "linkedin_campaign",
          createdAt: assembledAt,
          updatedAt: assembledAt,
          ownerLabel: "Alex",
          rawRequest: "Launch",
        },
      ],
    });
    expect(vm.items[0]?.linkEnabled).toBe(true);
    expect(vm.items[0]?.href).toContain("project-42");
  });

  it("uses customer-friendly empty copy", () => {
    const vm = buildMarketingCampaignsViewModel({ peerId: "peer-emma" });
    expect(vm.items).toHaveLength(0);
    expect(presentMarketingCampaignsEmptyMessage("Emma")).toContain("has not set up a campaign");
  });

  it("builds source from domain input without mutation", () => {
    const input: MarketingPeerDomainInput = {
      ...baseDomainInput,
      plan: samplePlan,
    };
    const before = JSON.stringify(input);
    const source = buildMarketingCampaignViewModelSourceFromDomainInput(input);
    expect(source.plan?.summary).toBe("Launch plan");
    expect(JSON.stringify(input)).toBe(before);
  });

  it("feature flag defaults off", () => {
    expect(marketingCampaignWorkspaceEnabled.default).toBe(false);
    expect(isMarketingCampaignWorkspaceEnabled()).toBe(false);
  });

  it("feature flag respects env when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_MARKETING_CAMPAIGN_WORKSPACE_ENABLED", "true");
    expect(isMarketingCampaignWorkspaceEnabled()).toBe(true);
  });

  it("preserves existing marketing workspace tabs", () => {
    expect(MARKETING_PEER_TABS.map((t) => t.id)).toContain("work");
    expect(MARKETING_PEER_TABS.map((t) => t.id)).toContain("content");
    expect(MARKETING_PEER_TABS).toHaveLength(9);
  });
});
