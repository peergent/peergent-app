import {
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
  findCreativeDirectionWorkUnit,
  isCreativeDirectionWorkUnitReviewReady,
} from "@/lib/peer-experience/marketing/runtime";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";
import { isCampaignStrategyCompleteForCreativeDirection } from "@/lib/peer-experience/marketing/runtime/campaign-strategy-dependency";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import {
  WORK_LIFECYCLE_LABELS,
  type WorkLifecycleStage,
} from "@/lib/peer-workflow/work-lifecycle";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

export { findCreativeDirectionWorkUnit, CREATIVE_DIRECTION_WORK_UNIT_TITLE };

export function presentCreativeDirectionBlockedReason(input: {
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
}): string | null {
  if (
    isCampaignStrategyCompleteForCreativeDirection({
      projectId: input.projectId,
      workUnits: input.workUnits,
      strategy: input.strategy,
    })
  ) {
    return null;
  }
  return "Campaign strategy must be completed first.";
}

export function presentMarketingWorkUnitExecutionError(
  result: MarketingWorkUnitExecutionResult
): string {
  if (result.ok) {
    return "Something went wrong. Please try again.";
  }

  switch (result.code) {
    case "UnsupportedWorkUnit":
      return "This task is not supported yet.";
    case "AIRuntimeFailure":
      return "Marketing Peer could not prepare creative direction. Please try again.";
    case "ValidationFailure":
      return "The generated creative direction needs another attempt.";
    case "ContextUnavailable":
      return "More campaign information is required.";
    case "PersistenceFailure":
      return "Creative direction could not be saved safely.";
    case "PromptBuildFailure":
      return "Marketing Peer could not prepare creative direction. Please try again.";
    case "FeatureDisabled":
      return "Campaign workspace is not available.";
    case "WorkspaceUnavailable":
      return "Workspace is unavailable. Refresh and try again.";
    case "ExecutionInProgress":
      return "Marketing Peer is already working on a task.";
    default:
      return "Marketing Peer could not prepare creative direction. Please try again.";
  }
}

export type CreativeDirectionWorkUnitActionViewModel = {
  show: boolean;
  workUnitId: string;
  workItemTitle: string;
  statusLabel: string;
  showPrimaryAction: boolean;
  primaryLabel: string;
  primaryDisabled: boolean;
  blockedReason: string | null;
  completionLabel: string | null;
  isExecuting: boolean;
};

export function buildCreativeDirectionWorkUnitActionViewModel(input: {
  campaignsEnabled: boolean;
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  executingWorkUnitId?: string | null;
  localPending?: boolean;
}): CreativeDirectionWorkUnitActionViewModel | null {
  if (!input.campaignsEnabled) {
    return null;
  }

  const unit = findCreativeDirectionWorkUnit(input.projectId, input.workUnits);
  if (!unit || unit.cancelled) {
    return null;
  }

  const reviewReady = isCreativeDirectionWorkUnitReviewReady(unit);
  const blockedReason = presentCreativeDirectionBlockedReason({
    projectId: input.projectId,
    workUnits: input.workUnits,
    strategy: input.strategy,
  });
  const isExecuting =
    Boolean(input.localPending) ||
    (input.executingWorkUnitId != null && input.executingWorkUnitId === unit.id);

  const statusLabel = WORK_LIFECYCLE_LABELS[unit.status as WorkLifecycleStage] ?? unit.status;

  return {
    show: true,
    workUnitId: unit.id,
    workItemTitle: unit.title,
    statusLabel,
    showPrimaryAction: !reviewReady && !blockedReason,
    primaryLabel: isExecuting
      ? "Marketing Peer is preparing creative direction..."
      : "Let Marketing Peer prepare creative direction",
    primaryDisabled: isExecuting || reviewReady || Boolean(blockedReason),
    blockedReason,
    completionLabel: reviewReady ? "Creative direction ready for review" : null,
    isExecuting,
  };
}
