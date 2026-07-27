import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";

import { CampaignOrchestrator } from "../campaign-orchestrator/campaign-orchestrator";
import type { MarketingWorkUnit } from "../campaign-orchestrator/types";
import { isMarketingWorkUnitPlanComplete } from "../campaign-orchestrator/evaluate-marketing-work-unit-plan";
import { campaignContinuationStopMessage } from "./campaign-continuation-messages";
import type {
  CampaignContinuationResult,
  CampaignContinuationRunnerDeps,
} from "./types";
import { CAMPAIGN_CONTINUATION_MAX_ITERATIONS } from "./types";

const RUNTIME_KIND_EXECUTION_ORDER: Record<
  MarketingWorkUnit["runtimeKind"],
  number
> = {
  campaign_strategy: 0,
  creative_direction: 1,
  linkedin_post: 2,
  email_campaign: 3,
};

function pickNextExecutableWorkUnit(
  executableWorkUnits: readonly MarketingWorkUnit[]
): MarketingWorkUnit | null {
  if (executableWorkUnits.length === 0) {
    return null;
  }
  return [...executableWorkUnits].sort(
    (a, b) =>
      RUNTIME_KIND_EXECUTION_ORDER[a.runtimeKind] -
      RUNTIME_KIND_EXECUTION_ORDER[b.runtimeKind]
  )[0]!;
}

function shouldStopForReviewAfterSuccess(input: {
  approvalMode: CampaignApprovalMode | undefined;
  executed: MarketingWorkUnit;
}): boolean {
  if (input.approvalMode !== "approval_before_generation") {
    return false;
  }
  return isMarketingWorkUnitPlanComplete(
    input.executed.runtimeKind,
    input.executed.workUnit
  );
}

/**
 * Runs executable marketing work units sequentially until a stop condition is met.
 * Does not mutate workspace state except through injected executeWorkUnit.
 */
export async function runCampaignContinuation(
  projectId: string,
  deps: CampaignContinuationRunnerDeps
): Promise<CampaignContinuationResult> {
  const completedWorkUnits: MarketingWorkUnit[] = [];
  let iterations = 0;

  while (iterations < CAMPAIGN_CONTINUATION_MAX_ITERATIONS) {
    if (deps.hasPendingRequiredReview?.(projectId)) {
      return {
        ok: true,
        projectId,
        completedWorkUnits,
        stopReason: "review_required",
        stopMessage: campaignContinuationStopMessage("review_required"),
        iterations,
      };
    }

    const orchestratorInput = deps.getOrchestratorInput(projectId);
    const plan = CampaignOrchestrator.plan(orchestratorInput);
    const next = pickNextExecutableWorkUnit(plan.executableWorkUnits);

    if (!next) {
      return {
        ok: true,
        projectId,
        completedWorkUnits,
        stopReason: "no_executable_work_units",
        stopMessage: campaignContinuationStopMessage("no_executable_work_units"),
        iterations,
      };
    }

    iterations += 1;
    const result = await deps.executeWorkUnit(next.workUnit.id);

    if (!result.ok) {
      return {
        ok: false,
        projectId,
        completedWorkUnits,
        failedWorkUnit: {
          workUnitId: next.workUnit.id,
          runtimeKind: next.runtimeKind,
          message: result.message,
        },
        stopReason: "execution_failed",
        stopMessage: campaignContinuationStopMessage("execution_failed"),
        iterations,
      };
    }

    const executedUnit: MarketingWorkUnit = {
      workUnit: result.workUnit,
      runtimeKind: next.runtimeKind,
    };
    completedWorkUnits.push(executedUnit);

    const approvalMode = deps.getApprovalMode?.(projectId);
    if (
      shouldStopForReviewAfterSuccess({
        approvalMode,
        executed: executedUnit,
      })
    ) {
      return {
        ok: true,
        projectId,
        completedWorkUnits,
        stopReason: "review_required",
        stopMessage: campaignContinuationStopMessage("review_required"),
        iterations,
      };
    }
  }

  return {
    ok: false,
    projectId,
    completedWorkUnits,
    stopReason: "iteration_limit",
    stopMessage: campaignContinuationStopMessage("iteration_limit"),
    iterations,
  };
}

export class CampaignContinuationRunner {
  constructor(private readonly deps: CampaignContinuationRunnerDeps) {}

  continueCampaign(projectId: string): Promise<CampaignContinuationResult> {
    return runCampaignContinuation(projectId, this.deps);
  }
}
