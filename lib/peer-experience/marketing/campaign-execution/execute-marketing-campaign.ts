import type { CampaignExecutionPersistencePort } from "./campaign-execution-application-source";
import { applyCampaignExecutionResult } from "./apply-campaign-execution-result";
import type { CampaignExecutionApplicationResult } from "./campaign-execution-application-result";
import {
  collectAppliedCampaignOperationIds,
  createCampaignExecutionWorkspacePersistence,
  type CampaignExecutionWorkspaceStateSnapshot,
} from "./campaign-execution-workspace-persistence";
import {
  campaignExecutionWorkspaceResultFromError,
  type CampaignExecutionWorkspaceResult,
  type CampaignExecutionWorkspaceStatus,
  CampaignExecutionWorkspaceFeatureDisabledError,
} from "./campaign-execution-workspace-result";
import { prepareCampaignExecution } from "./prepare-campaign-execution";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";

export type ExecuteMarketingCampaignArgs = {
  readonly projectId: string;
  readonly domainInput: MarketingPeerDomainInput;
  readonly requestedBy: string;
  readonly executedAt: string;
  readonly campaignWorkspaceEnabled: boolean;
  readonly version?: number;
  readonly idempotencyKey?: string;
  readonly persistence?: CampaignExecutionPersistencePort;
  readonly getWorkspaceSnapshot?: () => CampaignExecutionWorkspaceStateSnapshot;
  readonly commitWorkspaceState?: (next: CampaignExecutionWorkspaceStateSnapshot) => void;
};

function mapApplicationToWorkspaceStatus(
  application: CampaignExecutionApplicationResult,
  planStatus: ReturnType<typeof prepareCampaignExecution>["executionPlan"]["status"],
  executionStatus: ReturnType<typeof prepareCampaignExecution>["executionResult"]["status"]
): CampaignExecutionWorkspaceStatus {
  if (planStatus === "blocked" || executionStatus === "blocked") {
    return "blocked";
  }
  if (planStatus === "draft" || planStatus === "restricted" || executionStatus === "restricted") {
    return "restricted";
  }
  if (application.status === "no_changes") {
    return "already_started";
  }
  if (application.status === "partially_applied") {
    return "partially_started";
  }
  if (application.status === "failed") {
    return "failed";
  }
  if (application.status === "blocked") {
    return "blocked";
  }
  return "started";
}

function nextActionForPlan(
  planStatus: string,
  executionResult: ReturnType<typeof prepareCampaignExecution>["executionResult"]
): CampaignExecutionWorkspaceResult["nextAction"] {
  if (planStatus === "draft") {
    return {
      label: "Complete campaign plan",
      reason: "Add channels, deliverables, and planning inputs before starting execution.",
    };
  }
  if (planStatus === "restricted" || executionResult.status === "restricted") {
    return {
      label: "Resolve execution restrictions",
      reason: "Approvals or policy restrictions block autonomous campaign start.",
    };
  }
  if (executionResult.status === "blocked") {
    return {
      label: "Resolve blockers",
      reason: "Campaign execution is blocked by policy or missing prerequisites.",
    };
  }
  const first = executionResult.nextActions[0];
  if (first) {
    return { label: first.label, reason: first.reason };
  }
  return undefined;
}

function shouldApplyExecution(prepared: ReturnType<typeof prepareCampaignExecution>): boolean {
  const { executionPlan, executionResult } = prepared;
  if (executionPlan.status === "blocked" || executionResult.status === "blocked") {
    return false;
  }
  if (executionPlan.status === "draft" || executionPlan.status === "restricted") {
    return false;
  }
  if (executionResult.status === "restricted") {
    return false;
  }
  return executionResult.status === "executable" || executionResult.status === "no_changes";
}

/**
 * Prepares and optionally applies campaign execution through injected workspace persistence.
 */
