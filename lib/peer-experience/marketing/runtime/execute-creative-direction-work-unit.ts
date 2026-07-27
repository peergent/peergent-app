import { ContextEngineError } from "@/lib/context-engine/core/errors";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import { generateMarketingCreativeBrief } from "@/lib/marketing-intelligence/creative-brief-generation";
import {
  revertWorkUnitFromFailedExecution,
  transitionWorkUnit,
} from "@/lib/peer-workflow/work-unit-engine";
import {
  WORK_LIFECYCLE_STAGES,
  type WorkLifecycleStage,
} from "@/lib/peer-workflow/work-lifecycle";

import { assembleCampaignForMarketingProject } from "../view-models/build-project-campaign-projection";
import { buildMarketingCampaignViewModelSourceFromDomainInput } from "../view-models/build-marketing-campaigns-view-model";
import { isCampaignStrategyCompleteForCreativeDirection } from "./campaign-strategy-dependency";
import { buildCreativeDirectionTaskHint } from "./build-creative-direction-task-hint";
import { buildMarketingDecisionSourceForCampaign } from "./build-marketing-decision-source-for-campaign";
import type { MarketingWorkUnitRuntimeErrorCode } from "./errors";
import {
  customerSafeExecutionMessage,
  logMarketingWorkUnitExecutionFailure,
} from "./marketing-work-unit-runtime-diagnostics";
import {
  mapCreativeBriefToWorkUnitOutput,
  validateCreativeDirectionWorkUnitOutput,
} from "./validate-creative-direction-output";
import type {
  ExecuteMarketingWorkUnitInput,
  MarketingWorkUnitExecutionFailure,
  MarketingWorkUnitFailureStage,
  MarketingWorkUnitRuntimeDeps,
} from "./types";

export const CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE =
  "Creative direction execution completed";

const EXECUTION_FAILED_PREFIX = "Creative direction execution failed:";

async function persistWorkUnit(
  persistence: ExecuteMarketingWorkUnitInput["persistence"],
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit
) {
  return Promise.resolve(persistence.updateWorkUnit(unit));
}

function lifecycleIndex(stage: WorkLifecycleStage): number {
  return WORK_LIFECYCLE_STAGES.indexOf(stage);
}

function ensurePlanningStage(unit: import("@/lib/peer-workflow/work-unit").WorkUnit) {
  let next = unit;
  while (lifecycleIndex(next.status) < lifecycleIndex("planning")) {
    next = transitionWorkUnit(next, "planning", "planning_started", "Creative direction planned");
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
      "Executing creative direction"
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
      CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
    );
  }
  return next;
}

function restoreAfterFailedExecution(
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit,
  internalMessage: string
) {
  if (unit.status === "creating") {
    return revertWorkUnitFromFailedExecution(unit, internalMessage);
  }
  return unit;
}

function hasCompletedCreativeDirectionExecution(
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit
): boolean {
  return unit.eventLog.some((e) => e.note.includes(CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE));
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

export async function executeCreativeDirectionWorkUnit(
  input: ExecuteMarketingWorkUnitInput,
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit,
  deps: MarketingWorkUnitRuntimeDeps
) {
  const { workUnitId, organizationId, userId, domainInput, persistence } = input;
  const projectId = unit.projectId!.trim();
  const project = domainInput.projects.find((p) => p.id === projectId)!;

  if (
    !isCampaignStrategyCompleteForCreativeDirection({
      projectId,
      workUnits: domainInput.workUnits,
      strategy: domainInput.strategy,
    })
  ) {
    return executionFailure({
      workUnitId,
      projectId,
      code: "ContextUnavailable",
      failureStage: "resolve_project",
      internalMessage: "Campaign strategy must be completed before creative direction.",
      phase: "planning",
      workUnit: unit,
    });
  }

  const existingBrief = domainInput.creativeBriefByCampaignId?.[projectId];
  if (hasCompletedCreativeDirectionExecution(unit) && existingBrief && !input.executionOptions?.forceRegenerate) {
    return {
      ok: true as const,
      workUnitId,
      kind: "creative_direction" as const,
      phase: "completed" as const,
      output: mapCreativeBriefToWorkUnitOutput(existingBrief),
      brief: existingBrief,
      workUnit: unit,
      warnings: [] as readonly string[],
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
      taskHint: `Creative direction for ${project.title}`,
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

  const strategy = domainInput.strategy!;
  const taskHint = buildCreativeDirectionTaskHint({
    project,
    campaign,
    decision,
    strategy,
  });
  const taskHintWithFeedback =
    input.executionOptions?.reviewFeedbackTaskHint?.trim()
      ? `${taskHint}\n${input.executionOptions.reviewFeedbackTaskHint.trim()}`
      : taskHint;

  const generation = await deps.generateCreativeBrief({
    contextPackage,
    strategy,
    decision,
    project,
    taskHint: taskHintWithFeedback,
  });

  if (!generation.success) {
    const internalMessage =
      generation.error || "AI runtime failed to produce creative direction.";
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
      failureStage: "generate_creative_brief",
      internalMessage,
      phase: "failed",
      workUnit: workingUnit,
    });
  }

  const validation = validateCreativeDirectionWorkUnitOutput(generation.brief);
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

  const output = mapCreativeBriefToWorkUnitOutput(generation.brief);

  if (!persistence.saveCreativeBrief) {
    workingUnit = restoreAfterFailedExecution(workingUnit, "Creative brief persistence unavailable.");
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "save_creative_brief",
      internalMessage: "Creative brief could not be saved to the marketing workspace.",
      phase: "failed",
      workUnit: workingUnit,
    });
  }

  try {
    await Promise.resolve(
      persistence.saveCreativeBrief({ campaignId: projectId, brief: generation.brief })
    );
  } catch (error) {
    workingUnit = restoreAfterFailedExecution(workingUnit, "Creative brief could not be saved.");
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "save_creative_brief",
      internalMessage: "Creative brief could not be saved to the marketing workspace.",
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
      internalMessage: "Creative direction was generated but the work unit could not be marked complete.",
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  return {
    ok: true as const,
    workUnitId,
    kind: "creative_direction" as const,
    phase: "completed" as const,
    output,
    brief: generation.brief,
    workUnit: workingUnit,
    warnings: generation.warnings,
    idempotent: false,
  };
}

export function defaultGenerateCreativeBriefDep(): MarketingWorkUnitRuntimeDeps["generateCreativeBrief"] {
  return (genInput) =>
    generateMarketingCreativeBrief({
      contextPackage: genInput.contextPackage,
      strategy: genInput.strategy,
      decision: genInput.decision,
      project: genInput.project,
      taskHint: genInput.taskHint,
    }).then((result) =>
      result.success
        ? {
            success: true as const,
            brief: result.brief,
            warnings: result.warnings,
            traceId: result.traceId,
          }
        : {
            success: false as const,
            error: result.error,
            warnings: result.warnings,
            traceId: result.traceId,
          }
    );
}
