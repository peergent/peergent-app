import { describe, expect, it } from "vitest";

import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

import { isCampaignStrategyCompleteForCreativeDirection } from "../campaign-strategy-dependency";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "../execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "../execute-creative-direction-work-unit";
import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
} from "../identify-work-unit";
import {
  areLinkedInPostDependenciesMet,
  LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
} from "../linkedin-post-dependencies";

const projectId = "proj-1";
const peerId = "peer-1";

function reviewReadyStrategyUnit() {
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
  return transitionWorkUnit(
    unit,
    "review_ready",
    "review_ready",
    CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
  );
}

function reviewReadyCreativeUnit() {
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
  return transitionWorkUnit(
    unit,
    "review_ready",
    "review_ready",
    CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
  );
}

describe("isCampaignStrategyCompleteForCreativeDirection", () => {
  it("accepts review_ready strategy work unit without persisted strategy object", () => {
    const strategyUnit = reviewReadyStrategyUnit();
    expect(
      isCampaignStrategyCompleteForCreativeDirection({
        projectId,
        workUnits: [strategyUnit],
        strategy: null,
      })
    ).toBe(true);
  });

  it("falls back to persisted strategy when no strategy work unit exists", () => {
    expect(
      isCampaignStrategyCompleteForCreativeDirection({
        projectId,
        workUnits: [],
        strategy: { summary: "Ready", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
      })
    ).toBe(true);
  });
});

describe("areLinkedInPostDependenciesMet", () => {
  it("allows downstream execution when strategy and creative units are review_ready without workspace artifacts", () => {
    expect(
      areLinkedInPostDependenciesMet({
        projectId,
        workUnits: [reviewReadyStrategyUnit(), reviewReadyCreativeUnit()],
        strategy: null,
        creativeBriefByCampaignId: {},
      })
    ).toBe(true);
  });

  it("blocks when strategy unit is not yet review_ready", () => {
    const strategyUnit = createWorkUnit({
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
    const creativeUnit = reviewReadyCreativeUnit();
    expect(
      areLinkedInPostDependenciesMet({
        projectId,
        workUnits: [strategyUnit, creativeUnit],
        strategy: null,
        creativeBriefByCampaignId: {},
      })
    ).toBe(false);
  });

  it("uses customer-safe blocked message constant", () => {
    expect(LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE).toContain("Campaign strategy");
  });
});
