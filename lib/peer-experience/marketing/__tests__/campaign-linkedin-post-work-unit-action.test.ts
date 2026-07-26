import { describe, expect, it } from "vitest";

import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import {
  CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE,
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
} from "@/lib/peer-experience/marketing/runtime";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime";

import {
  buildLinkedInPostWorkUnitActionViewModel,
  LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
} from "@/features/marketing-workspace/lib/campaign-linkedin-post-work-unit-action-presenter";

const projectId = "proj-1";
const peerId = "peer-1";

function linkedInUnit() {
  return createWorkUnit({
    peerId,
    projectId,
    role: "Marketing",
    title: "LinkedIn post",
    deliverableKind: "linkedin",
    channel: "LinkedIn",
    objective: "Post",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Post",
  });
}

function sampleStrategy() {
  return {
    summary: "Strategy ready",
    confidence: "high" as const,
    confidenceReason: "x",
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
    generatedAt: "2026-07-24T12:00:00.000Z",
  };
}

describe("buildLinkedInPostWorkUnitActionViewModel", () => {
  it("returns null for generic channel placeholder work units", () => {
    const generic = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "LinkedIn deliverable",
      deliverableKind: "generic",
      channel: "LinkedIn",
      objective: "LinkedIn deliverable",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Package",
    });
    expect(
      buildLinkedInPostWorkUnitActionViewModel({
        campaignsEnabled: true,
        projectId,
        workUnit: generic,
        workUnits: [generic],
        strategy: sampleStrategy(),
      })
    ).toBeNull();
  });

  it("shows blocked reason when dependencies are incomplete", () => {
    const vm = buildLinkedInPostWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnit: linkedInUnit(),
      workUnits: [linkedInUnit()],
      strategy: null,
    });
    expect(vm?.blockedReason).toBe(LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE);
    expect(vm?.showPrimaryAction).toBe(false);
  });

  it("shows primary action when strategy and creative direction are complete", () => {
    let strategyUnit = createWorkUnit({
      peerId,
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
    strategyUnit = transitionWorkUnit(
      strategyUnit,
      "review_ready",
      "review_ready",
      CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
    );
    let creativeUnit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: CREATIVE_DIRECTION_WORK_UNIT_TITLE,
      deliverableKind: "generic",
      channel: "Campaign",
      objective: "Direction",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Direction",
    });
    creativeUnit = transitionWorkUnit(
      creativeUnit,
      "review_ready",
      "review_ready",
      CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
    );
    const unit = linkedInUnit();

    const vm = buildLinkedInPostWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnit: unit,
      workUnits: [strategyUnit, creativeUnit, unit],
      strategy: sampleStrategy(),
      creativeBriefByCampaignId: {
        [projectId]: {
          id: "b1",
          organizationId: "org",
          title: "Brief",
          status: "ready",
          version: 1,
          createdAt: "2026-07-24T12:00:00.000Z",
          updatedAt: "2026-07-24T12:00:00.000Z",
          campaignGoal: { summary: "Concept" },
          audience: { segmentLabel: "SMB" },
          channel: { channel: "linkedin" },
          contentType: "social_post",
          tone: { directive: "Clear" },
          cta: { primary: "Demo" },
          messagingPriorities: { primaryMessage: "Primary" },
          visualPriorities: { summary: "Visuals" },
          requiredAssets: [],
          forbiddenClaims: [],
          forbiddenWords: [],
          requiredDisclaimers: [],
          platformConstraints: {},
          outputRequirements: { deliverableSummary: "Dir" },
          approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
        },
      },
    });

    expect(vm?.showPrimaryAction).toBe(true);
    expect(vm?.primaryLabel).toBe("Let Marketing Peer prepare LinkedIn post");
  });

  it("shows primary action when prerequisite units are review_ready without strategy or brief artifacts", () => {
    let strategyUnit = createWorkUnit({
      peerId,
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
    strategyUnit = transitionWorkUnit(
      strategyUnit,
      "review_ready",
      "review_ready",
      CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
    );
    let creativeUnit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: CREATIVE_DIRECTION_WORK_UNIT_TITLE,
      deliverableKind: "generic",
      channel: "Campaign",
      objective: "Direction",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Direction",
    });
    creativeUnit = transitionWorkUnit(
      creativeUnit,
      "review_ready",
      "review_ready",
      CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
    );
    const unit = linkedInUnit();

    const vm = buildLinkedInPostWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnit: unit,
      workUnits: [strategyUnit, creativeUnit, unit],
      strategy: null,
      creativeBriefByCampaignId: {},
    });

    expect(vm?.blockedReason).toBeNull();
    expect(vm?.showPrimaryAction).toBe(true);
  });

  it("shows completion label and preview when review ready", () => {
    let unit = linkedInUnit();
    unit = transitionWorkUnit(unit, "review_ready", "review_ready", "LinkedIn post execution completed");
    const post = {
      id: "linkedin-post:1",
      workUnitId: unit.id,
      campaignId: projectId,
      hook: "Hook line",
      body: "Main copy",
      cta: "Learn more",
      hashtags: ["founders"],
      suggestedImageDescription: "Office scene",
      publishingRecommendation: "Tuesday morning",
      generatedAt: "2026-07-24T12:00:00.000Z",
    };

    const vm = buildLinkedInPostWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnit: unit,
      workUnits: [unit],
      strategy: sampleStrategy(),
      creativeBriefByCampaignId: {
        [projectId]: {
          id: "b1",
          organizationId: "org",
          title: "Brief",
          status: "ready",
          version: 1,
          createdAt: "2026-07-24T12:00:00.000Z",
          updatedAt: "2026-07-24T12:00:00.000Z",
          campaignGoal: { summary: "Concept" },
          audience: { segmentLabel: "SMB" },
          channel: { channel: "linkedin" },
          contentType: "social_post",
          tone: { directive: "Clear" },
          cta: { primary: "Demo" },
          messagingPriorities: { primaryMessage: "Primary" },
          visualPriorities: { summary: "Visuals" },
          requiredAssets: [],
          forbiddenClaims: [],
          forbiddenWords: [],
          requiredDisclaimers: [],
          platformConstraints: {},
          outputRequirements: { deliverableSummary: "Dir" },
          approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
        },
      },
      linkedinPostByWorkUnitId: { [unit.id]: post },
    });

    expect(vm?.completionLabel).toBe("LinkedIn post ready for review");
    expect(vm?.previewPost?.hook).toBe("Hook line");
    expect(vm?.showPrimaryAction).toBe(false);
  });

  it("disables primary action while executing", () => {
    const unit = linkedInUnit();
    const vm = buildLinkedInPostWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnit: unit,
      workUnits: [unit],
      strategy: sampleStrategy(),
      creativeBriefByCampaignId: {
        [projectId]: {
          id: "b1",
          organizationId: "org",
          title: "Brief",
          status: "ready",
          version: 1,
          createdAt: "2026-07-24T12:00:00.000Z",
          updatedAt: "2026-07-24T12:00:00.000Z",
          campaignGoal: { summary: "Concept" },
          audience: { segmentLabel: "SMB" },
          channel: { channel: "linkedin" },
          contentType: "social_post",
          tone: { directive: "Clear" },
          cta: { primary: "Demo" },
          messagingPriorities: { primaryMessage: "Primary" },
          visualPriorities: { summary: "Visuals" },
          requiredAssets: [],
          forbiddenClaims: [],
          forbiddenWords: [],
          requiredDisclaimers: [],
          platformConstraints: {},
          outputRequirements: { deliverableSummary: "Dir" },
          approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
        },
      },
      executingWorkUnitId: unit.id,
      localPending: true,
    });

    expect(vm?.primaryDisabled).toBe(true);
    expect(vm?.primaryLabel).toBe("Marketing Peer is writing your LinkedIn post...");
  });
});
