import { describe, expect, it, vi, afterEach } from "vitest";

import { assembleCampaign } from "@/lib/campaign";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import { MARKETING_PEER_TABS } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import {
  isMarketingCampaignWorkspaceEnabled,
  marketingCampaignWorkspaceEnabled,
} from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import {
  assertCustomerSafeCampaignPresentation,
  presentMarketingCampaignCard,
  presentMarketingCampaignsEmptyMessage,
  shouldRenderCampaignCardNextActionAsLink,
  truncateCampaignText,
} from "@/features/marketing-workspace/lib/marketing-campaign-card-presenter";
import {
  countDeliverableApprovalStates,
  presentCampaignConciseGoal,
} from "@/features/marketing-workspace/lib/campaign-detail-presenter";
import { buildMarketingCampaignDetailViewModel } from "../build-marketing-campaign-detail-view-model";
import {
  buildMarketingCampaignsViewModel,
  buildMarketingCampaignViewModelSourceFromDomainInput,
  MARKETING_PLAN_FALLBACK_CAMPAIGN_ID,
} from "../build-marketing-campaigns-view-model";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "../build-project-campaign-projection";
import type { MarketingPeerDomainInput } from "../marketing-peer-domain-input";

const assembledAt = "2026-07-20T12:00:00.000Z";

const longStrategySummary =
  "Inbound demand from SMB founders across multiple regions with a comprehensive multi-channel narrative that should never appear in full on a compact card.";

