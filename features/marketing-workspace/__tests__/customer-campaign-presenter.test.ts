import { describe, expect, it } from "vitest";

import { getMarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import {
  buildLocalizedCampaignHeader,
  buildPeerPresencePresentation,
  collectAttentionItems,
  collectPreparedCompletedItems,
  collectPreparedOverviewItems,
  deliverableActionLabel,
  deliverableBadgeKey,
  presentCampaignPhases,
} from "../lib/customer-campaign-presenter";

const copy = getMarketingCampaignCopy("en");

function minimalVm(overrides: Parameters<typeof buildCampaignReviewViewModel>[0]) {
  return buildCampaignReviewViewModel(overrides);
}

describe("customer campaign presenter", () => {
  it("exposes one primary review CTA in waiting state", () => {
    const vm = minimalVm({
      peerId: "p",
      peerName: "Emma",
      projectId: "proj",
      project: {
        id: "proj",
        peerId: "p",
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
        id: "proj",
        title: "Launch",
        status: "planning",
        statusLabel: "Planning",
        goal: { businessObjective: "Grow" },
        audience: { targetAudience: "" },
        channels: [],
        timeline: { summary: "" },
        approvalModeLabel: "Approve",
        approvalQueue: { pendingCount: 0 },
        deliverableSummary: "",
        progress: 0,
        progressKnown: true,
        linkedContent: [],
        activitySummary: [],
      } as never,
      workUnits: [],
      strategy: { summary: "S", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
      campaignsEnabled: true,
      onboardingComplete: true,
      hasExecutionWork: true,
      approvalMode: "approval_before_publication",
    });

    const header = buildLocalizedCampaignHeader(vm, copy, {
      continuationRunning: false,
      hideStartCampaign: false,
      canStartCampaign: true,
      canContinueCampaign: true,
    });
    expect(header.primaryActionLabel).toBe(copy.reviewPrimaryCta(vm.reviewQueue.length));
  });

  it("does not duplicate attention items in prepared overview", () => {
    const vm = minimalVm({
      peerId: "p",
      peerName: "Emma",
      projectId: "proj",
      project: {
        id: "proj",
        peerId: "p",
        title: "Launch",
        goal: "Grow",
        campaignType: "product_launch",
        createdAt: "2026-07-01T12:00:00.000Z",
        updatedAt: "2026-07-24T12:00:00.000Z",
        ownerLabel: "You",
        rawRequest: "Launch",
      },
      campaignDetail: {
        id: "proj",
        title: "Launch",
        status: "planning",
        statusLabel: "Planning",
        goal: { businessObjective: "Grow" },
        audience: { targetAudience: "" },
        channels: [],
        timeline: { summary: "" },
        approvalModeLabel: "Approve",
        approvalQueue: { pendingCount: 0 },
        deliverableSummary: "",
        progress: 0,
        progressKnown: false,
        linkedContent: [],
        activitySummary: [],
      } as never,
      workUnits: [],
      strategy: { summary: "S", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
      campaignsEnabled: true,
      onboardingComplete: true,
      hasExecutionWork: true,
    });

    const attention = collectAttentionItems(vm);
    const prepared = collectPreparedOverviewItems(vm);
    const overlap = prepared.filter((p) => attention.some((a) => a.id === p.id));
    expect(overlap).toHaveLength(0);
  });

  it("marks publish and measure as not available yet", () => {
    const vm = minimalVm({
      peerId: "p",
      peerName: "Emma",
      projectId: "proj",
      project: {
        id: "proj",
        peerId: "p",
        title: "Launch",
        goal: "Grow",
        campaignType: "product_launch",
        createdAt: "2026-07-01T12:00:00.000Z",
        updatedAt: "2026-07-24T12:00:00.000Z",
        ownerLabel: "You",
        rawRequest: "Launch",
      },
      campaignDetail: {
        id: "proj",
        title: "Launch",
        status: "planning",
        statusLabel: "Planning",
        goal: { businessObjective: "Grow" },
        audience: { targetAudience: "" },
        channels: [],
        timeline: { summary: "" },
        approvalModeLabel: "Approve",
        approvalQueue: { pendingCount: 0 },
        deliverableSummary: "",
        progress: 0,
        progressKnown: false,
        linkedContent: [],
        activitySummary: [],
      } as never,
      workUnits: [],
      campaignsEnabled: true,
      onboardingComplete: true,
      hasExecutionWork: true,
    });
    const phases = presentCampaignPhases(vm.progress.phases, copy);
    const publish = phases.find((p) => p.id === "publish");
    const measure = phases.find((p) => p.id === "measure");
    expect(publish?.state).toBe("not_available");
    expect(measure?.state).toBe("not_available");
  });

  it("uses View for approved deliverables", () => {
    const item = {
      inReviewQueue: false,
      decisionStatus: "approved",
      preview: {},
      artifactType: "campaign_strategy",
    } as never;
    expect(deliverableBadgeKey(item)).toBe("approved");
    expect(deliverableActionLabel(item, copy)).toBe(copy.viewDeliverable);
  });

  it("builds peer presence narrative for waiting review", () => {
    const vm = minimalVm({
      peerId: "p",
      peerName: "Emma",
      projectId: "proj",
      project: {
        id: "proj",
        peerId: "p",
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
        id: "proj",
        title: "Launch",
        status: "planning",
        statusLabel: "Planning",
        goal: { businessObjective: "Grow" },
        audience: { targetAudience: "" },
        channels: [],
        timeline: { summary: "" },
        approvalModeLabel: "Approve",
        approvalQueue: { pendingCount: 0 },
        deliverableSummary: "",
        progress: 0,
        progressKnown: true,
        linkedContent: [],
        activitySummary: [],
      } as never,
      workUnits: [],
      strategy: { summary: "S", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
      campaignsEnabled: true,
      onboardingComplete: true,
      hasExecutionWork: true,
      approvalMode: "approval_before_publication",
    });
    const presence = buildPeerPresencePresentation(vm, copy, "Launch", {
      continuationRunning: false,
      hideStartCampaign: false,
      canStartCampaign: true,
    });
    expect(presence.key).toBe("needs_review");
    expect(presence.narrative).toContain("waiting");
  });
});
