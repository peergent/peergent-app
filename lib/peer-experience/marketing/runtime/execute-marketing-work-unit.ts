import { ContextEngineError } from "@/lib/context-engine/core/errors";
import { defaultContextEngine } from "@/lib/context-engine";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import { generateMarketingStrategy } from "@/lib/marketing-intelligence/strategy/generate-marketing-strategy";
import {
  recordWorkUnitNote,
  revertWorkUnitFromFailedExecution,
  transitionWorkUnit,
} from "@/lib/peer-workflow/work-unit-engine";
import {
  WORK_LIFECYCLE_STAGES,
  type WorkLifecycleStage,
} from "@/lib/peer-workflow/work-lifecycle";

import { assembleCampaignForMarketingProject } from "../view-models/build-project-campaign-projection";
import { buildMarketingCampaignViewModelSourceFromDomainInput } from "../view-models/build-marketing-campaigns-view-model";
import { buildCampaignStrategyTaskHint } from "./build-campaign-strategy-task-hint";
import { buildMarketingDecisionSourceForCampaign } from "./build-marketing-decision-source-for-campaign";
import type { MarketingWorkUnitRuntimeErrorCode } from "./errors";
import { isCampaignStrategyWorkUnit } from "./identify-work-unit";
import { mapMarketingStrategyToCampaignStrategyOutput } from "./map-campaign-strategy-output";
import {
  customerSafeExecutionMessage,
  logMarketingWorkUnitExecutionFailure,
} from "./marketing-work-unit-runtime-diagnostics";
import { resolveCreativeBriefForCampaignStrategy } from "./resolve-creative-brief-for-campaign-strategy";
import { validateCampaignStrategyWorkUnitOutput } from "./validate-campaign-strategy-output";
import type {
  ExecuteMarketingWorkUnitInput,
  ExecuteMarketingWorkUnitResult,
  MarketingWorkUnitExecutionFailure,
  MarketingWorkUnitFailureStage,
  MarketingWorkUnitRuntimeDeps,
} from "./types";

export const CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE =
  "Campaign strategy execution completed";

const EXECUTION_FAILED_PREFIX = "Campaign strategy execution failed:";

async function persistWorkUnit(
  persistence: ExecuteMarketingWorkUnitInput["persistence"],
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit
): Promise<import("@/lib/peer-workflow/work-unit").WorkUnit> {
  return Promise.resolve(persistence.updateWorkUnit(unit));
}

function lifecycleIndex(stage: WorkLifecycleStage): number {
  return WORK_LIFECYCLE_STAGES.indexOf(stage);
}

function ensurePlanningStage(unit: import("@/lib/peer-workflow/work-unit").WorkUnit) {
  let next = unit;
  while (lifecycleIndex(next.status) < lifecycleIndex("planning")) {
    next = transitionWorkUnit(next, "planning", "planning_started", "Campaign strategy planned");
  }
  return next;
}

function markExecuting(unit: import("@/lib/peer-workflow/work-unit").WorkUnit) {
  let next = ensurePlanningStage(unit);
  if (next.status === "planning") {
    next = transitionWorkUnit(
      next,
      "creating",
      "creation_started",
      "Executing campaign strategy"
    );
  }
  return next;
}

function markCompleted(unit: import("@/lib/peer-workflow/work-unit").WorkUnit) {
  let next = unit;
  if (lifecycleIndex(next.status) < lifecycleIndex("review_ready")) {
    next = transitionWorkUnit(
      next,
      "review_ready",
      "review_ready",
      CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
    );
  } else {
    next = recordWorkUnitNote(next, CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE);
  }
  return next;
}

function restoreAfterFailedExecution(
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit,
  internalMessage: string
) {
  const note = `${EXECUTION_FAILED_PREFIX} ${internalMessage}`;
  if (unit.status === "creating") {
    return revertWorkUnitFromFailedExecution(unit, internalMessage);
  }
  return recordWorkUnitNote(unit, note);
}

function hasCompletedStrategyExecution(unit: import("@/lib/peer-workflow/work-unit").WorkUnit): boolean {
  return unit.eventLog.some((e) => e.note.includes(CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE));
}

