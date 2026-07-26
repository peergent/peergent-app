import { ContextEngineError } from "@/lib/context-engine/core/errors";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import { generateMarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
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
import { buildLinkedInPostTaskHint } from "./build-linkedin-post-task-hint";
import { buildMarketingDecisionSourceForCampaign } from "./build-marketing-decision-source-for-campaign";
import type { MarketingWorkUnitRuntimeErrorCode } from "./errors";
import {
  areLinkedInPostDependenciesMet,
  LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
} from "./linkedin-post-dependencies";
import {
  customerSafeExecutionMessage,
  logMarketingWorkUnitExecutionFailure,
} from "./marketing-work-unit-runtime-diagnostics";
import {
  mapLinkedInPostToWorkUnitOutput,
  validateLinkedInPostWorkUnitOutput,
} from "./validate-linkedin-post-output";
import type {
  ExecuteMarketingWorkUnitInput,
  MarketingWorkUnitExecutionFailure,
  MarketingWorkUnitFailureStage,
  MarketingWorkUnitRuntimeDeps,
} from "./types";

export const LINKEDIN_POST_EXECUTION_COMPLETE_NOTE = "LinkedIn post execution completed";

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
    next = transitionWorkUnit(next, "planning", "planning_started", "LinkedIn post planned");
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
      "Executing LinkedIn post"
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
      LINKEDIN_POST_EXECUTION_COMPLETE_NOTE
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

function hasCompletedLinkedInPostExecution(
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit
): boolean {
  return unit.eventLog.some((e) => e.note.includes(LINKEDIN_POST_EXECUTION_COMPLETE_NOTE));
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
    customerMessage?: string;
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
    message: input.customerMessage ?? customerSafeExecutionMessage(input.code),
    workUnitId: input.workUnitId,
    phase: input.phase,
    failureStage: input.failureStage,
    ...(input.workUnit ? { workUnit: input.workUnit } : {}),
  };
}

export async function executeLinkedInPostWorkUnit(
  input: ExecuteMarketingWorkUnitInput,
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit,
  deps: MarketingWorkUnitRuntimeDeps
) {
  const { workUnitId, organizationId, userId, domainInput, persistence } = input;
  const projectId = unit.projectId!.trim();
  const project = domainInput.projects.find((p) => p.id === projectId)!;

  if (
    !areLinkedInPostDependenciesMet({
      projectId,
      workUnits: domainInput.workUnits,
      strategy: domainInput.strategy,
      creativeBriefByCampaignId: domainInput.creativeBriefByCampaignId,
    })
  ) {
    return executionFailure({
      workUnitId,
      projectId,
      code: "ContextUnavailable",
      failureStage: "resolve_project",
      internalMessage: LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
      phase: "planning",
      workUnit: unit,
      customerMessage: LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
    });
  }

  const creativeBrief = domainInput.creativeBriefByCampaignId?.[projectId];
  if (!creativeBrief?.campaignGoal.summary?.trim()) {
    return executionFailure({
      workUnitId,
      projectId,
      code: "ContextUnavailable",
      failureStage: "resolve_project",
      internalMessage: LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
      phase: "planning",
      workUnit: unit,
      customerMessage: LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
    });
  }

  const existingPost = domainInput.linkedinPostByWorkUnitId?.[workUnitId];
  if (hasCompletedLinkedInPostExecution(unit) && existingPost) {
    return {
      ok: true as const,
      workUnitId,
      kind: "linkedin_post" as const,
      phase: "completed" as const,
      output: mapLinkedInPostToWorkUnitOutput(existingPost),
      post: existingPost,
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
      taskHint: `LinkedIn post for ${project.title}`,
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
  const taskHint = buildLinkedInPostTaskHint({
    project,
    campaign,
    decision,
    strategy,
    creativeBrief,
    workUnit: unit,
  });

  const generation = await deps.generateLinkedInPost({
    contextPackage,
    strategy,
    creativeBrief,
    decision,
    project,
    workUnitId,
    taskHint,
  });

  if (!generation.success) {
    const internalMessage = generation.error || "AI runtime failed to produce LinkedIn post.";
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
      failureStage: "generate_linkedin_post",
      internalMessage,
      phase: "failed",
      workUnit: workingUnit,
    });
  }

  const validation = validateLinkedInPostWorkUnitOutput(generation.post);
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

  const output = mapLinkedInPostToWorkUnitOutput(generation.post);

  if (!persistence.saveLinkedInPost) {
    workingUnit = restoreAfterFailedExecution(workingUnit, "LinkedIn post persistence unavailable.");
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "save_linkedin_post",
      internalMessage: "LinkedIn post could not be saved to the marketing workspace.",
      phase: "failed",
      workUnit: workingUnit,
    });
  }

  try {
    await Promise.resolve(
      persistence.saveLinkedInPost({ workUnitId, post: generation.post })
    );
  } catch (error) {
    workingUnit = restoreAfterFailedExecution(workingUnit, "LinkedIn post could not be saved.");
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "save_linkedin_post",
      internalMessage: "LinkedIn post could not be saved to the marketing workspace.",
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
      internalMessage: "LinkedIn post was generated but the work unit could not be marked complete.",
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  return {
    ok: true as const,
    workUnitId,
    kind: "linkedin_post" as const,
    phase: "completed" as const,
    output,
    post: generation.post,
    workUnit: workingUnit,
    warnings: generation.warnings,
    idempotent: false,
  };
}

export function defaultGenerateLinkedInPostDep(): MarketingWorkUnitRuntimeDeps["generateLinkedInPost"] {
  return (genInput) =>
    generateMarketingLinkedInPost({
      contextPackage: genInput.contextPackage,
      strategy: genInput.strategy,
      creativeBrief: genInput.creativeBrief,
      decision: genInput.decision,
      project: genInput.project,
      workUnitId: genInput.workUnitId,
      taskHint: genInput.taskHint,
    }).then((result) =>
      result.success
        ? {
            success: true as const,
            post: result.post,
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