export async function executeMarketingCampaign(
  args: ExecuteMarketingCampaignArgs
): Promise<CampaignExecutionWorkspaceResult> {
  const { projectId, domainInput, executedAt } = args;

  if (!args.campaignWorkspaceEnabled) {
    throw new CampaignExecutionWorkspaceFeatureDisabledError();
  }

  let prepared: ReturnType<typeof prepareCampaignExecution>;
  try {
    prepared = prepareCampaignExecution({
      projectId,
      domainInput,
      assembledAt: executedAt,
      requestedBy: args.requestedBy,
      version: args.version,
      idempotencyKey: args.idempotencyKey,
    });
  } catch (error) {
    if (error instanceof CampaignExecutionWorkspaceFeatureDisabledError) {
      throw error;
    }
    return campaignExecutionWorkspaceResultFromError(error, executedAt, projectId);
  }

  const { executionPlan, executionResult, campaignProject } = prepared;

  if (!shouldApplyExecution(prepared)) {
    return {
      status:
        executionPlan.status === "blocked" || executionResult.status === "blocked"
          ? "blocked"
          : "restricted",
      campaignId: campaignProject.id,
      plannerStatus: executionPlan.status,
      executionStatus: executionResult.status,
      createdWorkUnitIds: [],
      updatedWorkUnitIds: [],
      campaignUpdated: false,
      warnings: [...executionResult.warnings],
      nextAction: nextActionForPlan(executionPlan.status, executionResult),
      executedAt,
    };
  }

  if (executionResult.status === "no_changes") {
    return {
      status: "already_started",
      campaignId: campaignProject.id,
      plannerStatus: executionPlan.status,
      executionStatus: executionResult.status,
      createdWorkUnitIds: [],
      updatedWorkUnitIds: [],
      campaignUpdated: false,
      warnings: [...executionResult.warnings],
      executedAt,
    };
  }

  const snapshot = args.getWorkspaceSnapshot?.() ?? {
    projects: domainInput.projects,
    workUnits: domainInput.workUnits,
  };

  const useInMemory = !args.persistence;
  const bundle = useInMemory
    ? createCampaignExecutionWorkspacePersistence(snapshot)
    : null;

  const port = args.persistence ?? bundle!.port;

  const appliedOperationIds = collectAppliedCampaignOperationIds(
    snapshot.workUnits,
    campaignProject.id
  );

  let application: CampaignExecutionApplicationResult;
  try {
    application = await applyCampaignExecutionResult({
      organizationId: prepared.plannerSource.organizationId,
      peerId: prepared.plannerSource.peerId,
      campaignProject,
      workUnits: snapshot.workUnits,
      executionResult,
      appliedAt: executedAt,
      appliedOperationIds,
      persistence: port,
    });
  } catch (error) {
    return campaignExecutionWorkspaceResultFromError(error, executedAt, campaignProject.id);
  }

  if (useInMemory && args.commitWorkspaceState && bundle) {
    args.commitWorkspaceState(bundle.getNextState());
  }

  const workspaceStatus = mapApplicationToWorkspaceStatus(
    application,
    executionPlan.status,
    executionResult.status
  );

  const resolvedStatus: CampaignExecutionWorkspaceStatus =
    workspaceStatus === "started" && application.createdWorkUnitIds.length === 0
      ? "already_started"
      : workspaceStatus;

  return {
    status: resolvedStatus,
    campaignId: campaignProject.id,
    plannerStatus: executionPlan.status,
    executionStatus: executionResult.status,
    createdWorkUnitIds: application.createdWorkUnitIds,
    updatedWorkUnitIds: application.updatedWorkUnitIds,
    campaignUpdated: application.campaignUpdated,
    warnings: [...executionResult.warnings, ...application.warnings],
    nextAction:
      resolvedStatus === "failed" || resolvedStatus === "partially_started"
        ? {
            label: "Review campaign execution",
            reason: "Some campaign work may require manual follow-up.",
          }
        : nextActionForPlan(executionPlan.status, executionResult),
    executedAt,
  };
}
