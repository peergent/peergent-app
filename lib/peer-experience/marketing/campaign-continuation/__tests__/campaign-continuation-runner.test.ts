import { describe, expect, it, vi } from "vitest";

import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
} from "../../runtime/identify-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "../../runtime/execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "../../runtime/execute-creative-direction-work-unit";
import {
  runCampaignContinuation,
} from "../campaign-continuation-runner";
import { CAMPAIGN_CONTINUATION_MAX_ITERATIONS } from "../types";
import type { CampaignContinuationRunnerDeps } from "../types";
import type { CampaignOrchestratorInput } from "../../campaign-orchestrator/types";

const projectId = "proj-1";
const peerId = "peer-1";

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

function createRunnerDeps(input: {
  initial: CampaignOrchestratorInput;
  executeWorkUnit: CampaignContinuationRunnerDeps["executeWorkUnit"];
  getApprovalMode?: CampaignContinuationRunnerDeps["getApprovalMode"];
}): CampaignContinuationRunnerDeps {
  const state: CampaignOrchestratorInput = {
    ...input.initial,
    workUnits: [...input.initial.workUnits],
    creativeBriefByCampaignId: { ...input.initial.creativeBriefByCampaignId },
  };

  return {
    getOrchestratorInput: () => ({
      projectId: state.projectId,
      workUnits: [...state.workUnits],
      strategy: state.strategy,
      creativeBriefByCampaignId: { ...state.creativeBriefByCampaignId },
    }),
    getApprovalMode: input.getApprovalMode,
    executeWorkUnit: async (workUnitId) => {
      const result = await input.executeWorkUnit(workUnitId);
      if (result.ok && "workUnit" in result) {
        state.workUnits = state.workUnits.map((unit) =>
          unit.id === result.workUnit.id ? result.workUnit : unit
        );
        if (result.kind === "campaign_strategy" && "strategy" in result) {
          state.strategy = result.strategy;
        }
        if (result.kind === "creative_direction" && "brief" in result) {
          state.creativeBriefByCampaignId = {
            ...state.creativeBriefByCampaignId,
            [state.projectId]: result.brief,
          };
        }
      }
      return result;
    },
  };
}