const samplePlan: MarketingPlan = {
  summary: longStrategySummary,
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

const baseDomainInput = {
  peerId: "peer-emma",
  peerName: "Emma",
  userName: "Alex",
  campaignTitle: "Campaign",
  generating: null,
  generatingActivity: null,
  understanding: null,
  strategy: null,
  plan: samplePlan,
  drafts: [],
  publicationPackages: [],
  activityFeed: [],
  workUnits: [],
  projects: [],
  responsibilities: [],
  automations: [],
  connections: [],
} satisfies MarketingPeerDomainInput;

describe("marketing campaign UI presenters", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not expose long strategy text on compact fallback cards", () => {
    const vm = buildMarketingCampaignsViewModel({ peerId: "peer-emma", plan: samplePlan });
    const presentation = presentMarketingCampaignCard(vm.items[0]!);
    expect(presentation.goalLine).not.toContain(longStrategySummary);
    expect(presentation.goalLine!.length).toBeLessThan(100);
    assertCustomerSafeCampaignPresentation(presentation);
  });

  it("truncates concise goal presentation", () => {
    const truncated = truncateCampaignText(longStrategySummary, 80);
    expect(truncated.endsWith("…")).toBe(true);
    expect(truncated.length).toBeLessThanOrEqual(80);
  });

  it("links real project campaign cards", () => {
    const vm = buildMarketingCampaignsViewModel({
      peerId: "peer-emma",
      plan: samplePlan,
      projects: [
        {
          id: "project-99",
          peerId: "peer-emma",
          title: "Launch",
          goal: "Grow pipeline",
          campaignType: "linkedin_campaign",
          createdAt: assembledAt,
          updatedAt: assembledAt,
          ownerLabel: "Alex",
          rawRequest: "Launch",
        },
      ],
    });
    expect(vm.items).toHaveLength(1);
    expect(vm.items[0]?.id).toBe("project-99");
    expect(vm.items[0]?.linkEnabled).toBe(true);
    expect(vm.items[0]?.href).toContain("project-99");
  });

  it("keeps synthetic fallback non-clickable", () => {
    const vm = buildMarketingCampaignsViewModel({ peerId: "peer-emma", plan: samplePlan });
    expect(vm.items[0]?.id).toBe(MARKETING_PLAN_FALLBACK_CAMPAIGN_ID);
    expect(vm.items[0]?.linkEnabled).toBe(false);
  });

  it("shows not measured yet for plan-only fallback", () => {
    const vm = buildMarketingCampaignsViewModel({ peerId: "peer-emma", plan: samplePlan });
    const presentation = presentMarketingCampaignCard(vm.items[0]!);
    expect(presentation.progressLabel).toBe("Not measured yet");
  });

  it("builds detail for a real project", () => {
    const input: MarketingPeerDomainInput = {
      ...baseDomainInput,
      projects: [
        {
          id: "project-detail-1",
          peerId: "peer-emma",
          title: "Summer launch",
          goal: "Increase signups",
          campaignType: "product_launch",
          createdAt: assembledAt,
          updatedAt: assembledAt,
          ownerLabel: "Alex",
          rawRequest: "Launch",
        },
      ],
    };
    const detail = buildMarketingCampaignDetailViewModel(
      buildMarketingCampaignDetailSourceFromDomainInput(input, "project-detail-1")
    );
    expect(detail?.title).toBe("Summer launch");
    expect(detail?.performance.summary).toBe("Performance not available yet.");
  });

  it("shows approval pending count for project-scoped drafts", () => {
    const draft: MarketingContentDraft = {
      id: "d-pending",
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
    const input: MarketingPeerDomainInput = {
      ...baseDomainInput,
      drafts: [draft],
      workUnits: [
        {
          id: "wu-1",
          peerId: "peer-emma",
          projectId: "project-approvals",
          role: "marketing",
          title: "Post",
          status: "review_ready",
          deliverableKind: "social_post",
          channel: "LinkedIn",
          objective: null,
          audience: null,
          needsVisual: false,
          recurrence: "once",
          automationTrigger: null,
          draftId: "d-pending",
          planActivityReference: "LinkedIn post",
          rawRequest: "x",
          startedAt: assembledAt,
          updatedAt: assembledAt,
          estimatedCompletionAt: null,
          artifacts: [],
          eventLog: [],
          paused: false,
          cancelled: false,
        },
      ],
      projects: [
        {
          id: "project-approvals",
          peerId: "peer-emma",
          title: "Approvals",
          goal: "Goal",
          campaignType: "linkedin_campaign",
          createdAt: assembledAt,
          updatedAt: assembledAt,
          ownerLabel: "Alex",
          rawRequest: "x",
        },
      ],
    };
    const detail = buildMarketingCampaignDetailViewModel(
      buildMarketingCampaignDetailSourceFromDomainInput(input, "project-approvals")
    );
    expect(detail!.approvalQueue.pendingCount).toBe(1);
  });

  it("uses customer language in detail goal presenter", () => {
    const goal = presentCampaignConciseGoal({
      id: "x",
      title: "T",
      goal: {
        businessObjective: "Grow",
        marketingObjective: "Grow",
        successMetrics: [],
      },
      status: "planning",
      statusLabel: "Planning",
      progress: 0,
      progressKnown: false,
      audience: { targetAudience: "", personas: [], segments: [] },
      channels: [],
      timeline: { summary: "", milestones: [] },
      approvalModeLabel: "Approve before publication",
      workforce: [],
      deliverableSummary: "",
      approvalQueue: { pendingCount: 0, summary: "", reviewHref: "/review" },
      performance: {
        summary: "",
        kpiLabels: [],
        performanceKnown: false,
        performanceHref: "/perf",
      },
      recommendations: [],
      nextAction: { label: "Continue", reason: "", href: "/work" },
      activitySummary: [],
      linkedContent: [],
      creativeBriefReferences: [],
      warnings: [],
      lastUpdated: assembledAt,
      href: "/projects/x",
    });
    expect(goal).toBe("Goal: Grow");
    expect(JSON.stringify(goal).toLowerCase()).not.toContain("creative brief");
  });

  it("counts approved deliverables from status labels", () => {
    const counts = countDeliverableApprovalStates([
      {
        id: "1",
        title: "A",
        channelLabel: "LinkedIn",
        statusLabel: "Needs review",
        href: "/content/1",
      },
      {
        id: "2",
        title: "B",
        channelLabel: "LinkedIn",
        statusLabel: "Approved",
        href: "/content/2",
      },
    ]);
    expect(counts.approved).toBe(1);
  });

  it("enables link when assembled campaign id matches project", () => {
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
  });

  it("builds source from domain input without mutation", () => {
    const input: MarketingPeerDomainInput = { ...baseDomainInput };
    const before = JSON.stringify(input);
    buildMarketingCampaignViewModelSourceFromDomainInput(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("feature flag defaults off", () => {
    expect(marketingCampaignWorkspaceEnabled.default).toBe(false);
    expect(isMarketingCampaignWorkspaceEnabled()).toBe(false);
  });

  it("preserves existing marketing workspace tabs when flag off", () => {
    expect(MARKETING_PEER_TABS.map((t) => t.id)).toContain("work");
    expect(MARKETING_PEER_TABS).toHaveLength(4);
  });

  it("does not nest next-action links inside linked campaign cards", () => {
    expect(shouldRenderCampaignCardNextActionAsLink(true)).toBe(false);
    expect(shouldRenderCampaignCardNextActionAsLink(false)).toBe(true);
  });
});
