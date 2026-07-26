import { describe, expect, it } from "vitest";

import { CAMPAIGN_STRATEGY_WORK_UNIT_TITLE } from "@/lib/peer-experience/marketing/runtime";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";

import {
  buildCampaignStrategyWorkUnitActionViewModel,
  findCampaignStrategyWorkUnit,
  isCampaignStrategyWorkUnitReviewReady,
  presentMarketingWorkUnitExecutionError,
} from "@/features/marketing-workspace/lib/campaign-strategy-work-unit-action-presenter";

const projectId = "proj-campaign-1";
const peerId = "peer-1";

function strategyUnit(id = "wu-strategy") {
  const base = createWorkUnit({
    peerId,
    projectId,
    role: "Marketing",
    title: CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
    deliverableKind: "generic",
    channel: "Campaign",
    objective: "Strategy for campaign",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Strategy",
  });
  return { ...base, id };
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
    rawRequest: "Post",
  });
}

describe("findCampaignStrategyWorkUnit", () => {
  it("returns the campaign strategy unit for the project", () => {
    const unit = strategyUnit();
    expect(findCampaignStrategyWorkUnit(projectId, [linkedInUnit(), unit])?.id).toBe(unit.id);
  });

  it("returns null when only unsupported units exist", () => {
    expect(findCampaignStrategyWorkUnit(projectId, [linkedInUnit()])).toBeNull();
  });
});

describe("buildCampaignStrategyWorkUnitActionViewModel", () => {
  it("shows primary action for supported strategy work unit", () => {
    const vm = buildCampaignStrategyWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnits: [strategyUnit()],
    });
    expect(vm?.showPrimaryAction).toBe(true);
    expect(vm?.primaryLabel).toBe("Let Marketing Peer prepare strategy");
    expect(vm?.primaryDisabled).toBe(false);
  });

  it("hides section when campaign workspace flag is off", () => {
    expect(
      buildCampaignStrategyWorkUnitActionViewModel({
        campaignsEnabled: false,
        projectId,
        workUnits: [strategyUnit()],
      })
    ).toBeNull();
  });

  it("does not show action for unsupported work units", () => {
    expect(
      buildCampaignStrategyWorkUnitActionViewModel({
        campaignsEnabled: true,
        projectId,
        workUnits: [linkedInUnit()],
      })
    ).toBeNull();
  });

  it("shows loading label and disables button while executing", () => {
    const unit = strategyUnit();
    const vm = buildCampaignStrategyWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnits: [unit],
      executingWorkUnitId: unit.id,
    });
    expect(vm?.primaryLabel).toBe("Marketing Peer is preparing strategy...");
    expect(vm?.primaryDisabled).toBe(true);
  });

  it("shows completion label when work unit is review ready", () => {
    let unit = transitionWorkUnit(strategyUnit(), "planning", "planning_started", "Planned");
    unit = transitionWorkUnit(unit, "creating", "creation_started", "Executing");
    unit = transitionWorkUnit(unit, "review_ready", "review_ready", "Done");
    expect(isCampaignStrategyWorkUnitReviewReady(unit)).toBe(true);

    const vm = buildCampaignStrategyWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnits: [unit],
    });
    expect(vm?.showPrimaryAction).toBe(false);
    expect(vm?.completionLabel).toBe("Strategy ready for review");
    expect(vm?.statusLabel).toBe("Review ready");
  });

  it("local pending disables duplicate clicks", () => {
    const vm = buildCampaignStrategyWorkUnitActionViewModel({
      campaignsEnabled: true,
      projectId,
      workUnits: [strategyUnit()],
      localPending: true,
    });
    expect(vm?.primaryDisabled).toBe(true);
    expect(vm?.isExecuting).toBe(true);
  });
});

describe("presentMarketingWorkUnitExecutionError", () => {
  function failure(
    code: Exclude<
      MarketingWorkUnitExecutionResult extends { ok: false; code: infer C } ? C : never,
      never
    >
  ): MarketingWorkUnitExecutionResult {
    return {
      ok: false,
      code,
      message: "internal",
      workUnitId: "wu-1",
    } as MarketingWorkUnitExecutionResult;
  }

  it("maps runtime codes to customer-safe copy", () => {
    expect(presentMarketingWorkUnitExecutionError(failure("UnsupportedWorkUnit"))).toMatch(
      /not supported/i
    );
    expect(presentMarketingWorkUnitExecutionError(failure("AIRuntimeFailure"))).toMatch(
      /could not prepare/i
    );
    expect(presentMarketingWorkUnitExecutionError(failure("ValidationFailure"))).toMatch(
      /another attempt/i
    );
    expect(presentMarketingWorkUnitExecutionError(failure("ContextUnavailable"))).toMatch(
      /More campaign information/i
    );
    expect(presentMarketingWorkUnitExecutionError(failure("PersistenceFailure"))).toMatch(
      /could not be saved/i
    );
  });

  it("never returns raw internal messages", () => {
    const message = presentMarketingWorkUnitExecutionError(failure("AIRuntimeFailure"));
    expect(message).not.toContain("internal");
  });
});

describe("campaign strategy UI scope", () => {
  it("only targets a single strategy work unit type", () => {
    const units = [linkedInUnit(), strategyUnit("wu-only-strategy")];
    const found = findCampaignStrategyWorkUnit(projectId, units);
    expect(found?.id).toBe("wu-only-strategy");
    expect(units.filter((u) => findCampaignStrategyWorkUnit(projectId, [u]))).toHaveLength(1);
  });
});