function resolveDeps(
  overrides?: Partial<MarketingWorkUnitRuntimeDeps>
): MarketingWorkUnitRuntimeDeps {
  return {
    buildContext: overrides?.buildContext ?? ((request) => defaultContextEngine.buildContext(request)),
    generateStrategy:
      overrides?.generateStrategy ??
      ((input) =>
        generateMarketingStrategy({
          contextPackage: input.contextPackage,
          taskHint: input.taskHint,
        })),
  };
}

function executionFailure(
  input: {
    workUnitId: string;
    projectId?: string;
    code: Exclude<MarketingWorkUnitRuntimeErrorCode, "UnsupportedWorkUnit">;
    failureStage: MarketingWorkUnitFailureStage;
    internalMessage: string;
    phase: MarketingWorkUnitExecutionFailure["phase"];
    workUnit?: import("@/lib/peer-workflow/work-unit").WorkUnit;
    error?: unknown;
  }
): MarketingWorkUnitExecutionFailure {
  logMarketingWorkUnitExecutionFailure({
    failureStage: input.failureStage,
    code: input.code,
    workUnitId: input.workUnitId,
    projectId: input.projectId,
    internalMessage: input.internalMessage,
    error: input.error,
  });
  return {
    ok: false,
    code: input.code,
    message: customerSafeExecutionMessage(input.code),
    workUnitId: input.workUnitId,
    phase: input.phase,
    failureStage: input.failureStage,
    ...(input.workUnit ? { workUnit: input.workUnit } : {}),
  };
}

/**
 * Executes exactly one eligible Marketing Work Unit (Campaign Strategy only).
 * No loops, schedulers, or campaign-wide execution.
 */
