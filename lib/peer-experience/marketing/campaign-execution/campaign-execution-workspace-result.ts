import type { CampaignExecutionPlanStatus } from "@/lib/campaign/planner/types/campaign-execution-plan";
import type { CampaignExecutionResultStatus } from "@/lib/campaign/executor";

export type CampaignExecutionWorkspaceStatus =
  | "started"
  | "already_started"
  | "restricted"
  | "blocked"
  | "partially_started"
  | "failed";

export type CampaignExecutionWorkspaceNextAction = {
  readonly label: string;
  readonly reason: string;
};

export type CampaignExecutionWorkspaceResult = {
  readonly status: CampaignExecutionWorkspaceStatus;
  readonly campaignId: string;
  readonly plannerStatus: CampaignExecutionPlanStatus;
  readonly executionStatus: CampaignExecutionResultStatus;
  readonly createdWorkUnitIds: readonly string[];
  readonly updatedWorkUnitIds: readonly string[];
  readonly campaignUpdated: boolean;
  readonly warnings: readonly string[];
  readonly nextAction?: CampaignExecutionWorkspaceNextAction;
  readonly executedAt: string;
};

export class CampaignExecutionWorkspaceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CampaignExecutionWorkspaceError";
    this.code = code;
  }
}

export class CampaignExecutionWorkspaceFeatureDisabledError extends CampaignExecutionWorkspaceError {
  constructor() {
    super(
      "CAMPAIGN_EXECUTION_WORKSPACE_FEATURE_DISABLED",
      "Campaign workspace execution is not enabled."
    );
    this.name = "CampaignExecutionWorkspaceFeatureDisabledError";
  }
}

export class CampaignExecutionWorkspaceProjectMissingError extends CampaignExecutionWorkspaceError {
  constructor(projectId: string) {
    super(
      "CAMPAIGN_EXECUTION_WORKSPACE_PROJECT_MISSING",
      `Marketing project "${projectId}" was not found.`
    );
    this.name = "CampaignExecutionWorkspaceProjectMissingError";
  }
}

export class CampaignExecutionWorkspaceNonCampaignProjectError extends CampaignExecutionWorkspaceError {
  constructor(projectId: string) {
    super(
      "CAMPAIGN_EXECUTION_WORKSPACE_NON_CAMPAIGN_PROJECT",
      `Project "${projectId}" is not a campaign-wizard project.`
    );
    this.name = "CampaignExecutionWorkspaceNonCampaignProjectError";
  }
}

export class CampaignExecutionWorkspaceArchivedProjectError extends CampaignExecutionWorkspaceError {
  constructor(projectId: string) {
    super(
      "CAMPAIGN_EXECUTION_WORKSPACE_ARCHIVED_PROJECT",
      `Project "${projectId}" is archived.`
    );
    this.name = "CampaignExecutionWorkspaceArchivedProjectError";
  }
}

export class CampaignExecutionWorkspacePreparationError extends CampaignExecutionWorkspaceError {
  constructor(message: string) {
    super("CAMPAIGN_EXECUTION_WORKSPACE_PREPARATION_FAILED", message);
    this.name = "CampaignExecutionWorkspacePreparationError";
  }
}

export function campaignExecutionWorkspaceResultFromError(
  error: unknown,
  executedAt: string,
  campaignId = ""
): CampaignExecutionWorkspaceResult {
  if (error instanceof CampaignExecutionWorkspaceError) {
    const status: CampaignExecutionWorkspaceStatus =
      error instanceof CampaignExecutionWorkspaceFeatureDisabledError
        ? "restricted"
        : "failed";
    return {
      status,
      campaignId,
      plannerStatus: "draft",
      executionStatus: "restricted",
      createdWorkUnitIds: [],
      updatedWorkUnitIds: [],
      campaignUpdated: false,
      warnings: [],
      nextAction: {
        label: "Campaign execution unavailable",
        reason: error.message,
      },
      executedAt,
    };
  }
  return {
    status: "failed",
    campaignId,
    plannerStatus: "draft",
    executionStatus: "restricted",
    createdWorkUnitIds: [],
    updatedWorkUnitIds: [],
    campaignUpdated: false,
    warnings: [],
    nextAction: {
      label: "Campaign execution failed",
      reason: "Campaign execution could not be completed safely.",
    },
    executedAt,
  };
}

export const CAMPAIGN_EXECUTION_ACTIVITY_TITLE = "Campaign work started.";

export function shouldAppendCampaignExecutionActivity(
  status: CampaignExecutionWorkspaceStatus
): boolean {
  return status === "started" || status === "partially_started";
}

/** Activity feed has no stable idempotency key — callers should skip when status is already_started. */
export const CAMPAIGN_EXECUTION_ACTIVITY_LIMITATION =
  "Activity feed deduplication relies on workspace result status; reruns with already_started do not append activity." as const;
