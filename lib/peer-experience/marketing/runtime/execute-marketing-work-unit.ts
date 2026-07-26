import { ContextEngineError } from "@/lib/context-engine/core/errors";
import { defaultContextEngine } from "@/lib/context-engine";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import { generateMarketingStrategy } from "@/lib/marketing-intelligence/strategy/generate-marketing-strategy";
import {
  recordWorkUnitNote,
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
import { isCampaignStrategyWorkUnit } from "./identify-work-unit";
import { mapMarketingStrategyToCampaignStrategyOutput } from "./map-campaign-strategy-output";
import { resolveCreativeBriefForCampaignStrategy } from "./resolve-creative-brief-for-campaign-strategy";
import { validateCampaignStrategyWorkUnitOutput } from "./validate-campaign-strategy-output";
import type {
  ExecuteMarketingWorkUnitInput,
  ExecuteMarketingWorkUnitResult,
  MarketingWorkUnitExecutionFailure,
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

function markFailed(
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit,
  message: string
) {
  return recordWorkUnitNote(unit, `${EXECUTION_FAILED_PREFIX} ${message}`);
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

function failure(
  workUnitId: string,
  code: MarketingWorkUnitExecutionFailure["code"],
  message: string,
  phase: MarketingWorkUnitExecutionFailure["phase"],
  workUnit?: import("@/lib/peer-workflow/work-unit").WorkUnit
): MarketingWorkUnitExecutionFailure {
  return {
    ok: false,
    code,
    message,
    workUnitId,
    phase,
    ...(workUnit ? { workUnit } : {}),
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
    return failure(workUnitId, "ContextUnavailable", "Work unit not found.", "planning");
  }

  if (!isCampaignStrategyWorkUnit(unit)) {
    return {
      ok: false,
      code: "UnsupportedWorkUnit",
      message: "This work unit type is not supported by the Marketing Peer runtime yet.",
      workUnitId,
    };
  }

  const projectId = unit.projectId?.trim();
  if (!projectId) {
    return failure(
      workUnitId,
      "ContextUnavailable",
      "Campaign strategy work must be linked to a marketing project.",
      "planning",
      unit
    );
  }

  const project = domainInput.projects.find((p) => p.id === projectId);
  if (!project) {
    return failure(
      workUnitId,
      "ContextUnavailable",
      "Marketing project not found for this work unit.",
      "planning",
      unit
    );
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
  } catch {
    return failure(
      workUnitId,
      "PersistenceFailure",
      "Could not mark work unit as executing.",
      "executing",
      workingUnit
    );
  }

  const vmSource = buildMarketingCampaignViewModelSourceFromDomainInput({
    ...domainInput,
    organizationId,
  });
  const campaign = assembleCampaignForMarketingProject(project, vmSource);

  let contextPackage;
  try {
    contextPackage = await deps.buildContext({
      organizationId,
      peerId: domainInput.peerId,
      userId,
      taskHint: `Campaign strategy for ${project.title}`,
    });
  } catch (error) {
    const message =
      error instanceof ContextEngineError
        ? error.message
        : "Business context could not be loaded.";
    workingUnit = markFailed(workingUnit, message);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return failure(workUnitId, "ContextUnavailable", message, "failed", workingUnit);
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
    const message =
      error instanceof Error ? error.message : "Marketing decision could not be resolved.";
    workingUnit = markFailed(workingUnit, message);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return failure(workUnitId, "PromptBuildFailure", message, "failed", workingUnit);
  }

  if (decision.approvalPolicy.mode === "blocked_manual_only") {
    const message = "Manual-only marketing policy blocks autonomous strategy execution.";
    workingUnit = markFailed(workingUnit, message);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return failure(workUnitId, "PromptBuildFailure", message, "failed", workingUnit);
  }

  const briefResult = resolveCreativeBriefForCampaignStrategy({
    contextPackage,
    project,
    decision,
  });

  const taskHint = buildCampaignStrategyTaskHint({
    project,
    campaign,
    decision,
    ...(briefResult.brief ? { brief: briefResult.brief } : {}),
  });

  const generation = await deps.generateStrategy({ contextPackage, taskHint });

  if (!generation.success) {
    const message = generation.error || "AI runtime failed to produce campaign strategy.";
    const code = generation.error.toLowerCase().includes("understanding")
      ? "ContextUnavailable"
      : generation.error.toLowerCase().includes("marketing peer")
        ? "PromptBuildFailure"
        : "AIRuntimeFailure";
    workingUnit = markFailed(workingUnit, message);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return failure(workUnitId, code, message, "failed", workingUnit);
  }

  const output = mapMarketingStrategyToCampaignStrategyOutput({
    project,
    strategy: generation.strategy,
    decision,
  });

  const validation = validateCampaignStrategyWorkUnitOutput(output);
  if (!validation.valid) {
    const message = validation.errors.join(" ");
    workingUnit = markFailed(workingUnit, message);
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return failure(workUnitId, "ValidationFailure", message, "failed", workingUnit);
  }

  try {
    await Promise.resolve(persistence.saveStrategy(generation.strategy));
  } catch {
    workingUnit = markFailed(workingUnit, "Strategy could not be saved.");
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return failure(
      workUnitId,
      "PersistenceFailure",
      "Strategy could not be saved to the marketing workspace.",
      "failed",
      workingUnit
    );
  }

  workingUnit = markCompleted(workingUnit);
  try {
    workingUnit = await persistWorkUnit(persistence, workingUnit);
  } catch {
    return failure(
      workUnitId,
      "PersistenceFailure",
      "Strategy was generated but the work unit could not be marked complete.",
      "failed",
      workingUnit
    );
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