export async function executeMarketingWorkUnit(
  input: ExecuteMarketingWorkUnitInput
): Promise<ExecuteMarketingWorkUnitResult> {
  const { workUnitId, organizationId, userId, domainInput, persistence } = input;
  const deps = resolveDeps(input.deps);

  const unit = domainInput.workUnits.find((u) => u.id === workUnitId);
  if (!unit) {
    return executionFailure({
      workUnitId,
      code: "ContextUnavailable",
      failureStage: "resolve_work_unit",
      internalMessage: "Work unit not found.",
      phase: "planning",
    });
  }

  if (!isCampaignStrategyWorkUnit(unit)) {
    logMarketingWorkUnitExecutionFailure({
      failureStage: "resolve_work_unit",
      code: "UnsupportedWorkUnit",
      workUnitId,
      projectId: unit.projectId ?? undefined,
      internalMessage: "Work unit type is not supported by runtime.",
    });
    return {
      ok: false,
      code: "UnsupportedWorkUnit",
      message: "This work unit type is not supported by the Marketing Peer runtime yet.",
      workUnitId,
      failureStage: "resolve_work_unit",
    };
  }

  const projectId = unit.projectId?.trim();
  if (!projectId) {
    return executionFailure({
      workUnitId,
      code: "ContextUnavailable",
      failureStage: "resolve_project",
      internalMessage: "Campaign strategy work must be linked to a marketing project.",
      phase: "planning",
      workUnit: unit,
    });
  }

  const project = domainInput.projects.find((p) => p.id === projectId);
  if (!project) {
    return executionFailure({
      workUnitId,
      projectId,
      code: "ContextUnavailable",
      failureStage: "resolve_project",
      internalMessage: "Marketing project not found for this work unit.",
      phase: "planning",
      workUnit: unit,
    });
  }

  if (hasCompletedStrategyExecution(unit) && domainInput.strategy) {
    const output = mapMarketingStrategyToCampaignStrategyOutput({
      project,
      strategy: domainInput.strategy,
      decision: null,
    });
    return {
      ok: true,
      workUnitId,
      kind: "campaign_strategy",
      phase: "completed",
      output,
      strategy: domainInput.strategy,
      workUnit: unit,
      warnings: [],
      idempotent: true,
    };
  }

  let workingUnit = markExecuting(unit);

  try {
    workingUnit = await persistWorkUnit(persistence, workingUnit);
  } catch (error) {
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "update_work_unit",
      internalMessage: "Could not mark work unit as executing.",
      phase: "executing",
      workUnit: workingUnit,
      error,
    });
  }

  const vmSource = buildMarketingCampaignViewModelSourceFromDomainInput({
    ...domainInput,
    organizationId,
  });

  let campaign;
  let taskHint: string;

  try {
    campaign = assembleCampaignForMarketingProject(project, vmSource);
  } catch (error) {
    workingUnit = restoreAfterFailedExecution(
      workingUnit,
      error instanceof Error ? error.message : "Campaign projection failed."
    );
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "ContextUnavailable",
      failureStage: "resolve_project",
      internalMessage:
        error instanceof Error ? error.message : "Campaign could not be resolved for this project.",
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  let contextPackage;
  try {
    contextPackage = await deps.buildContext({
      organizationId,
      peerId: domainInput.peerId,
      userId,
      taskHint: `Campaign strategy for ${project.title}`,
    });
  } catch (error) {
    const internalMessage =
      error instanceof ContextEngineError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Business context could not be loaded.";
    workingUnit = restoreAfterFailedExecution(workingUnit, internalMessage);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "ContextUnavailable",
      failureStage: "build_context",
      internalMessage,
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  const decisionSource = buildMarketingDecisionSourceForCampaign({
    contextPackage,
    project,
    strategy: domainInput.strategy,
    plan: domainInput.plan,
    responsibilities: domainInput.responsibilities,
  });

  let decision;
  try {
    decision = assembleMarketingDecision(decisionSource);
  } catch (error) {
    const internalMessage =
      error instanceof Error ? error.message : "Marketing decision could not be resolved.";
    workingUnit = restoreAfterFailedExecution(workingUnit, internalMessage);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PromptBuildFailure",
      failureStage: "assemble_decision",
      internalMessage,
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  const briefResult = resolveCreativeBriefForCampaignStrategy({
    contextPackage,
    project,
    decision,
  });

  try {
    taskHint = buildCampaignStrategyTaskHint({
      project,
      campaign,
      decision,
      ...(briefResult.brief ? { brief: briefResult.brief } : {}),
    });
  } catch (error) {
    workingUnit = restoreAfterFailedExecution(
      workingUnit,
      error instanceof Error ? error.message : "Campaign strategy task hint failed."
    );
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PromptBuildFailure",
      failureStage: "assemble_brief",
      internalMessage:
        error instanceof Error ? error.message : "Campaign strategy task hint could not be built.",
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  const generation = await deps.generateStrategy({ contextPackage, taskHint });

  if (!generation.success) {
    const internalMessage =
      generation.error || "AI runtime failed to produce campaign strategy.";
    const code = internalMessage.toLowerCase().includes("understanding")
      ? "ContextUnavailable"
      : internalMessage.toLowerCase().includes("marketing peer")
        ? "PromptBuildFailure"
        : "AIRuntimeFailure";
    workingUnit = restoreAfterFailedExecution(workingUnit, internalMessage);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code,
      failureStage: "generate_strategy",
      internalMessage,
      phase: "failed",
      workUnit: workingUnit,
    });
  }

  const output = mapMarketingStrategyToCampaignStrategyOutput({
    project,
    strategy: generation.strategy,
    decision,
  });

  const validation = validateCampaignStrategyWorkUnitOutput(output);
  if (!validation.valid) {
    const internalMessage = validation.errors.join(" ");
    workingUnit = restoreAfterFailedExecution(workingUnit, internalMessage);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "ValidationFailure",
      failureStage: "validate_output",
      internalMessage,
      phase: "failed",
      workUnit: workingUnit,
    });
  }

  try {
    await Promise.resolve(persistence.saveStrategy(generation.strategy));
  } catch (error) {
    workingUnit = restoreAfterFailedExecution(workingUnit, "Strategy could not be saved.");
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "save_strategy",
      internalMessage: "Strategy could not be saved to the marketing workspace.",
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  workingUnit = markCompleted(workingUnit);
  try {
    workingUnit = await persistWorkUnit(persistence, workingUnit);
  } catch (error) {
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "update_work_unit",
      internalMessage: "Strategy was generated but the work unit could not be marked complete.",
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  return {
    ok: true,
    workUnitId,
    kind: "campaign_strategy",
    phase: "completed",
    output,
    strategy: generation.strategy,
    workUnit: workingUnit,
    warnings: [...briefResult.warnings, ...generation.warnings],
    idempotent: false,
  };
}
