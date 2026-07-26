import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";
import { ContextEngineError } from "@/lib/context-engine/core/errors";
import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import { createMarketingBundle } from "@/lib/prompt-builder/__tests__/fixtures";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

import {
  CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE,
  executeMarketingWorkUnit,
} from "../execute-marketing-work-unit";

const assembledAt = "2026-07-24T12:00:00.000Z";
const peerId = "peer-1";
const organizationId = "org-1";
const userId = "user-1";
const __dirname = dirname(fileURLToPath(import.meta.url));

function domainInput(
  overrides: Partial<MarketingPeerDomainInput> & {
    projects: MarketingPeerDomainInput["projects"];
    workUnits: MarketingPeerDomainInput["workUnits"];
  }
): MarketingPeerDomainInput {
  return {
    peerId,
    organizationId,
    userName: "You",
    peerName: "Emma",
    campaignTitle: "Campaign",
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
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

function sampleStrategy(): MarketingStrategy {
  return {
    summary: "Lead with founder-led LinkedIn thought leadership.",
    confidence: "high",
    confidenceReason: "Strong context.",
    targetAudiences: [
      {
        segment: "SMB founders",
        priority: "primary",
        rationale: { why: "Primary segment", basedOn: ["marketing-understanding"] },
      },
    ],
    positioningRecommendations: [
      {
        recommendation: "Position as an AI workforce, not a tool stack.",
        rationale: { why: "Differentiation", basedOn: ["company-dna"] },
      },
    ],
    contentPillars: [
      {
        name: "Operational leverage",
        themes: ["Time savings"],
        rationale: { why: "Pain point", basedOn: ["business-brain"] },
      },
    ],
    campaignIdeas: [
      {
        name: "Launch narrative",
        objective: "Awareness",
        channels: ["LinkedIn"],
        rationale: { why: "Channel fit", basedOn: ["marketing-understanding"] },
      },
    ],
    seoOpportunities: [],
    socialMediaStrategy: [],
    customerJourneyRecommendations: [],
    leadGenerationOpportunities: [],
    marketingPriorities: [],
    knowledgeGaps: [],
    generatedAt: assembledAt,
  };
}

function campaignStrategyUnit(projectId: string, id = "wu-strategy") {
  const base = createWorkUnit({
    peerId,
    projectId,
    role: "Marketing",
    title: "Finalize campaign strategy",
    deliverableKind: "generic",
    channel: "Campaign",
    objective: "Translate goals into a coherent strategy for this campaign scope.",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Campaign strategy work package",
  });
  return { ...base, id };
}

describe("executeMarketingWorkUnit", () => {
  it("executes campaign strategy work unit end-to-end", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow pipeline",
      primaryGoalId: "brand_awareness",
    });
    const unit = transitionWorkUnit(
      campaignStrategyUnit(project.id),
      "planning",
      "planning_started",
      "Planned"
    );

    const contextPackage = assembleContextPackage(createMarketingBundle(), {
      taskHint: "Campaign strategy",
    });

    let savedStrategy: MarketingStrategy | null = null;
    const generateStrategy = vi.fn().mockResolvedValue({
      success: true,
      strategy: sampleStrategy(),
      warnings: [],
      traceId: "trace-1",
    });

    const result = await executeMarketingWorkUnit({
      workUnitId: unit.id,
      organizationId,
      userId,
      assembledAt,
      domainInput: domainInput({ projects: [project], workUnits: [unit] }),
      persistence: {
        saveStrategy: (s) => {
          savedStrategy = s;
        },
        updateWorkUnit: (u) => u,
      },
      deps: {
        buildContext: vi.fn().mockResolvedValue(contextPackage),
        generateStrategy,
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("campaign_strategy");
    expect(result.output.summary).toContain("LinkedIn");
    expect(result.output.messagingPillars).toContain("Operational leverage");
    expect(savedStrategy).not.toBeNull();
    expect(result.workUnit.status).toBe("review_ready");
    expect(result.workUnit.eventLog.some((e) => e.note.includes(CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE))).toBe(
      true
    );
    expect(generateStrategy).toHaveBeenCalledTimes(1);
  });

  it("returns UnsupportedWorkUnit for non-strategy work units", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: "LinkedIn post",
      deliverableKind: "linkedin",
      channel: "LinkedIn",
      objective: "Post",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Write post",
    });

    const result = await executeMarketingWorkUnit({
      workUnitId: unit.id,
      organizationId,
      userId,
      assembledAt,
      domainInput: domainInput({ projects: [project], workUnits: [unit] }),
      persistence: {
        saveStrategy: () => undefined,
        updateWorkUnit: (u) => u,
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("UnsupportedWorkUnit");
  });

  it("surfaces ContextUnavailable when context engine fails", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = campaignStrategyUnit(project.id);

    const result = await executeMarketingWorkUnit({
      workUnitId: unit.id,
      organizationId,
      userId,
      assembledAt,
      domainInput: domainInput({ projects: [project], workUnits: [unit] }),
      persistence: {
        saveStrategy: () => undefined,
        updateWorkUnit: (u) => u,
      },
      deps: {
        buildContext: vi.fn().mockRejectedValue(new ContextEngineError("Peer not found")),
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ContextUnavailable");
    expect(result.phase).toBe("failed");
  });

  it("surfaces AIRuntimeFailure when AI generation fails", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = campaignStrategyUnit(project.id);
    const contextPackage = assembleContextPackage(createMarketingBundle(), {
      taskHint: "Campaign strategy",
    });

    const result = await executeMarketingWorkUnit({
      workUnitId: unit.id,
      organizationId,
      userId,
      assembledAt,
      domainInput: domainInput({ projects: [project], workUnits: [unit] }),
      persistence: {
        saveStrategy: () => undefined,
        updateWorkUnit: (u) => u,
      },
      deps: {
        buildContext: vi.fn().mockResolvedValue(contextPackage),
        generateStrategy: vi.fn().mockResolvedValue({
          success: false,
          error: "Model returned invalid JSON.",
          warnings: [],
          traceId: "t",
        }),
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("AIRuntimeFailure");
  });

  it("surfaces ValidationFailure when mapped output is incomplete", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = campaignStrategyUnit(project.id);
    const contextPackage = assembleContextPackage(createMarketingBundle(), {
      taskHint: "Campaign strategy",
    });

    const result = await executeMarketingWorkUnit({
      workUnitId: unit.id,
      organizationId,
      userId,
      assembledAt,
      domainInput: domainInput({ projects: [project], workUnits: [unit] }),
      persistence: {
        saveStrategy: () => undefined,
        updateWorkUnit: (u) => u,
      },
      deps: {
        buildContext: vi.fn().mockResolvedValue(contextPackage),
        generateStrategy: vi.fn().mockResolvedValue({
          success: true,
          strategy: { ...sampleStrategy(), contentPillars: [] },
          warnings: [],
          traceId: "t",
        }),
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ValidationFailure");
  });

  it("surfaces PersistenceFailure when strategy cannot be saved", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    const unit = campaignStrategyUnit(project.id);
    const contextPackage = assembleContextPackage(createMarketingBundle(), {
      taskHint: "Campaign strategy",
    });

    const result = await executeMarketingWorkUnit({
      workUnitId: unit.id,
      organizationId,
      userId,
      assembledAt,
      domainInput: domainInput({ projects: [project], workUnits: [unit] }),
      persistence: {
        saveStrategy: () => {
          throw new Error("storage full");
        },
        updateWorkUnit: (u) => u,
      },
      deps: {
        buildContext: vi.fn().mockResolvedValue(contextPackage),
        generateStrategy: vi.fn().mockResolvedValue({
          success: true,
          strategy: sampleStrategy(),
          warnings: [],
          traceId: "t",
        }),
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("PersistenceFailure");
  });

  it("does not re-run AI when work unit already completed", async () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Grow",
      primaryGoalId: "brand_awareness",
    });
    let unit = transitionWorkUnit(
      campaignStrategyUnit(project.id),
      "planning",
      "planning_started",
      "Planned"
    );
    unit = transitionWorkUnit(
      unit,
      "creating",
      "creation_started",
      "Executing campaign strategy"
    );
    unit = transitionWorkUnit(
      unit,
      "review_ready",
      "review_ready",
      CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
    );

    const generateStrategy = vi.fn();

    const result = await executeMarketingWorkUnit({
      workUnitId: unit.id,
      organizationId,
      userId,
      assembledAt,
      domainInput: domainInput({
        projects: [project],
        workUnits: [unit],
        strategy: sampleStrategy(),
      }),
      persistence: {
        saveStrategy: () => undefined,
        updateWorkUnit: (u) => u,
      },
      deps: { generateStrategy },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.idempotent).toBe(true);
    expect(generateStrategy).not.toHaveBeenCalled();
  });

  it("runtime module does not introduce scheduler, queue, API, or database layers", () => {
    const runtimeDir = join(__dirname, "..");
    const files = [
      "execute-marketing-work-unit.ts",
      "index.ts",
      "types.ts",
      "errors.ts",
    ];
    const forbidden = /\b(cron|node-cron|bull|queue|scheduler|setInterval|app\/api|supabase\.from|createClient)\b/i;
    for (const file of files) {
      const text = readFileSync(join(runtimeDir, file), "utf8");
      expect(text).not.toMatch(forbidden);
    }
  });
});
