import { describe, expect, it } from "vitest";

import { CREATIVE_DIRECTION_WORK_UNIT_TITLE } from "@/lib/peer-experience/marketing/runtime";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import { CAMPAIGN_STRATEGY_WORK_UNIT_TITLE } from "@/lib/peer-experience/marketing/runtime";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime";

import {
  buildCreativeDirectionWorkUnitActionViewModel,
  presentCreativeDirectionBlockedReason,
} from "@/features/marketing-workspace/lib/campaign-creative-direction-work-unit-action-presenter";

const projectId = "proj-1";
const peerId = "peer-1";

function creativeUnit() {
  return createWorkUnit({
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
}

describe("buildCreativeDirectionWorkUnitActionViewModel", () => {
  it("shows blocked reason when strategy is incomplete", () => {
    const vm = buildCreativeDirectionWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnits: [creativeUnit()],
      strategy: null,
    });
    expect(vm?.blockedReason).toBe("Campaign strategy must be completed first.");
    expect(vm?.showPrimaryAction).toBe(false);
  });

  it("shows primary action when strategy work unit is review ready", () => {
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

    const vm = buildCreativeDirectionWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnits: [strategyUnit, creativeUnit()],
      strategy: {
        summary: "Strategy ready",
        confidence: "high",
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
        generatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    expect(vm?.blockedReason).toBeNull();
    expect(vm?.primaryLabel).toBe("Let Marketing Peer prepare creative direction");
  });

  it("shows completion label when review ready", () => {
    let unit = creativeUnit();
    unit = transitionWorkUnit(unit, "review_ready", "review_ready", "Creative direction execution completed");

    const vm = buildCreativeDirectionWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnits: [unit],
      strategy: {
        summary: "Strategy ready",
        confidence: "high",
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
        generatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    expect(vm?.completionLabel).toBe("Creative direction ready for review");
    expect(vm?.showPrimaryAction).toBe(false);
  });
});

describe("presentCreativeDirectionBlockedReason", () => {
  it("returns null when strategy exists and strategy unit completed", () => {
    expect(
      presentCreativeDirectionBlockedReason({
        projectId,
        workUnits: [],
        strategy: {
          summary: "Ready",
          confidence: "high",
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
          generatedAt: "2026-01-01T00:00:00.000Z",
        },
      })
    ).toBeNull();
  });
});
