import { describe, expect, it } from "vitest";

import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

import {
  buildCampaignStrategyReviewPreview,
  buildCreativeDirectionReviewPreview,
  buildEmailReviewPreview,
  buildLinkedInReviewPreview,
} from "../campaign-review-artifact-presenter";
import { extractCustomerPresentation } from "../campaign-review-status";
import { buildCampaignReviewViewModel } from "../build-campaign-review-view-model";
import type { CampaignReviewBuildInput } from "../campaign-review-types";
import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
} from "../../runtime/identify-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "../../runtime/execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "../../runtime/execute-creative-direction-work-unit";

const projectId = "proj-1";
const peerId = "peer-1";

function sampleCampaignDetail() {
  return {
    id: projectId,
    title: "Summer launch",
    status: "planning" as const,
    statusLabel: "Planning",
    goal: { businessObjective: "Grow pipeline" },
    audience: { targetAudience: "SMB leaders" },
    channels: ["LinkedIn", "Email"],
    timeline: { summary: "Q3" },
    approvalModeLabel: "Approve before publication",
    approvalQueue: { pendingCount: 0 },
    deliverableSummary: "Strategy and content",
    progress: 25,
    progressKnown: true,
    linkedContent: [],
    activitySummary: [],
  } as never;
}

function sampleProject() {
  return {
    id: projectId,
    peerId,
    title: "Summer launch",
    goal: "Grow pipeline",
    campaignType: "product_launch" as const,
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
    ownerLabel: "You",
    rawRequest: "Launch",
    campaignSetup: { approvalMode: "approval_before_publication" as const },
  };
}

function baseInput(overrides: Partial<CampaignReviewBuildInput> = {}): CampaignReviewBuildInput {
  return {
    peerId,
    peerName: "Emma",
    projectId,
    project: sampleProject(),
    campaignDetail: sampleCampaignDetail(),
    workUnits: [],
    strategy: null,
    creativeBriefByCampaignId: {},
    linkedinPostByWorkUnitId: {},
    emailByWorkUnitId: {},
    approvalMode: "approval_before_publication",
    campaignsEnabled: true,
    onboardingComplete: true,
    hasExecutionWork: true,
    ...overrides,
  };
}

