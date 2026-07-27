import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import {
  findEmailCampaignWorkUnits,
  isEmailCampaignWorkUnitReviewReady,
  isGenericChannelPlaceholderWorkUnit,
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

export { findEmailCampaignWorkUnits, LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE as EMAIL_DEPENDENCY_BLOCKED_MESSAGE };

export function presentEmailCampaignBlockedReason(input: {
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
      return "Marketing Peer could not prepare the email. Please try again.";
    case "ValidationFailure":
      return "The generated email needs another attempt.";
    case "ContextUnavailable":
      return result.message.includes("Campaign strategy and creative direction")
        ? LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE
        : "More campaign information is required.";
    case "PersistenceFailure":
      return "Email could not be saved safely.";
    case "PromptBuildFailure":
      return "Marketing Peer could not prepare the email. Please try again.";
    case "FeatureDisabled":
      return "Campaign workspace is not available.";
    case "WorkspaceUnavailable":
      return "Workspace is unavailable. Refresh and try again.";
    case "ExecutionInProgress":
      return "Marketing Peer is already working on a task.";
    default:
      return "Marketing Peer could not prepare the email. Please try again.";
  }
}

export type EmailCampaignWorkUnitActionViewModel = {
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
  previewEmail: MarketingEmailCampaign | null;
};

export function buildEmailCampaignWorkUnitActionViewModel(input: {
  campaignsEnabled: boolean;
  projectId: string;
  workUnit: WorkUnit;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
  executingWorkUnitId?: string | null;
  localPending?: boolean;
  manualExecutionDisabled?: boolean;
}): EmailCampaignWorkUnitActionViewModel | null {
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

  const reviewReady = isEmailCampaignWorkUnitReviewReady(unit);
  const blockedReason = presentEmailCampaignBlockedReason({
    projectId: input.projectId,
    workUnits: input.workUnits,
    strategy: input.strategy,
    creativeBriefByCampaignId: input.creativeBriefByCampaignId,
  });
  const isExecuting =
    Boolean(input.localPending) ||
    (input.executingWorkUnitId != null && input.executingWorkUnitId === unit.id);

  const statusLabel = WORK_LIFECYCLE_LABELS[unit.status as WorkLifecycleStage] ?? unit.status;
  const previewEmail = input.emailByWorkUnitId?.[unit.id] ?? null;

  return {
    show: true,
    workUnitId: unit.id,
    workItemTitle: unit.title,
    statusLabel,
    showPrimaryAction: !reviewReady && !blockedReason,
    primaryLabel: isExecuting
      ? "Marketing Peer is writing your email..."
      : "Let Marketing Peer prepare email",
    primaryDisabled:
      isExecuting ||
      reviewReady ||
      Boolean(blockedReason) ||
      Boolean(input.manualExecutionDisabled),
    blockedReason,
    completionLabel: reviewReady ? "Email ready for review" : null,
    isExecuting,
    previewEmail: reviewReady ? previewEmail : null,
  };
}
