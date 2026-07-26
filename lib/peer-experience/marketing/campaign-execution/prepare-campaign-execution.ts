import { applyCampaignExecutionPlan } from "@/lib/campaign/executor";
import type { CampaignExecutorSource } from "@/lib/campaign/executor";
import { planCampaignExecution } from "@/lib/campaign/planner/plan-campaign-execution";
import type { CampaignExecutionPlan, CampaignPlannerSource } from "@/lib/campaign/planner/types";
import type { CampaignExecutionResult } from "@/lib/campaign/executor";

import {
  buildCampaignPlannerSourceFromDomainInput,
  type BuildCampaignPlannerSourceFromDomainInputArgs,
} from "../campaign-planning/build-campaign-planner-source-from-domain-input";
import { CampaignPlanningError } from "../campaign-planning/errors";
import { isCampaignWizardProject } from "../projects/campaign-project-detail-mode";
import type { MarketingProject } from "../projects/types";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import {
  CampaignExecutionWorkspaceArchivedProjectError,
  CampaignExecutionWorkspaceNonCampaignProjectError,
  CampaignExecutionWorkspacePreparationError,
  CampaignExecutionWorkspaceProjectMissingError,
} from "./campaign-execution-workspace-result";

export type PrepareCampaignExecutionArgs = {
  readonly projectId: string;
  readonly domainInput: MarketingPeerDomainInput;
  readonly assembledAt: string;
  readonly requestedBy: string;
  readonly version?: number;
  readonly idempotencyKey?: string;
};

export type PreparedCampaignExecution = {
  readonly plannerSource: CampaignPlannerSource;
  readonly executionPlan: CampaignExecutionPlan;
  readonly executorSource: CampaignExecutorSource;
  readonly executionResult: CampaignExecutionResult;
  readonly campaignProject: MarketingProject;
};

function assertCampaignWizardProject(
  domainInput: MarketingPeerDomainInput,
  projectId: string
): MarketingProject {
  const project = domainInput.projects.find((p) => p.id === projectId);
  if (!project) {
    throw new CampaignExecutionWorkspaceProjectMissingError(projectId);
  }
  if (project.archivedAt) {
    throw new CampaignExecutionWorkspaceArchivedProjectError(projectId);
  }
  if (!isCampaignWizardProject(project)) {
    throw new CampaignExecutionWorkspaceNonCampaignProjectError(projectId);
  }
  if (project.peerId !== domainInput.peerId) {
    throw new CampaignExecutionWorkspacePreparationError(
      "Project peer scope does not match workspace peer."
    );
  }
  return project;
}

function defaultExecutionIdempotencyKey(projectId: string, version: number): string {
  return `campaign-exec-${projectId}-v${version}`;
}

/**
 * Pure pipeline: domain input → planner source → plan → executor result (no writes).
 */
export function prepareCampaignExecution(
  args: PrepareCampaignExecutionArgs
): PreparedCampaignExecution {
  const campaignProject = assertCampaignWizardProject(args.domainInput, args.projectId);

  const plannerArgs: BuildCampaignPlannerSourceFromDomainInputArgs = {
    projectId: args.projectId,
    domainInput: args.domainInput,
    assembledAt: args.assembledAt,
    version: args.version,
  };

  let plannerSource: CampaignPlannerSource;
  try {
    plannerSource = buildCampaignPlannerSourceFromDomainInput(plannerArgs);
  } catch (error) {
    if (error instanceof CampaignPlanningError) {
      throw new CampaignExecutionWorkspacePreparationError(error.message);
    }
    throw error;
  }

  const executionPlan = planCampaignExecution(plannerSource);
  const version = args.version ?? executionPlan.version;
  const idempotencyKey =
    args.idempotencyKey ?? defaultExecutionIdempotencyKey(campaignProject.id, version);

  const executorSource: CampaignExecutorSource = {
    organizationId: plannerSource.organizationId,
    peerId: plannerSource.peerId,
    campaignId: executionPlan.campaignId,
    currentCampaignStatus: "planning",
    executionPlan,
    existingWorkUnits: plannerSource.existingWorkUnits,
    responsibilities: plannerSource.responsibilities?.map((r) => ({
      ...r,
      peerId: plannerSource.peerId,
    })),
    requestedBy: args.requestedBy,
    assembledAt: args.assembledAt,
    version,
    idempotencyKey,
  };

  const executionResult = applyCampaignExecutionPlan(executorSource);

  return {
    plannerSource,
    executionPlan,
    executorSource,
    executionResult,
    campaignProject,
  };
}
