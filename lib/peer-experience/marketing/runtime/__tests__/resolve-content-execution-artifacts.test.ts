import { describe, expect, it } from "vitest";

import { transitionWorkUnit, createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
} from "../identify-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "../execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "../execute-creative-direction-work-unit";
import { resolveContentExecutionArtifacts } from "../resolve-content-execution-artifacts";

const projectId = "proj-1";
const peerId = "peer-1";

describe("resolveContentExecutionArtifacts", () => {
  it("returns strategy and creative brief when workspace artifacts exist", () => {
    const result = resolveContentExecutionArtifacts({
      projectId,
      workUnits: [],
      strategy: { summary: "Strategy ready", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
      creativeBriefByCampaignId: {
        [projectId]: {
          campaignGoal: { summary: "Concept" },
        } as never,
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.strategy.summary).toBe("Strategy ready");
    expect(result.creativeBrief.campaignGoal.summary).toBe("Concept");
  });

  it("fails when creative unit is review_ready but brief artifact is missing", () => {
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

    const result = resolveContentExecutionArtifacts({
      projectId,
      workUnits: [creativeUnit],
      strategy: { summary: "Ready", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
      creativeBriefByCampaignId: {},
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.internalMessage).toContain("creative brief is missing");
  });

  it("fails when strategy unit is review_ready but strategy artifact is missing", () => {
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

    const result = resolveContentExecutionArtifacts({
      projectId,
      workUnits: [strategyUnit],
      strategy: null,
      creativeBriefByCampaignId: {
        [projectId]: { campaignGoal: { summary: "Concept" } } as never,
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.internalMessage).toContain("strategy content is missing");
  });
});
