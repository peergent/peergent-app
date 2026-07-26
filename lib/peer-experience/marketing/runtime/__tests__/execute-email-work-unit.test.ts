import { describe, expect, it, vi } from "vitest";

import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import { createMarketingBundle } from "@/lib/prompt-builder/__tests__/fixtures";

import { isEmailCampaignWorkUnit } from "../identify-work-unit";
import { CAMPAIGN_STRATEGY_WORK_UNIT_TITLE, CREATIVE_DIRECTION_WORK_UNIT_TITLE } from "../identify-work-unit";
import { executeEmailCampaignWorkUnit } from "../execute-email-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "../execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "../execute-creative-direction-work-unit";
import { LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE } from "../linkedin-post-dependencies";

const assembledAt = "2026-07-24T12:00:00.000Z";
const peerId = "peer-1";
const organizationId = "org-1";
const userId = "user-1";

function sampleStrategy() {
  return {
    summary: "Lead with founder-led thought leadership.",
    confidence: "high" as const,
    confidenceReason: "Strong context.",
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
    generatedAt: assembledAt,
  };
}

function sampleCreativeBrief() {
  return {
    id: "brief-1",
    organizationId: "org-1",
    title: "Creative direction",
    status: "ready" as const,
    version: 1,
    createdAt: assembledAt,
    updatedAt: assembledAt,
    campaignGoal: { summary: "Concept", successMetric: "Angle" },
    audience: { segmentLabel: "SMB" },
    channel: { channel: "email" as const },
    contentType: "newsletter" as const,
    tone: { directive: "Confident" },
    cta: { primary: "Start trial" },
    messagingPriorities: { primaryMessage: "Primary", supportingMessages: ["Support"] },
    visualPriorities: { summary: "Minimal visuals" },
    requiredAssets: [],
    forbiddenClaims: [],
    forbiddenWords: [],
    requiredDisclaimers: [],
    platformConstraints: {},
    outputRequirements: { deliverableSummary: "Direction" },
    approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
  };
}

function emailUnit(projectId: string) {
  return createWorkUnit({
    peerId,
    projectId,
    role: "Marketing",
    title: "Launch newsletter",
    deliverableKind: "newsletter",
    channel: "Email",
    objective: "Newsletter",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Email content",
  });
}

function domainInput(overrides: Record<string, unknown>) {
  return {
    peerId,
    organizationId,
    userName: "You",
    peerName: "Emma",
    campaignTitle: "Campaign",
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: sampleStrategy(),
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    responsibilities: [],
    automations: [],
    connections: [],
    ...overrides,
  };
}

describe("executeEmailCampaignWorkUnit", () => {
  it("identifies email campaign work units", () => {
    expect(isEmailCampaignWorkUnit(emailUnit("p1"))).toBe(true);
  });

  it("blocks when dependencies are missing", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = emailUnit(project.id);
    const generateEmailCampaign = vi.fn();

    const result = await executeEmailCampaignWorkUnit(
      {
        workUnitId: unit.id,
        organizationId,
        userId,
        assembledAt,
        domainInput: domainInput({
          strategy: null,
          workUnits: [unit],
          projects: [project],
        }),
        persistence: {
          saveStrategy: () => undefined,
          saveEmailCampaign: () => undefined,
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn(),
        generateStrategy: vi.fn(),
        generateCreativeBrief: vi.fn(),
        generateLinkedInPost: vi.fn(),
        generateEmailCampaign,
      }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toBe(LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE);
    expect(generateEmailCampaign).not.toHaveBeenCalled();
  });

  it("blocks when lifecycle deps pass but creative brief artifact is missing from workspace", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    let strategyUnit = createWorkUnit({
      peerId,
      projectId: project.id,
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
      projectId: project.id,
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
    const unit = emailUnit(project.id);
    const generateEmailCampaign = vi.fn();

    const result = await executeEmailCampaignWorkUnit(
      {
        workUnitId: unit.id,
        organizationId,
        userId,
        assembledAt,
        domainInput: domainInput({
          strategy: sampleStrategy(),
          workUnits: [strategyUnit, creativeUnit, unit],
          projects: [project],
          creativeBriefByCampaignId: {},
        }),
        persistence: {
          saveStrategy: () => undefined,
          saveEmailCampaign: () => undefined,
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn(),
        generateStrategy: vi.fn(),
        generateCreativeBrief: vi.fn(),
        generateLinkedInPost: vi.fn(),
        generateEmailCampaign,
      }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureStage).toBe("resolve_project");
    expect(result.message).toBe("More campaign information is required.");
    expect(generateEmailCampaign).not.toHaveBeenCalled();
  });

  it("restores planning after generation failure and does not save email", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = emailUnit(project.id);
    const brief = sampleCreativeBrief();
    const contextPackage = assembleContextPackage(createMarketingBundle(), {
      taskHint: "Email",
    });

    let saved = false;
    const result = await executeEmailCampaignWorkUnit(
      {
        workUnitId: unit.id,
        organizationId,
        userId,
        assembledAt,
        domainInput: domainInput({
          workUnits: [unit],
          projects: [project],
          creativeBriefByCampaignId: { [project.id]: brief },
        }),
        persistence: {
          saveStrategy: () => undefined,
          saveEmailCampaign: () => {
            saved = true;
          },
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn().mockResolvedValue(contextPackage),
        generateStrategy: vi.fn(),
        generateCreativeBrief: vi.fn(),
        generateLinkedInPost: vi.fn(),
        generateEmailCampaign: vi.fn().mockResolvedValue({
          success: false,
          error: "Model unavailable",
          warnings: [],
          traceId: "t1",
        }),
      }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureStage).toBe("generate_email_campaign");
    expect(result.workUnit?.status).toBe("planning");
    expect(saved).toBe(false);
  });

  it("generates and persists email when dependencies are met", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = emailUnit(project.id);
    const brief = sampleCreativeBrief();
    const email = {
      id: `email-campaign:${unit.id}`,
      workUnitId: unit.id,
      campaignId: project.id,
      subject: "Subject line",
      previewText: "Preview here",
      body: "X".repeat(50),
      cta: "Get started",
      createdAt: assembledAt,
      updatedAt: assembledAt,
    };

    const contextPackage = assembleContextPackage(createMarketingBundle(), {
      taskHint: "Email",
    });

    let saved: typeof email | null = null;
    const result = await executeEmailCampaignWorkUnit(
      {
        workUnitId: unit.id,
        organizationId,
        userId,
        assembledAt,
        domainInput: domainInput({
          workUnits: [unit],
          projects: [project],
          creativeBriefByCampaignId: { [project.id]: brief },
        }),
        persistence: {
          saveStrategy: () => undefined,
          saveEmailCampaign: ({ email: e }) => {
            saved = e;
          },
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn().mockResolvedValue(contextPackage),
        generateStrategy: vi.fn(),
        generateCreativeBrief: vi.fn(),
        generateLinkedInPost: vi.fn(),
        generateEmailCampaign: vi.fn().mockResolvedValue({
          success: true,
          email,
          warnings: [],
          traceId: "t1",
        }),
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("email_campaign");
    expect(result.workUnit.status).toBe("review_ready");
    expect(saved?.subject).toBe("Subject line");
  });
});
