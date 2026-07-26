import { ContextEngineError } from "@/lib/context-engine/core/errors";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import { generateMarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
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
import { buildEmailCampaignTaskHint } from "./build-email-campaign-task-hint";
import { buildMarketingDecisionSourceForCampaign } from "./build-marketing-decision-source-for-campaign";
import type { MarketingWorkUnitRuntimeErrorCode } from "./errors";
import {
  areLinkedInPostDependenciesMet,
  LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
} from "./linkedin-post-dependencies";
import { resolveContentExecutionArtifacts } from "./resolve-content-execution-artifacts";
import {
  customerSafeExecutionMessage,
  logMarketingWorkUnitExecutionFailure,
} from "./marketing-work-unit-runtime-diagnostics";
import {
  mapEmailCampaignToWorkUnitOutput,
  validateEmailCampaignWorkUnitOutput,
} from "./validate-email-campaign-output";
import type {
  ExecuteMarketingWorkUnitInput,
  MarketingWorkUnitExecutionFailure,
  MarketingWorkUnitFailureStage,
  MarketingWorkUnitRuntimeDeps,
} from "./types";

export const EMAIL_CAMPAIGN_EXECUTION_COMPLETE_NOTE = "Email campaign execution completed";

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
    next = transitionWorkUnit(next, "planning", "planning_started", "Email campaign planned");
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
      "Executing email campaign"
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
      EMAIL_CAMPAIGN_EXECUTION_COMPLETE_NOTE
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

function hasCompletedEmailCampaignExecution(
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit
): boolean {
  return unit.eventLog.some((e) => e.note.includes(EMAIL_CAMPAIGN_EXECUTION_COMPLETE_NOTE));
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
    campaignId: input.projectId,
    runtimeKind: "email_campaign",
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

export async function executeEmailCampaignWorkUnit(
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

  const artifacts = resolveContentExecutionArtifacts({
    projectId,
    workUnits: domainInput.workUnits,
    strategy: domainInput.strategy,
    creativeBriefByCampaignId: domainInput.creativeBriefByCampaignId,
  });
  if (!artifacts.ok) {
    return executionFailure({
      workUnitId,
      projectId,
      code: "ContextUnavailable",
      failureStage: "resolve_project",
      internalMessage: artifacts.internalMessage,
      phase: "planning",
      workUnit: unit,
    });
  }
  const { strategy, creativeBrief } = artifacts;

  const existingEmail = domainInput.emailByWorkUnitId?.[workUnitId];
  if (hasCompletedEmailCampaignExecution(unit) && existingEmail) {
    return {
      ok: true as const,
      workUnitId,
      kind: "email_campaign" as const,
      phase: "completed" as const,
      output: mapEmailCampaignToWorkUnitOutput(existingEmail),
      email: existingEmail,
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
      taskHint: `Email campaign for ${project.title}`,
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
    strategy,
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

  const taskHint = buildEmailCampaignTaskHint({
    project,
    campaign,
    decision,
    strategy,
    creativeBrief,
    workUnit: unit,
  });

  const generation = await deps.generateEmailCampaign({
    contextPackage,
    strategy,
    creativeBrief,
    decision,
    project,
    workUnitId,
    taskHint,
  });

  if (!generation.success) {
    const internalMessage = generation.error || "AI runtime failed to produce email campaign.";
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
      failureStage: "generate_email_campaign",
      internalMessage,
      phase: "failed",
      workUnit: workingUnit,
    });
  }

  const validation = validateEmailCampaignWorkUnitOutput(generation.email);
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

  const output = mapEmailCampaignToWorkUnitOutput(generation.email);

  if (!persistence.saveEmailCampaign) {
    workingUnit = restoreAfterFailedExecution(workingUnit, "Email campaign persistence unavailable.");
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "save_email_campaign",
      internalMessage: "Email could not be saved to the marketing workspace.",
      phase: "failed",
      workUnit: workingUnit,
    });
  }

  try {
    await Promise.resolve(
      persistence.saveEmailCampaign({ workUnitId, email: generation.email })
    );
  } catch (error) {
    workingUnit = restoreAfterFailedExecution(workingUnit, "Email could not be saved.");
    await persistWorkUnit(persistence, workingUnit).catch(() => undefined);
    return executionFailure({
      workUnitId,
      projectId,
      code: "PersistenceFailure",
      failureStage: "save_email_campaign",
      internalMessage: "Email could not be saved to the marketing workspace.",
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
      internalMessage: "Email was generated but the work unit could not be marked complete.",
      phase: "failed",
      workUnit: workingUnit,
      error,
    });
  }

  return {
    ok: true as const,
    workUnitId,
    kind: "email_campaign" as const,
    phase: "completed" as const,
    output,
    email: generation.email,
    workUnit: workingUnit,
    warnings: generation.warnings,
    idempotent: false,
  };
}

export function defaultGenerateEmailCampaignDep(): MarketingWorkUnitRuntimeDeps["generateEmailCampaign"] {
  return (genInput) =>
    generateMarketingEmailCampaign({
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
            email: result.email,
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