describe("runCampaignContinuation", () => {
  it("stops immediately when no executable work units exist", async () => {
    const result = await runCampaignContinuation(
      projectId,
      createRunnerDeps({
        initial: {
          projectId,
          workUnits: [],
          strategy: null,
          creativeBriefByCampaignId: {},
        },
        executeWorkUnit: vi.fn(),
      })
    );

    expect(result.stopReason).toBe("no_executable_work_units");
    expect(result.iterations).toBe(0);
    expect(result.completedWorkUnits).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("executes strategy then creative when approval allows chaining", async () => {
    let strategy = strategyUnit("queued");
    let creative = creativeUnit("queued");

    const executeWorkUnit = vi.fn(async (workUnitId: string) => {
      if (workUnitId === strategy.id) {
        strategy = transitionWorkUnit(
          strategy,
          "review_ready",
          "review_ready",
          CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
        );
        return {
          ok: true as const,
          workUnitId,
          kind: "campaign_strategy" as const,
          phase: "completed" as const,
          workUnit: strategy,
          strategy: { summary: "Done", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
          output: {} as never,
          warnings: [],
          idempotent: false,
        };
      }
      creative = transitionWorkUnit(
        creative,
        "review_ready",
        "review_ready",
        CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
      );
      return {
        ok: true as const,
        workUnitId,
        kind: "creative_direction" as const,
        phase: "completed" as const,
        workUnit: creative,
        brief: { campaignGoal: { summary: "Angle" } } as never,
        output: {} as never,
        warnings: [],
        idempotent: false,
      };
    });

    const result = await runCampaignContinuation(
      projectId,
      createRunnerDeps({
        initial: {
          projectId,
          workUnits: [strategy, creative],
          strategy: null,
          creativeBriefByCampaignId: {},
        },
        executeWorkUnit,
        getApprovalMode: () => "approval_before_publication",
      })
    );

    expect(executeWorkUnit).toHaveBeenCalledTimes(2);
    expect(result.completedWorkUnits.map((u) => u.runtimeKind)).toEqual([
      "campaign_strategy",
      "creative_direction",
    ]);
    expect(result.stopReason).toBe("no_executable_work_units");
  });

  it("stops on execution failure", async () => {
    const strategy = strategyUnit("queued");
    const executeWorkUnit = vi.fn(async () => ({
      ok: false as const,
      code: "ContextUnavailable" as const,
      message: "More campaign information is required.",
      workUnitId: strategy.id,
      phase: "planning" as const,
      failureStage: "resolve_project" as const,
    }));

    const result = await runCampaignContinuation(
      projectId,
      createRunnerDeps({
        initial: {
          projectId,
          workUnits: [strategy],
          strategy: null,
          creativeBriefByCampaignId: {},
        },
        executeWorkUnit,
      })
    );

    expect(result.ok).toBe(false);
    expect(result.stopReason).toBe("execution_failed");
    expect(result.failedWorkUnit?.workUnitId).toBe(strategy.id);
    expect(result.iterations).toBe(1);
  });

  it("stops for review when approval is required before generation", async () => {
    let strategy = strategyUnit("queued");
    const creative = creativeUnit("queued");
    const executeWorkUnit = vi.fn(async () => {
      strategy = transitionWorkUnit(
        strategy,
        "review_ready",
        "review_ready",
        CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
      );
      return {
        ok: true as const,
        workUnitId: strategy.id,
        kind: "campaign_strategy" as const,
        phase: "completed" as const,
        workUnit: strategy,
        strategy: { summary: "Done", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
        output: {} as never,
        warnings: [],
        idempotent: false,
      };
    });

    const result = await runCampaignContinuation(
      projectId,
      createRunnerDeps({
        initial: {
          projectId,
          workUnits: [strategy, creative],
          strategy: null,
          creativeBriefByCampaignId: {},
        },
        executeWorkUnit,
        getApprovalMode: () => "approval_before_generation",
      })
    );

    expect(result.stopReason).toBe("review_required");
    expect(result.completedWorkUnits).toHaveLength(1);
    expect(executeWorkUnit).toHaveBeenCalledTimes(1);
  });

  it("enforces the iteration safety limit", async () => {
    const strategy = strategyUnit("queued");
    const executeWorkUnit = vi.fn(async () => ({
      ok: true as const,
      workUnitId: strategy.id,
      kind: "campaign_strategy" as const,
      phase: "completed" as const,
      workUnit: strategy,
      strategy: { summary: "Done", generatedAt: "2026-07-24T12:00:00.000Z" } as never,
      output: {} as never,
      warnings: [],
      idempotent: false,
    }));

    const result = await runCampaignContinuation(
      projectId,
      createRunnerDeps({
        initial: {
          projectId,
          workUnits: [strategy],
          strategy: null,
          creativeBriefByCampaignId: {},
        },
        executeWorkUnit,
      })
    );

    expect(result.stopReason).toBe("iteration_limit");
    expect(result.iterations).toBe(CAMPAIGN_CONTINUATION_MAX_ITERATIONS);
    expect(executeWorkUnit).toHaveBeenCalledTimes(CAMPAIGN_CONTINUATION_MAX_ITERATIONS);
  });
});

describe("CampaignContinuationRunner", () => {
  it("exposes continueCampaign on the class", async () => {
    const { CampaignContinuationRunner } = await import("../campaign-continuation-runner");
    const runner = new CampaignContinuationRunner(
      createRunnerDeps({
        initial: {
          projectId,
          workUnits: [],
          strategy: null,
          creativeBriefByCampaignId: {},
        },
        executeWorkUnit: vi.fn(),
      })
    );
    const result = await runner.continueCampaign(projectId);
    expect(result.stopReason).toBe("no_executable_work_units");
  });
});
