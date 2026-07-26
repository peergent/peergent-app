import type { CampaignExecutionPlanViewModel } from "@/lib/peer-experience/marketing/campaign-planning/campaign-execution-plan-view-model";
import type { CampaignExecutionWorkspaceResult } from "@/lib/peer-experience/marketing/campaign-execution";
import { extractExecutorOperationIdFromRawRequest } from "@/lib/peer-experience/marketing/campaign-execution";
import type { MarketingProjectOrigin } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

export type CampaignStartActionKind =
  | "ready"
  | "already_started"
  | "restricted"
  | "blocked"
  | "unavailable";

export type CampaignStartActionViewModel = {
  readonly showAction: boolean;
  readonly kind: CampaignStartActionKind;
  readonly buttonLabel: string;
  readonly buttonDisabled: boolean;
  readonly helperText: string;
};

export type CampaignStartFeedbackTone = "success" | "info" | "warning" | "error";

export type CampaignStartFeedback = {
  readonly tone: CampaignStartFeedbackTone;
  readonly message: string;
  readonly marksStarted: boolean;
};

export function projectHasCampaignExecutionWork(
  projectId: string,
  workUnits: readonly WorkUnit[]
): boolean {
  return workUnits.some((unit) => {
    if (unit.projectId !== projectId || unit.cancelled) return false;
    return Boolean(extractExecutorOperationIdFromRawRequest(unit.rawRequest));
  });
}

export function buildCampaignStartActionViewModel(input: {
  campaignsEnabled: boolean;
  projectOrigin?: MarketingProjectOrigin;
  projectId: string;
  workUnits: readonly WorkUnit[];
  executionPlan: CampaignExecutionPlanViewModel | null | undefined;
  pending?: boolean;
  sessionStarted?: boolean;
}): CampaignStartActionViewModel {
  const showAction =
    input.campaignsEnabled && input.projectOrigin === "campaign_wizard";

  if (!showAction) {
    return {
      showAction: false,
      kind: "unavailable",
      buttonLabel: "Start campaign",
      buttonDisabled: true,
      helperText: "",
    };
  }

  const alreadyStarted =
    input.sessionStarted ||
    projectHasCampaignExecutionWork(input.projectId, input.workUnits);

  if (input.pending) {
    return {
      showAction: true,
      kind: "ready",
      buttonLabel: "Starting campaign…",
      buttonDisabled: true,
      helperText: "",
    };
  }

  if (alreadyStarted) {
    return {
      showAction: true,
      kind: "already_started",
      buttonLabel: "Campaign started",
      buttonDisabled: true,
      helperText: "Campaign work has already started.",
    };
  }

  const plan = input.executionPlan;
  if (!plan || plan.availability === "unavailable") {
    return {
      showAction: true,
      kind: "unavailable",
      buttonLabel: "Start campaign",
      buttonDisabled: true,
      helperText:
        plan?.unavailableMessage?.trim() ||
        "Campaign planning is not available yet. Complete setup before starting.",
    };
  }

  if (plan.overallStatus === "blocked") {
    const blocker =
      plan.blockers[0]?.trim() ||
      plan.restrictionMessage?.trim() ||
      "Resolve blockers before starting this campaign.";
    return {
      showAction: true,
      kind: "blocked",
      buttonLabel: "Start campaign",
      buttonDisabled: true,
      helperText: blocker,
    };
  }

  if (plan.overallStatus === "draft" || plan.overallStatus === "restricted") {
    const helper =
      plan.restrictionMessage?.trim() ||
      plan.nextPlannedStep?.description?.trim() ||
      plan.missingInformation[0]?.trim() ||
      "Add channels and deliverables before starting campaign work.";
    return {
      showAction: true,
      kind: "restricted",
      buttonLabel: "Start campaign",
      buttonDisabled: true,
      helperText: helper,
    };
  }

  return {
    showAction: true,
    kind: "ready",
    buttonLabel: "Start campaign",
    buttonDisabled: false,
    helperText: "",
  };
}

export function presentCampaignStartFeedback(
  result: CampaignExecutionWorkspaceResult
): CampaignStartFeedback {
  switch (result.status) {
    case "started":
      return {
        tone: "success",
        message: "Campaign work started.",
        marksStarted: true,
      };
    case "already_started":
      return {
        tone: "info",
        message: "Campaign work has already started.",
        marksStarted: true,
      };
    case "partially_started":
      return {
        tone: "warning",
        message:
          "Some campaign work started, but some steps still need your attention.",
        marksStarted: true,
      };
    case "restricted":
      return {
        tone: "warning",
        message:
          result.nextAction?.reason?.trim() ||
          "Campaign work cannot start yet. Review the campaign plan.",
        marksStarted: false,
      };
    case "blocked":
      return {
        tone: "warning",
        message:
          result.nextAction?.reason?.trim() ||
          "Campaign work is blocked until prerequisites are resolved.",
        marksStarted: false,
      };
    case "failed":
    default:
      return {
        tone: "error",
        message: "Campaign could not be started. Try again.",
        marksStarted: false,
      };
  }
}
