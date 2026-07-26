import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import {
  findLinkedInPostWorkUnits,
  isGenericChannelPlaceholderWorkUnit,
  isLinkedInPostWorkUnitReviewReady,
} from "@/lib/peer-experience/marketing/runtime";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";
import {
  areLinkedInPostDependenciesMet,
  LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
} from "@/lib/peer-experience/marketing/runtime/linkedin-post-dependencies";
import {
  WORK_LIFECYCLE_LABELS,
  type WorkLifecycleStage,
} from "@/lib/peer-workflow/work-lifecycle";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

export { findLinkedInPostWorkUnits, LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE };

export function presentLinkedInPostBlockedReason(input: {
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
}): string | null {
  if (
    areLinkedInPostDependenciesMet({
      projectId: input.projectId,
      workUnits: input.workUnits,
      strategy: input.strategy,
      creativeBriefByCampaignId: input.creativeBriefByCampaignId,
    })
  ) {
    return null;
  }
  return LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE;
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
      return "Marketing Peer could not prepare the LinkedIn post. Please try again.";
    case "ValidationFailure":
      return "The generated LinkedIn post needs another attempt.";
    case "ContextUnavailable":
      return result.message.includes("Campaign strategy and creative direction")
        ? LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE
        : "More campaign information is required.";
    case "PersistenceFailure":
      return "LinkedIn post could not be saved safely.";
    case "PromptBuildFailure":
      return "Marketing Peer could not prepare the LinkedIn post. Please try again.";
    case "FeatureDisabled":
      return "Campaign workspace is not available.";
    case "WorkspaceUnavailable":
      return "Workspace is unavailable. Refresh and try again.";
    case "ExecutionInProgress":
      return "Marketing Peer is already working on a task.";
    default:
      return "Marketing Peer could not prepare the LinkedIn post. Please try again.";
  }
}

export type LinkedInPostWorkUnitActionViewModel = {
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
  previewPost: MarketingLinkedInPost | null;
};

export function buildLinkedInPostWorkUnitActionViewModel(input: {
  campaignsEnabled: boolean;
  projectId: string;
  workUnit: WorkUnit;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  executingWorkUnitId?: string | null;
  localPending?: boolean;
}): LinkedInPostWorkUnitActionViewModel | null {
  if (!input.campaignsEnabled) {
    return null;
  }

  const unit = input.workUnit;
  if (!unit || unit.cancelled || unit.projectId !== input.projectId) {
    return null;
  }
  if (isGenericChannelPlaceholderWorkUnit(unit)) {
    return null;
  }

  const reviewReady = isLinkedInPostWorkUnitReviewReady(unit);
  const blockedReason = presentLinkedInPostBlockedReason({
    projectId: input.projectId,
    workUnits: input.workUnits,
    strategy: input.strategy,
    creativeBriefByCampaignId: input.creativeBriefByCampaignId,
  });
  const isExecuting =
    Boolean(input.localPending) ||
    (input.executingWorkUnitId != null && input.executingWorkUnitId === unit.id);

  const statusLabel = WORK_LIFECYCLE_LABELS[unit.status as WorkLifecycleStage] ?? unit.status;
  const previewPost = input.linkedinPostByWorkUnitId?.[unit.id] ?? null;

  return {
    show: true,
    workUnitId: unit.id,
    workItemTitle: unit.title,
    statusLabel,
    showPrimaryAction: !reviewReady && !blockedReason,
    primaryLabel: isExecuting
      ? "Marketing Peer is writing your LinkedIn post..."
      : "Let Marketing Peer prepare LinkedIn post",
    primaryDisabled: isExecuting || reviewReady || Boolean(blockedReason),
    blockedReason,
    completionLabel: reviewReady ? "LinkedIn post ready for review" : null,
    isExecuting,
    previewPost: reviewReady ? previewPost : null,
  };
}
