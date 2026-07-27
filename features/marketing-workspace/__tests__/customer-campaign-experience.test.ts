import { describe, expect, it } from "vitest";

import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import { extractCustomerPresentation } from "@/lib/peer-experience/marketing/campaign-review/campaign-review-status";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
} from "@/lib/peer-experience/marketing/runtime/identify-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime/execute-marketing-work-unit";

const projectId = "proj-1";

describe("customer campaign presentation", () => {
  it("shows needs attention when strategy is review-ready with artifact", () => {
    let unit = createWorkUnit({
      peerId: "peer-1",
      projectId,
      role: "Marketing",
      title: CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
      deliverableKind: "generic",
      channel: "Campaign",
      objective: "Strategy",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Strategy",
    });
    unit = transitionWorkUnit(
      unit,
      "review_ready",
      "review_ready",
      CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
    );

    const vm = buildCampaignReviewViewModel({
      peerId: "peer-1",
      peerName: "Emma",
      projectId,
      project: {
        id: projectId,
        peerId: "peer-1",
        title: "Launch",
        goal: "Grow",
        campaignType: "product_launch",
        createdAt: "2026-07-01T12:00:00.000Z",
        updatedAt: "2026-07-24T12:00:00.000Z",
        ownerLabel: "You",
        rawRequest: "Launch",
        campaignSetup: { approvalMode: "approval_before_publication" },
      },
      campaignDetail: {
        id: projectId,
        title: "Launch",
        status: "planning",
        statusLabel: "Planning",
        goal: { businessObjective: "Grow" },
        audience: { targetAudience: "" },
        channels: [],
        timeline: { summary: "" },
        approvalModeLabel: "Approve before publication",
        approvalQueue: { pendingCount: 0 },
        deliverableSummary: "",
        progress: 0,
        progressKnown: true,
        linkedContent: [],
        activitySummary: [],
      } as never,
      workUnits: [unit],
      strategy: { summary: "Founder-led narrative.", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
      campaignsEnabled: true,
      onboardingComplete: true,
      hasExecutionWork: true,
      approvalMode: "approval_before_publication",
    });

    expect(vm.reviewQueue).toHaveLength(1);
    const presentation = extractCustomerPresentation(vm);
    expect(presentation.campaignStatusLabel).toBe("Waiting for your review");
    expect(presentation.customerSummary).toContain("1 item");
  });

  it("shows calm empty attention when nothing to review", () => {
    const vm = buildCampaignReviewViewModel({
      peerId: "peer-1",
      peerName: "Emma",
      projectId,
      project: {
        id: projectId,
        peerId: "peer-1",
        title: "Launch",
        goal: "Grow",
        campaignType: "product_launch",
        createdAt: "2026-07-01T12:00:00.000Z",
        updatedAt: "2026-07-24T12:00:00.000Z",
        ownerLabel: "You",
        rawRequest: "Launch",
      },
      campaignDetail: {
        id: projectId,
        title: "Launch",
        status: "planning",
        statusLabel: "Planning",
        goal: { businessObjective: "Grow" },
        audience: { targetAudience: "" },
        channels: [],
        timeline: { summary: "" },
        approvalModeLabel: "Approve before publication",
        approvalQueue: { pendingCount: 0 },
        deliverableSummary: "",
        progress: 0,
        progressKnown: false,
        linkedContent: [],
        activitySummary: [],
      } as never,
      workUnits: [],
      strategy: null,
      campaignsEnabled: true,
      onboardingComplete: true,
      hasExecutionWork: false,
    });

    expect(vm.reviewQueue).toHaveLength(0);
    expect(vm.attentionMessage).toBeNull();
  });
});

describe("isMarketingCampaignInspectorEnabled", () => {
  it("matches development guard", async () => {
    const { isMarketingCampaignInspectorEnabled } = await import(
      "@/lib/peer-experience/marketing/campaign-inspector-guard"
    );
    const { isDevPlaygroundEnabled } = await import("@/lib/dev/guards");
    expect(isMarketingCampaignInspectorEnabled()).toBe(isDevPlaygroundEnabled());
  });
});
