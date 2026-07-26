import { describe, expect, it } from "vitest";

import {
  dedupeCampaignApprovalMoments,
  presentCampaignExecutionPlan,
} from "@/features/marketing-workspace/lib/campaign-execution-plan-presenter";
import { pairOnboardingDeliverablesToChannels } from "@/lib/peer-experience/marketing/campaign-onboarding";
import type { CampaignExecutionPlan } from "@/lib/campaign/planner";
import type { CampaignExecutionPlanApproval } from "@/lib/campaign/planner/types/campaign-execution-plan";
import { presentCampaignDetailHero } from "@/features/marketing-workspace/lib/campaign-detail-hero-presenter";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import { rawRequestWithExecutorOperationId } from "@/lib/peer-experience/marketing/campaign-execution";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

describe("pairOnboardingDeliverablesToChannels", () => {
  it("maps LinkedIn + Email with Social post and Email without cross-product", () => {
    const { pairs, pairingWarnings } = pairOnboardingDeliverablesToChannels({
      selectedChannels: ["linkedin", "email"],
      customChannelLabels: [],
      selectedDeliverables: ["social_post", "email", "campaign_concept"],
      customDeliverableLabels: [],
    });

    expect(pairs.map((p) => `${p.deliverableType}|${p.channelLabel}`).sort()).toEqual(
      [
        "campaign_concept|Campaign",
        "email|Email",
        "social_post|LinkedIn",
      ].sort()
    );
    expect(pairingWarnings.length).toBeGreaterThan(0);
  });

  it("creates campaign concept once at campaign level", () => {
    const { pairs } = pairOnboardingDeliverablesToChannels({
      selectedChannels: ["linkedin", "instagram"],
      customChannelLabels: [],
      selectedDeliverables: ["campaign_concept"],
      customDeliverableLabels: [],
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.channelLabel).toBe("Campaign");
  });
});

describe("presentCampaignExecutionPlan gap buckets", () => {
  const basePlan = {
    id: "p1",
    campaignId: "c1",
    organizationId: "org",
    version: 1,
    objective: "Grow",
    workPackages: [],
    executionOrder: [],
    approvals: [],
    evidence: [],
    assembledAt: "2026-07-24T12:00:00.000Z",
  } satisfies Partial<CampaignExecutionPlan>;

  it("moves strategy/plan gaps to optional improvements when ready", () => {
    const vm = presentCampaignExecutionPlan({
      plan: {
        ...basePlan,
        status: "ready",
        gaps: [
          { id: "gap-strategy", message: "internal" },
          { id: "gap-plan", message: "internal" },
        ],
      } as CampaignExecutionPlan,
    });
    expect(vm.missingInformation.some((m) => m.toLowerCase().includes("strategy"))).toBe(false);
    expect(vm.optionalImprovements.length).toBeGreaterThan(0);
  });

  it("keeps setup gaps in still needed for draft plans", () => {
    const vm = presentCampaignExecutionPlan({
      plan: {
        ...basePlan,
        status: "draft",
        gaps: [{ id: "gap-channels-deliverables", message: "internal" }],
      } as CampaignExecutionPlan,
    });
    expect(vm.missingInformation.some((m) => m.toLowerCase().includes("channel"))).toBe(true);
  });
});

describe("dedupeCampaignApprovalMoments", () => {
  it("collapses duplicate before_publication approvals", () => {
    const approvals: CampaignExecutionPlanApproval[] = [
      {
        packageId: "a",
        gate: "before_publication",
        description: "Package A",
      },
      {
        packageId: "b",
        gate: "before_publication",
        description: "Package B",
      },
    ];
    const moments = dedupeCampaignApprovalMoments(approvals, new Map());
    expect(moments).toHaveLength(1);
    expect(moments[0]?.label).toBe("Before publication");
  });
});

describe("presentCampaignDetailHero after start", () => {
  const campaign = {
    id: "proj-1",
    statusLabel: "Planning",
    status: "planning",
    nextAction: { label: "Continue planning", href: "/x", reason: "" },
    approvalQueue: { pendingCount: 0, summary: "", reviewHref: "/review" },
  } as unknown as MarketingCampaignDetailViewModel;

  const workUnit: WorkUnit = {
    id: "wu-1",
    peerId: "peer-emma",
    projectId: "proj-1",
    role: "Marketing",
    title: "Step",
    status: "planning",
    deliverableKind: "social_post",
    channel: "LinkedIn",
    objective: null,
    audience: null,
    needsVisual: false,
    recurrence: "once",
    automationTrigger: null,
    draftId: null,
    planActivityReference: null,
    rawRequest: rawRequestWithExecutorOperationId("op-1", "body"),
    startedAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
    estimatedCompletionAt: null,
    artifacts: [],
    eventLog: [],
    paused: false,
    cancelled: false,
  };

  it("shows Active and avoids Continue planning", () => {
    const hero = presentCampaignDetailHero({
      campaign,
      projectId: "proj-1",
      peerId: "peer-emma",
      peerName: "Emma",
      workUnits: [workUnit],
    });
    expect(hero.statusLabel).toBe("Active");
    expect(hero.nextActionLabel).not.toMatch(/continue planning/i);
    expect(hero.stateLine).toBeTruthy();
  });
});
