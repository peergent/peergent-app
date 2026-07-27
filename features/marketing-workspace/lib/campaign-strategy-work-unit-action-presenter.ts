import { isCampaignStrategyWorkUnit } from "@/lib/peer-experience/marketing/runtime";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";
import { workUnitsForProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  lifecycleStageIndex,
  WORK_LIFECYCLE_LABELS,
  type WorkLifecycleStage,
} from "@/lib/peer-workflow/work-lifecycle";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

export function findCampaignStrategyWorkUnit(
  projectId: string,
  workUnits: readonly WorkUnit[]
): WorkUnit | null {
  for (const unit of workUnitsForProject(projectId, [...workUnits])) {
    if (isCampaignStrategyWorkUnit(unit)) {
      return unit;
    }
  }
  return null;
}

export function isCampaignStrategyWorkUnitReviewReady(unit: WorkUnit): boolean {
  return lifecycleStageIndex(unit.status) >= lifecycleStageIndex("review_ready");
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
      return "Marketing Peer could not prepare the strategy. Please try again.";
    case "ValidationFailure":
      return "The generated strategy needs another attempt.";
    case "ContextUnavailable":
      return "More campaign information is required.";
    case "PersistenceFailure":
      return "The strategy could not be saved safely.";
    case "PromptBuildFailure":
      return "Marketing Peer could not prepare the strategy. Please try again.";
    case "FeatureDisabled":
      return "Campaign workspace is not available.";
    case "WorkspaceUnavailable":
      return "Workspace is unavailable. Refresh and try again.";
    case "ExecutionInProgress":
      return "Marketing Peer is already working on a task.";
    default:
      return "Marketing Peer could not prepare the strategy. Please try again.";
  }
}

export type CampaignStrategyWorkUnitActionViewModel = {
  show: boolean;
  workUnitId: string;
  workItemTitle: string;
  statusLabel: string;
  showPrimaryAction: boolean;
  primaryLabel: string;
  primaryDisabled: boolean;
  completionLabel: string | null;
  isExecuting: boolean;
};

export function buildCampaignStrategyWorkUnitActionViewModel(input: {
  campaignsEnabled: boolean;
  projectId: string;
  workUnits: readonly WorkUnit[];
  executingWorkUnitId?: string | null;
  localPending?: boolean;
  manualExecutionDisabled?: boolean;
}): CampaignStrategyWorkUnitActionViewModel | null {
  if (!input.campaignsEnabled) {
    return null;
  }

  const unit = findCampaignStrategyWorkUnit(input.projectId, input.workUnits);
  if (!unit || unit.cancelled) {
    return null;
  }

  const reviewReady = isCampaignStrategyWorkUnitReviewReady(unit);
  const isExecuting =
    Boolean(input.localPending) ||
    (input.executingWorkUnitId != null && input.executingWorkUnitId === unit.id);

  const statusLabel = WORK_LIFECYCLE_LABELS[unit.status as WorkLifecycleStage] ?? unit.status;

  return {
    show: true,
    workUnitId: unit.id,
    workItemTitle: unit.title,
    statusLabel,
    showPrimaryAction: !reviewReady,
    primaryLabel: isExecuting
      ? "Marketing Peer is preparing strategy..."
      : "Let Marketing Peer prepare strategy",
    primaryDisabled:
      isExecuting || reviewReady || Boolean(input.manualExecutionDisabled),
    completionLabel: reviewReady ? "Strategy ready for review" : null,
    isExecuting,
  };
}
