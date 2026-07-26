import { describe, expect, it, vi } from "vitest";

import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import { createMarketingBundle } from "@/lib/prompt-builder/__tests__/fixtures";

import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
  isLinkedInPostWorkUnit,
} from "../identify-work-unit";
import { executeLinkedInPostWorkUnit } from "../execute-linkedin-post-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "../execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "../execute-creative-direction-work-unit";
import {
  validateLinkedInPostWorkUnitOutput,
  mapLinkedInPostToWorkUnitOutput,
} from "../validate-linkedin-post-output";
import { LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE } from "../linkedin-post-dependencies";
import { parseMarketingLinkedInPostResponse } from "@/lib/marketing-intelligence/linkedin-post-generation";

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

function sampleCreativeBrief(projectId: string) {
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
    channel: { channel: "linkedin" as const },
    contentType: "social_post" as const,
    tone: { directive: "Confident" },
    cta: { primary: "Start trial" },
    messagingPriorities: { primaryMessage: "Primary", supportingMessages: ["Support"] },
    visualPriorities: { summary: "Minimal founder visuals" },
    requiredAssets: [],
    forbiddenClaims: [],
    forbiddenWords: [],
    requiredDisclaimers: [],
    platformConstraints: {},
    outputRequirements: { deliverableSummary: "Direction" },
    approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
  };
}

