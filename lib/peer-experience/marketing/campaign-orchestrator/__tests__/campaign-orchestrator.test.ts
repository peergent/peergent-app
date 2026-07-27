import { describe, expect, it } from "vitest";

import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

import { CampaignOrchestrator } from "../campaign-orchestrator";
import type { CampaignOrchestratorInput } from "../types";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "../../runtime/execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "../../runtime/execute-creative-direction-work-unit";
import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
} from "../../runtime/identify-work-unit";
import { LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE } from "../../runtime/linkedin-post-dependencies";

const projectId = "proj-1";
const peerId = "peer-1";

function baseInput(
  overrides: Partial<CampaignOrchestratorInput> = {}
): CampaignOrchestratorInput {
  return {
    projectId,
    workUnits: [],
    strategy: null,
    creativeBriefByCampaignId: {},
    ...overrides,
  };
}

function strategyUnit(status: "queued" | "review_ready" = "queued") {
  let unit = createWorkUnit({
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
  if (status === "review_ready") {
    unit = transitionWorkUnit(
      unit,
      "review_ready",
      "review_ready",
      CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
    );
  }
  return unit;
}

function creativeUnit(status: "queued" | "review_ready" = "queued") {
  let unit = createWorkUnit({
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
  if (status === "review_ready") {
    unit = transitionWorkUnit(
      unit,
      "review_ready",
      "review_ready",
      CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
    );
  }
  return unit;
}

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
    rawRequest: "LinkedIn content package",
  });
}

function emailUnit() {
  return createWorkUnit({
    peerId,
    projectId,
    role: "Marketing",
    title: "Email newsletter",
    deliverableKind: "email",
    channel: "Email",
    objective: "Newsletter",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Email content package",
  });
}

function sampleStrategy() {
  return {
    summary: "Lead with founder-led thought leadership.",
    generatedAt: "2026-07-24T12:00:00.000Z",
  } as never;
}

function sampleBrief() {
  return {
    campaignGoal: { summary: "Concept angle" },
  } as never;
}

function plan(input: CampaignOrchestratorInput) {
  return CampaignOrchestrator.plan(input);
}

function kinds(units: { runtimeKind: string }[]) {
  return units.map((u) => u.runtimeKind).sort();
}

function ids(units: { workUnit: { id: string } }[]) {
  return units.map((u) => u.workUnit.id);
}

describe("CampaignOrchestrator", () => {
  it("returns empty plan for empty campaign", () => {
    const result = plan(baseInput());
    expect(result.executableWorkUnits).toEqual([]);
    expect(result.blockedWorkUnits).toEqual([]);
    expect(result.completedWorkUnits).toEqual([]);
  });

  it("lists only campaign strategy as executable on a fresh campaign", () => {
    const strategy = strategyUnit("queued");
    const creative = creativeUnit("queued");
    const linkedin = linkedInUnit();
    const email = emailUnit();

    const result = plan(
      baseInput({
        workUnits: [strategy, creative, linkedin, email],
      })
    );

    expect(kinds(result.executableWorkUnits)).toEqual(["campaign_strategy"]);
    expect(ids(result.executableWorkUnits)).toEqual([strategy.id]);
    expect(kinds(result.completedWorkUnits)).toEqual([]);

    const blockedKinds = result.blockedWorkUnits.map((b) => b.runtimeKind).sort();
    expect(blockedKinds).toEqual(["creative_direction", "email_campaign", "linkedin_post"]);

    const creativeBlock = result.blockedWorkUnits.find(
      (b) => b.runtimeKind === "creative_direction"
    );
    expect(creativeBlock?.missingDependencies).toEqual(["campaign_strategy"]);

    const contentBlocks = result.blockedWorkUnits.filter(
      (b) => b.runtimeKind === "linkedin_post" || b.runtimeKind === "email_campaign"
    );
    for (const block of contentBlocks) {
      expect(block.blockingReason).toBe(LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE);
      expect(block.missingDependencies).toContain("campaign_strategy");
    }
  });

  it("moves strategy to completed and unlocks creative direction when strategy is review_ready", () => {
    const strategy = strategyUnit("review_ready");
    const creative = creativeUnit("queued");

    const result = plan(
      baseInput({
        workUnits: [strategy, creative],
      })
    );

    expect(kinds(result.completedWorkUnits)).toEqual(["campaign_strategy"]);
    expect(kinds(result.executableWorkUnits)).toEqual(["creative_direction"]);
    expect(result.blockedWorkUnits).toEqual([]);
  });

  it("completes creative and blocks content until workspace artifacts exist", () => {
    const strategy = strategyUnit("review_ready");
    const creative = creativeUnit("review_ready");
    const linkedin = linkedInUnit();
    const email = emailUnit();

    const result = plan(
      baseInput({
        workUnits: [strategy, creative, linkedin, email],
      })
    );

    expect(kinds(result.completedWorkUnits).sort()).toEqual([
      "campaign_strategy",
      "creative_direction",
    ]);
    expect(result.executableWorkUnits).toEqual([]);

    const contentBlocks = result.blockedWorkUnits.filter(
      (b) => b.runtimeKind === "linkedin_post" || b.runtimeKind === "email_campaign"
    );
    expect(contentBlocks).toHaveLength(2);
    for (const block of contentBlocks) {
      expect(block.missingDependencies).toEqual(
        expect.arrayContaining(["strategy_artifact", "creative_brief"])
      );
      expect(block.blockingReason).toMatch(/strategy content|creative brief/i);
    }
  });

  it("lists LinkedIn and email as executable when lifecycle and artifacts are satisfied", () => {
    const strategy = strategyUnit("review_ready");
    const creative = creativeUnit("review_ready");
    const linkedin = linkedInUnit();
    const email = emailUnit();

    const result = plan(
      baseInput({
        workUnits: [strategy, creative, linkedin, email],
        strategy: sampleStrategy(),
        creativeBriefByCampaignId: { [projectId]: sampleBrief() },
      })
    );

    expect(kinds(result.completedWorkUnits).sort()).toEqual([
      "campaign_strategy",
      "creative_direction",
    ]);
    expect(kinds(result.executableWorkUnits).sort()).toEqual([
      "email_campaign",
      "linkedin_post",
    ]);
    expect(result.blockedWorkUnits).toEqual([]);
  });

  it("excludes review_ready work units from executable and blocked lists", () => {
    const strategy = strategyUnit("review_ready");
    const creative = creativeUnit("review_ready");
    const linkedin = linkedInUnit();
    let linkedinReady = transitionWorkUnit(
      linkedin,
      "review_ready",
      "review_ready",
      "LinkedIn post execution completed"
    );

    const result = plan(
      baseInput({
        workUnits: [strategy, creative, linkedinReady],
        strategy: sampleStrategy(),
        creativeBriefByCampaignId: { [projectId]: sampleBrief() },
      })
    );

    expect(kinds(result.completedWorkUnits).sort()).toEqual([
      "campaign_strategy",
      "creative_direction",
      "linkedin_post",
    ]);
    expect(result.executableWorkUnits).toEqual([]);
    expect(result.blockedWorkUnits).toEqual([]);
  });

  it("ignores unknown and generic placeholder work units", () => {
    const strategy = strategyUnit("queued");
    const genericLinkedInDeliverable = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "LinkedIn deliverable",
      deliverableKind: "generic",
      channel: "LinkedIn",
      objective: "Placeholder",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "generic channel target",
    });
    const unrelated = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "Monitor campaign performance",
      deliverableKind: "generic",
      channel: "Campaign",
      objective: "Monitoring",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "monitor",
    });

    const result = plan(
      baseInput({
        workUnits: [strategy, genericLinkedInDeliverable, unrelated],
      })
    );

    expect(result.executableWorkUnits).toHaveLength(1);
    expect(result.executableWorkUnits[0]?.runtimeKind).toBe("campaign_strategy");
    expect(result.blockedWorkUnits.every((b) => b.runtimeKind !== "linkedin_post")).toBe(true);
  });

  it("does not include work units from other projects", () => {
    const otherProjectStrategy = createWorkUnit({
      peerId,
      projectId: "other-project",
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

    const result = plan(
      baseInput({
        workUnits: [otherProjectStrategy],
      })
    );

    expect(result.executableWorkUnits).toEqual([]);
  });

  it("blocks work units that are currently executing", () => {
    let strategy = strategyUnit("queued");
    strategy = transitionWorkUnit(strategy, "creating", "creation_started", "Executing strategy");

    const result = plan(baseInput({ workUnits: [strategy] }));

    expect(result.executableWorkUnits).toEqual([]);
    expect(result.blockedWorkUnits).toHaveLength(1);
    expect(result.blockedWorkUnits[0]?.blockingReason).toContain("currently executing");
  });
});
