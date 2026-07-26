import { describe, expect, it, vi } from "vitest";

import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import { createMarketingBundle } from "@/lib/prompt-builder/__tests__/fixtures";

import { buildMarketingDecisionSourceForCampaign } from "../build-marketing-decision-source-for-campaign";
import {
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
  isCreativeDirectionWorkUnit,
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
} from "../identify-work-unit";
import {
  mapCreativeBriefToWorkUnitOutput,
  validateCreativeDirectionWorkUnitOutput,
} from "../validate-creative-direction-output";
import { executeCreativeDirectionWorkUnit } from "../execute-creative-direction-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "../execute-marketing-work-unit";

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
    contentPillars: [
      { name: "Leverage", themes: ["Time"], rationale: { why: "x", basedOn: ["marketing-understanding"] as const } },
    ],
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

function creativeDirectionUnit(projectId: string) {
  return createWorkUnit({
    peerId,
    projectId,
    role: "Marketing",
    title: CREATIVE_DIRECTION_WORK_UNIT_TITLE,
    deliverableKind: "generic",
    channel: "Campaign",
    objective: "Creative direction",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Creative direction work package",
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

describe("creative direction runtime", () => {
  it("identifies Set creative direction work units", () => {
    expect(isCreativeDirectionWorkUnit(creativeDirectionUnit("p1"))).toBe(true);
  });

  it("blocks execution when campaign strategy is incomplete", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = creativeDirectionUnit(project.id);
    const deps = {
      buildContext: vi.fn(),
      generateStrategy: vi.fn(),
      generateCreativeBrief: vi.fn(),
    };

    const result = await executeCreativeDirectionWorkUnit(
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
          saveCreativeBrief: () => undefined,
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      deps
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ContextUnavailable");
    expect(deps.generateCreativeBrief).not.toHaveBeenCalled();
  });

  it("generates and persists creative brief when strategy is complete", async () => {
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
    const unit = creativeDirectionUnit(project.id);
    const contextPackage = assembleContextPackage(createMarketingBundle(), {
      taskHint: "Creative direction",
    });

    const brief = {
      id: "brief-1",
      organizationId: "org-1",
      title: "Creative direction — Launch",
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
      outputRequirements: { deliverableSummary: "Use hierarchy", variants: ["Test hooks"] },
      approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
    };

    let savedBrief: typeof brief | null = null;
    const generateCreativeBrief = vi.fn().mockResolvedValue({
      success: true,
      brief,
      warnings: [],
      traceId: "t1",
    });

    const result = await executeCreativeDirectionWorkUnit(
      {
        workUnitId: unit.id,
        organizationId,
        userId,
        assembledAt,
        domainInput: domainInput({
          workUnits: [strategyUnit, unit],
          projects: [project],
        }),
        persistence: {
          saveStrategy: () => undefined,
          saveCreativeBrief: ({ brief: b }) => {
            savedBrief = b;
          },
          updateWorkUnit: (u) => u,
        },
      },
      unit,
      {
        buildContext: vi.fn().mockResolvedValue(contextPackage),
        generateStrategy: vi.fn(),
        generateCreativeBrief,
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("creative_direction");
    expect(result.workUnit.status).toBe("review_ready");
    expect(savedBrief).not.toBeNull();
    expect(generateCreativeBrief).toHaveBeenCalledTimes(1);
  });
});

describe("validateCreativeDirectionWorkUnitOutput", () => {
  it("requires concept, tone, messaging, visual, and CTA", () => {
    const brief = {
      id: "b1",
      organizationId: "org-1",
      title: "Brief",
      status: "ready" as const,
      version: 1,
      createdAt: assembledAt,
      updatedAt: assembledAt,
      campaignGoal: { summary: "Concept" },
      audience: { segmentLabel: "Founders" },
      channel: { channel: "linkedin" as const },
      contentType: "social_post" as const,
      tone: { directive: "Clear and confident" },
      cta: { primary: "Book a demo" },
      messagingPriorities: { primaryMessage: "Primary" },
      visualPriorities: { summary: "Clean founder-led visuals" },
      requiredAssets: [],
      forbiddenClaims: [],
      forbiddenWords: [],
      requiredDisclaimers: [],
      platformConstraints: {},
      outputRequirements: { deliverableSummary: "Direction" },
      approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
    };

    expect(validateCreativeDirectionWorkUnitOutput(brief).valid).toBe(true);
    expect(mapCreativeBriefToWorkUnitOutput(brief).tone).toBe("Clear and confident");
  });
});
