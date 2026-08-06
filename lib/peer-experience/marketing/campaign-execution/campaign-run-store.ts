import type { CampaignApprovalRecord } from "../campaign-approval/campaign-approval-types";
import type { MarketingProject } from "../projects/types";

import {
  buildCampaignContinuationIdempotencyKey,
  createCampaignRunId,
} from "./campaign-run-id";
import type {
  CampaignExecutionStage,
  CampaignPublicationState,
  CampaignRunState,
} from "./campaign-run-types";
import {
  patchDurableCampaignExecutionState,
  loadDurableCampaignExecutionState,
} from "./durable-campaign-state-store";

export function resolveCampaignRunForProject(input: {
  peerId: string;
  organizationId: string;
  project: MarketingProject;
  approval?: CampaignApprovalRecord;
}): CampaignRunState {
  const durable = loadDurableCampaignExecutionState(input.peerId);
  const existing =
    input.project.campaignSetup?.campaignRun ??
    durable.campaignRunByProjectId[input.project.id];

  if (existing) {
    return existing;
  }

  const startedAt = new Date().toISOString();
  const campaignRunId = createCampaignRunId(Date.parse(startedAt));
  const run: CampaignRunState = {
    campaignRunId,
    status: "running",
    currentStage: "pending",
    startedAt,
    idempotencyKey: buildCampaignContinuationIdempotencyKey({
      peerId: input.peerId,
      projectId: input.project.id,
      campaignRunId,
      phase: "continuation",
      approvalId: input.approval?.id,
    }),
    approvalId: input.approval?.id,
    organizationId: input.organizationId,
    peerId: input.peerId,
    projectId: input.project.id,
  };

  persistCampaignRun(input.peerId, input.project.id, run);
  return run;
}

export function persistCampaignRun(
  peerId: string,
  projectId: string,
  run: CampaignRunState
): CampaignRunState {
  const durable = loadDurableCampaignExecutionState(peerId);
  patchDurableCampaignExecutionState(peerId, {
    campaignRunByProjectId: {
      ...durable.campaignRunByProjectId,
      [projectId]: run,
    },
  });
  return run;
}

export function persistCampaignPublication(
  peerId: string,
  projectId: string,
  publication: CampaignPublicationState
): CampaignPublicationState {
  const durable = loadDurableCampaignExecutionState(peerId);
  patchDurableCampaignExecutionState(peerId, {
    campaignPublicationByProjectId: {
      ...durable.campaignPublicationByProjectId,
      [projectId]: publication,
    },
  });
  return publication;
}

export function markCampaignRunStageComplete(input: {
  peerId: string;
  projectId: string;
  run: CampaignRunState;
  stage: CampaignExecutionStage;
  at?: string;
}): CampaignRunState {
  const at = input.at ?? new Date().toISOString();
  const next: CampaignRunState = {
    ...input.run,
    currentStage: input.stage,
    lastStageCompletedAt: {
      ...(input.run.lastStageCompletedAt ?? {}),
      [input.stage]: at,
    },
  };
  return persistCampaignRun(input.peerId, input.projectId, next);
}

export function attachCampaignRunToProject(
  project: MarketingProject,
  run: CampaignRunState
): MarketingProject {
  return {
    ...project,
    campaignSetup: {
      ...(project.campaignSetup ?? {
        description: project.rawRequest,
        primaryGoalId: "custom",
      }),
      campaignRun: run,
    },
  };
}

export function attachCampaignPublicationToProject(
  project: MarketingProject,
  publication: CampaignPublicationState
): MarketingProject {
  return {
    ...project,
    campaignSetup: {
      ...(project.campaignSetup ?? {
        description: project.rawRequest,
        primaryGoalId: "custom",
      }),
      campaignPublication: publication,
    },
  };
}

export function inferBrainPipelineStagesComplete(input: {
  project: MarketingProject;
}): CampaignExecutionStage[] {
  const outputs = input.project.campaignSetup?.campaignBrainOutputs;
  const completed: CampaignExecutionStage[] = [];
  if (outputs?.strategy) {
    completed.push("research", "reasoning", "marketing_intelligence", "strategy");
  }
  if (outputs?.channel_planning) {
    completed.push("planning");
  }
  if (outputs?.creative_generation) {
    completed.push("creative", "validation");
  }
  if (input.project.campaignSetup?.campaignSchedule) {
    completed.push("scheduling");
  }
  return completed;
}