function linkedInUnit(projectId: string) {
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
    rawRequest: "LinkedIn content package",
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

describe("linkedin post runtime", () => {
  it("identifies LinkedIn post work units from planner shape", () => {
    expect(isLinkedInPostWorkUnit(linkedInUnit("p1"))).toBe(true);
    expect(
      isLinkedInPostWorkUnit(
        createWorkUnit({
          peerId,
          projectId: "p1",
          role: "Marketing",
          title: CREATIVE_DIRECTION_WORK_UNIT_TITLE,
          deliverableKind: "generic",
          channel: "Campaign",
          objective: "x",
          audience: null,
          needsVisual: false,
          recurrence: "once",
          rawRequest: "x",
        })
      )
    ).toBe(false);
  });

  it("blocks when strategy or creative direction is incomplete", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = linkedInUnit(project.id);
    const generateLinkedInPost = vi.fn();

    const result = await executeLinkedInPostWorkUnit(
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
          saveLinkedInPost: () => undefined,
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn(),
        generateStrategy: vi.fn(),
        generateCreativeBrief: vi.fn(),
        generateLinkedInPost,
      }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toBe(LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE);
    expect(generateLinkedInPost).not.toHaveBeenCalled();
  });

  it("generates, validates, persists, and marks review_ready", async () => {
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
    const unit = linkedInUnit(project.id);
    const brief = sampleCreativeBrief(project.id);
    const post = {
      id: `linkedin-post:${unit.id}`,
      workUnitId: unit.id,
      campaignId: project.id,
      hook: "Stop guessing your GTM.",
      body: "Founders waste weeks on messaging that does not land.",
      cta: "Book a demo",
      hashtags: ["founders", "gtm"],
      suggestedImageDescription: "Founder at laptop, calm office light",
      publishingRecommendation: "Tuesday 9am local, text + image",
      generatedAt: assembledAt,
    };

    const contextPackage = assembleContextPackage(createMarketingBundle(), {
      taskHint: "LinkedIn post",
    });

    let savedPost: typeof post | null = null;
    const generateLinkedInPost = vi.fn().mockResolvedValue({
      success: true,
      post,
      warnings: [],
      traceId: "t1",
    });

    const result = await executeLinkedInPostWorkUnit(
      {
        workUnitId: unit.id,
        organizationId,
        userId,
        assembledAt,
        domainInput: domainInput({
          workUnits: [strategyUnit, creativeUnit, unit],
          projects: [project],
          creativeBriefByCampaignId: { [project.id]: brief },
        }),
        persistence: {
          saveStrategy: () => undefined,
          saveLinkedInPost: ({ post: p }) => {
            savedPost = p;
          },
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn().mockResolvedValue(contextPackage),
        generateStrategy: vi.fn(),
        generateCreativeBrief: vi.fn(),
        generateLinkedInPost,
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("linkedin_post");
    expect(result.workUnit.status).toBe("review_ready");
    expect(savedPost?.hook).toBe("Stop guessing your GTM.");
    expect(generateLinkedInPost).toHaveBeenCalledTimes(1);
  });

  it("returns ValidationFailure when output is incomplete", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = linkedInUnit(project.id);
    const brief = sampleCreativeBrief(project.id);
    const incompletePost = {
      id: `linkedin-post:${unit.id}`,
      workUnitId: unit.id,
      campaignId: project.id,
      hook: "",
      body: "Body",
      cta: "CTA",
      hashtags: ["tag"],
      suggestedImageDescription: "",
      publishingRecommendation: "",
      generatedAt: assembledAt,
    };

    const result = await executeLinkedInPostWorkUnit(
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
          saveLinkedInPost: () => undefined,
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn().mockResolvedValue(
          assembleContextPackage(createMarketingBundle(), { taskHint: "LinkedIn" })
        ),
        generateStrategy: vi.fn(),
        generateCreativeBrief: vi.fn(),
        generateLinkedInPost: vi.fn().mockResolvedValue({
          success: true,
          post: incompletePost,
          warnings: [],
          traceId: "t1",
        }),
      }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ValidationFailure");
    expect(result.workUnit?.status).toBe("planning");
  });

  it("is idempotent when execution already completed", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    let unit = linkedInUnit(project.id);
    unit = transitionWorkUnit(
      unit,
      "review_ready",
      "review_ready",
      "LinkedIn post execution completed"
    );
    const post = {
      id: `linkedin-post:${unit.id}`,
      workUnitId: unit.id,
      campaignId: project.id,
      hook: "Hook",
      body: "Body",
      cta: "CTA",
      hashtags: ["a"],
      suggestedImageDescription: "Image",
      publishingRecommendation: "Publish",
      generatedAt: assembledAt,
    };
    const generateLinkedInPost = vi.fn();

    const result = await executeLinkedInPostWorkUnit(
      {
        workUnitId: unit.id,
        organizationId,
        userId,
        assembledAt,
        domainInput: domainInput({
          workUnits: [unit],
          projects: [project],
          creativeBriefByCampaignId: { [project.id]: sampleCreativeBrief(project.id) },
          linkedinPostByWorkUnitId: { [unit.id]: post },
        }),
        persistence: {
          saveStrategy: () => undefined,
          saveLinkedInPost: () => undefined,
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn(),
        generateStrategy: vi.fn(),
        generateCreativeBrief: vi.fn(),
        generateLinkedInPost,
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.idempotent).toBe(true);
    expect(generateLinkedInPost).not.toHaveBeenCalled();
  });
});

describe("validateLinkedInPostWorkUnitOutput", () => {
  it("requires hook, body, cta, and hashtags", () => {
    const post = {
      id: "p1",
      workUnitId: "wu1",
      campaignId: "c1",
      hook: "Hook",
      body: "Body",
      cta: "CTA",
      hashtags: ["founders"],
      suggestedImageDescription: "Image",
      publishingRecommendation: "Tuesday",
      generatedAt: assembledAt,
    };
    expect(validateLinkedInPostWorkUnitOutput(post).valid).toBe(true);
    expect(mapLinkedInPostToWorkUnitOutput(post).hook).toBe("Hook");
  });
});

describe("parseMarketingLinkedInPostResponse", () => {
  it("rejects JSON missing required fields", () => {
    const result = parseMarketingLinkedInPostResponse(
      JSON.stringify({ hook: "Hi", body: "Text", cta: "Go" })
    );
    expect(result.success).toBe(false);
  });
});