describe("buildCampaignReviewViewModel", () => {
  it("builds strategy review item with preview when artifact exists", () => {
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

    const vm = buildCampaignReviewViewModel(
      baseInput({
        workUnits: [strategyUnit],
        strategy: {
          summary: "Lead with founder POV.",
          generatedAt: "2026-07-24T12:00:00.000Z",
          positioningRecommendations: [{ recommendation: "Premium peer OS" }],
          contentPillars: [{ name: "Trust" }],
          campaignIdeas: [],
          socialMediaStrategy: [{ platform: "LinkedIn" }],
        } as never,
      })
    );

    const strategyItem = vm.allReviewItems.find(
      (i) => i.artifactType === "campaign_strategy"
    );
    expect(strategyItem?.preview?.kind).toBe("campaign_strategy");
    expect(strategyItem?.status).toBe("awaiting_review");
    expect(vm.reviewQueue).toHaveLength(1);
    expect(vm.needsAttention).toBe(true);
  });

  it("does not mark review-ready creative without artifact as reviewable", () => {
    let creativeUnit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: CREATIVE_DIRECTION_WORK_UNIT_TITLE,
      deliverableKind: "generic",
      channel: "Campaign",
      objective: "Creative",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Creative",
    });
    creativeUnit = transitionWorkUnit(
      creativeUnit,
      "review_ready",
      "review_ready",
      CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
    );

    const vm = buildCampaignReviewViewModel(
      baseInput({
        workUnits: [creativeUnit],
        creativeBriefByCampaignId: {},
      })
    );

    const item = vm.allReviewItems.find((i) => i.artifactType === "creative_direction");
    expect(item?.preview).toBeNull();
    expect(vm.reviewQueue.some((i) => i.artifactType === "creative_direction")).toBe(false);
  });

  it("orders review queue strategy before creative before content", () => {
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
      objective: "Creative",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Creative",
    });
    creativeUnit = transitionWorkUnit(
      creativeUnit,
      "review_ready",
      "review_ready",
      CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
    );

    const linkedInUnit = createWorkUnit({
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
      rawRequest: "LinkedIn",
    });
    const linkedInReady = transitionWorkUnit(
      linkedInUnit,
      "review_ready",
      "review_ready",
      "LinkedIn post execution completed"
    );

    const vm = buildCampaignReviewViewModel(
      baseInput({
        workUnits: [creativeUnit, linkedInReady, strategyUnit],
        strategy: {
          summary: "S",
          generatedAt: "2026-07-24T12:00:00.000Z",
          positioningRecommendations: [],
          contentPillars: [],
          campaignIdeas: [],
          socialMediaStrategy: [],
        } as never,
        creativeBriefByCampaignId: {
          [projectId]: {
            campaignGoal: { summary: "Concept" },
            tone: { directive: "Warm" },
            messagingPriorities: { primaryMessage: "Primary" },
            visualPriorities: { summary: "Clean" },
            cta: { primary: "Start" },
            forbiddenClaims: [],
            forbiddenWords: [],
            requiredDisclaimers: [],
            outputRequirements: { deliverableSummary: "Direction" },
          } as never,
        },
        linkedinPostByWorkUnitId: {
          [linkedInReady.id]: {
            hook: "Hook",
            body: "Body content here",
            cta: "Learn more",
            hashtags: ["#peergent"],
            suggestedImageDescription: "Founder desk",
            publishingRecommendation: "Tuesday morning",
          } as never,
        },
      })
    );

    expect(vm.reviewQueue.map((i) => i.artifactType)).toEqual([
      "campaign_strategy",
      "creative_direction",
      "linkedin_post",
    ]);
  });

  it("uses customer-safe presentation without internal enums", () => {
    const vm = buildCampaignReviewViewModel(baseInput({ hasExecutionWork: false, onboardingComplete: false }));
    const presentation = extractCustomerPresentation(vm);
    expect(presentation.campaignStatusLabel).toBe("Setup required");
    expect(presentation.customerSummary.toLowerCase()).not.toContain("work unit");
  });
});

describe("campaign-review-artifact-presenter", () => {
  it("maps LinkedIn and Email previews without inventing fields", () => {
    const linkedIn = buildLinkedInReviewPreview({
      hook: "Hook",
      body: "Body",
      cta: "CTA",
      hashtags: ["#a"],
      suggestedImageDescription: "Image",
      publishingRecommendation: "Soon",
    } as never);
    expect(linkedIn.mainContent).toBe("Body");

    const email = buildEmailReviewPreview({
      subject: "Subject",
      previewText: "Preview",
      body: "Body long enough",
      cta: "Go",
    } as never);
    expect(email.secondaryCta).toBeUndefined();

    const strategy = buildCampaignStrategyReviewPreview({
      project: sampleProject(),
      strategy: {
        summary: "Summary",
        positioningRecommendations: [],
        contentPillars: [],
        campaignIdeas: [],
        socialMediaStrategy: [],
        generatedAt: "2026-07-24T12:00:00.000Z",
      } as never,
    });
    expect(strategy.summary).toBe("Summary");

    const creative = buildCreativeDirectionReviewPreview({
      campaignGoal: { summary: "Concept", successMetric: "Angle" },
      tone: { directive: "Calm" },
      messagingPriorities: { primaryMessage: "One", supportingMessages: [] },
      visualPriorities: { summary: "Minimal" },
      cta: { primary: "Start" },
      forbiddenClaims: [],
      forbiddenWords: [],
      requiredDisclaimers: [],
      outputRequirements: { deliverableSummary: "Brief" },
    } as never);
    expect(creative.campaignAngle).toBe("Angle");
  });
});
