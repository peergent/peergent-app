import type { CampaignApprovalRecord } from "../campaign-approval/campaign-approval-types";
import type {
  CampaignContinuationResult,
  CampaignContinuationRunnerDeps,
} from "../campaign-continuation/types";
import { runCampaignContinuation } from "../campaign-continuation/campaign-continuation-runner";
import type { MarketingProject } from "../projects/types";

import { buildCampaignExecutionCorrelation } from "./campaign-execution-correlation";
import {
  appendTimelineEvent,
  createCampaignExecutionTimelineEvent,
  type CampaignExecutionTimelineEvent,
} from "./campaign-execution-timeline";
import {
  acquireContinuationLock,
  cacheContinuationResult,
  getCachedContinuationResult,
} from "./idempotent-continuation";
import { buildCampaignContinuationIdempotencyKey } from "./campaign-run-id";
import {
  attachCampaignPublicationToProject,
  attachCampaignRunToProject,
  inferBrainPipelineStagesComplete,
  markCampaignRunStageComplete,
  persistCampaignRun,
  resolveCampaignRunForProject,
} from "./campaign-run-store";
import type { CampaignRunState } from "./campaign-run-types";
import {
  loadDurableCampaignExecutionState,
  patchDurableCampaignExecutionState,
} from "./durable-campaign-state-store";
import { executeCampaignPublication } from "./publication-executor";
import { initialCampaignPublicationStatus } from "./publication-state-machine";

export type ContinueCampaignWithExecutionDeps = {
  readonly peerId: string;
  readonly organizationId: string;
  readonly getProject: (projectId: string) => MarketingProject | undefined;
  readonly getApproval: (projectId: string) => CampaignApprovalRecord | undefined;
  readonly continuationDeps: CampaignContinuationRunnerDeps;
  readonly updateProject: (project: MarketingProject) => void;
  readonly logTimelineActivity: (event: CampaignExecutionTimelineEvent) => void;
  readonly shouldPublish?: (projectId: string) => boolean;
  readonly publishCampaign?: () => Promise<{ ok: boolean; message?: string; code?: string }>;
};

const STAGE_BY_RUNTIME_KIND: Partial<
  Record<
    import("../campaign-orchestrator/types").MarketingWorkUnit["runtimeKind"],
    import("./campaign-run-types").CampaignExecutionStage
  >
> = {
  campaign_strategy: "strategy",
  creative_direction: "creative",
  linkedin_post: "planning",
  email_campaign: "planning",
};

const STAGE_TIMELINE_KIND = {
  research: "research_complete",
  reasoning: "reasoning_complete",
  marketing_intelligence: "marketing_intelligence_complete",
  strategy: "strategy_complete",
  planning: "planning_complete",
  creative: "creative_complete",
  validation: "validation_complete",
  scheduling: "scheduling_complete",
} as const;

function appendProjectTimeline(
  peerId: string,
  projectId: string,
  event: CampaignExecutionTimelineEvent
): void {
  const durable = loadDurableCampaignExecutionState(peerId);
  const existing = durable.executionTimelineByProjectId[projectId] ?? [];
  patchDurableCampaignExecutionState(peerId, {
    executionTimelineByProjectId: {
      ...durable.executionTimelineByProjectId,
      [projectId]: appendTimelineEvent(existing, event),
    },
  });
}

function recordTimeline(
  deps: ContinueCampaignWithExecutionDeps,
  projectId: string,
  correlation: ReturnType<typeof buildCampaignExecutionCorrelation>,
  kind: CampaignExecutionTimelineEvent["kind"],
  detail?: string
): void {
  const event = createCampaignExecutionTimelineEvent({
    kind,
    correlation,
    detail,
  });
  appendProjectTimeline(deps.peerId, projectId, event);
  deps.logTimelineActivity(event);
}

function markBrainStagesFromProject(
  deps: ContinueCampaignWithExecutionDeps,
  project: MarketingProject,
  run: CampaignRunState,
  correlation: ReturnType<typeof buildCampaignExecutionCorrelation>
): CampaignRunState {
  let current = run;
  for (const stage of inferBrainPipelineStagesComplete({ project })) {
    current = markCampaignRunStageComplete({
      peerId: deps.peerId,
      projectId: project.id,
      run: current,
      stage,
    });
    const timelineKind = STAGE_TIMELINE_KIND[stage as keyof typeof STAGE_TIMELINE_KIND];
    if (timelineKind) {
      recordTimeline(deps, project.id, correlation, timelineKind);
    }
  }
  return current;
}

export async function continueCampaignWithExecution(
  projectId: string,
  deps: ContinueCampaignWithExecutionDeps
): Promise<CampaignContinuationResult> {
  const project = deps.getProject(projectId);
  if (!project) {
    return {
      ok: false,
      projectId,
      completedWorkUnits: [],
      stopReason: "execution_failed",
      stopMessage: "Campaign not found.",
      iterations: 0,
    };
  }

  const approval = deps.getApproval(projectId);
  let run = resolveCampaignRunForProject({
    peerId: deps.peerId,
    organizationId: deps.organizationId,
    project,
    approval,
  });

  const idempotencyKey = buildCampaignContinuationIdempotencyKey({
    peerId: deps.peerId,
    projectId,
    campaignRunId: run.campaignRunId,
    phase: "continuation",
    approvalId: approval?.id,
  });

  const cached = getCachedContinuationResult(deps.peerId, idempotencyKey);
  if (cached) {
    return { ...cached, projectId };
  }

  if (run.status === "completed") {
    return {
      ok: true,
      projectId,
      completedWorkUnits: [],
      stopReason: "no_executable_work_units",
      stopMessage: "Campaign execution already completed.",
      iterations: 0,
    };
  }

  return acquireContinuationLock(idempotencyKey, async () => {
    const cachedAgain = getCachedContinuationResult(deps.peerId, idempotencyKey);
    if (cachedAgain) {
      return { ...cachedAgain, projectId };
    }

    const correlation = buildCampaignExecutionCorrelation({
      projectId,
      organizationId: deps.organizationId,
      campaignRunId: run.campaignRunId,
      approvalId: approval?.id,
    });

    run = persistCampaignRun(deps.peerId, projectId, {
      ...run,
      continuationInFlight: true,
      continuationStartedAt: new Date().toISOString(),
      approvalId: approval?.id ?? run.approvalId,
    });
    deps.updateProject(attachCampaignRunToProject(project, run));

    recordTimeline(deps, projectId, correlation, "campaign_started");

    run = markBrainStagesFromProject(deps, project, run, correlation);

    const continuationResult = await runCampaignContinuation(projectId, deps.continuationDeps);

    for (const completed of continuationResult.completedWorkUnits) {
      run = markCampaignRunStageComplete({
        peerId: deps.peerId,
        projectId,
        run,
        stage:
          STAGE_BY_RUNTIME_KIND[completed.runtimeKind] ??
          ("planning" as const),
      });
      const stage = STAGE_BY_RUNTIME_KIND[completed.runtimeKind] ?? "planning";
      const timelineKind = STAGE_TIMELINE_KIND[stage as keyof typeof STAGE_TIMELINE_KIND];
      if (timelineKind) {
        recordTimeline(deps, projectId, correlation, timelineKind);
      }
    }

    if (!continuationResult.ok) {
      run = persistCampaignRun(deps.peerId, projectId, {
        ...run,
        status: "failed",
        continuationInFlight: false,
        failureCode: continuationResult.stopReason,
        failureMessageSafe: continuationResult.stopMessage,
      });
      deps.updateProject(attachCampaignRunToProject(project, run));
      cacheContinuationResult(deps.peerId, projectId, idempotencyKey, continuationResult);
      return continuationResult;
    }

    if (continuationResult.stopReason === "review_required") {
      run = persistCampaignRun(deps.peerId, projectId, {
        ...run,
        status: "waiting_approval",
        continuationInFlight: false,
        currentStage: "executive_briefing",
      });
      deps.updateProject(attachCampaignRunToProject(project, run));
      cacheContinuationResult(deps.peerId, projectId, idempotencyKey, continuationResult);
      return continuationResult;
    }

    const shouldPublish = deps.shouldPublish?.(projectId) ?? Boolean(approval);
    if (shouldPublish && continuationResult.stopReason === "no_executable_work_units") {
      run = persistCampaignRun(deps.peerId, projectId, {
        ...run,
        status: "publication_pending",
        currentStage: "publication",
      });
      deps.updateProject(attachCampaignRunToProject(project, run));

      const durable = loadDurableCampaignExecutionState(deps.peerId);
      let timeline = durable.executionTimelineByProjectId[projectId] ?? [];

      const pubResult = await executeCampaignPublication({
        peerId: deps.peerId,
        projectId,
        campaignRunId: run.campaignRunId,
        approvalId: approval?.id,
        hasApproval: Boolean(approval),
        publish:
          deps.publishCampaign ??
          (async () => ({ ok: true, message: "Publication simulated." })),
        appendTimeline: (events) => {
          timeline = [...timeline, ...events];
          patchDurableCampaignExecutionState(deps.peerId, {
            executionTimelineByProjectId: {
              ...durable.executionTimelineByProjectId,
              [projectId]: timeline,
            },
          });
          for (const event of events) {
            deps.logTimelineActivity(event);
          }
          return timeline;
        },
      });

      const updatedProject = attachCampaignPublicationToProject(project, pubResult.publication);
      deps.updateProject(updatedProject);

      if (pubResult.ok) {
        recordTimeline(deps, projectId, correlation, "memory_updated");
        run = persistCampaignRun(deps.peerId, projectId, {
          ...run,
          status: "completed",
          currentStage: "completed",
          continuationInFlight: false,
          completedAt: new Date().toISOString(),
        });
        deps.updateProject(attachCampaignRunToProject(updatedProject, run));
        recordTimeline(deps, projectId, correlation, "campaign_completed");

        const finalResult: CampaignContinuationResult = {
          ok: true,
          projectId,
          completedWorkUnits: continuationResult.completedWorkUnits,
          stopReason: "no_executable_work_units",
          stopMessage: pubResult.message,
          iterations: continuationResult.iterations,
        };
        cacheContinuationResult(deps.peerId, projectId, idempotencyKey, finalResult);
        return finalResult;
      }

      run = persistCampaignRun(deps.peerId, projectId, {
        ...run,
        status: "failed",
        continuationInFlight: false,
        failureCode: pubResult.publication.failureCode,
        failureMessageSafe: pubResult.message,
      });
      deps.updateProject(attachCampaignRunToProject(updatedProject, run));

      const failedResult: CampaignContinuationResult = {
        ok: false,
        projectId,
        completedWorkUnits: continuationResult.completedWorkUnits,
        stopReason: "execution_failed",
        stopMessage: pubResult.message,
        iterations: continuationResult.iterations,
      };
      cacheContinuationResult(deps.peerId, projectId, idempotencyKey, failedResult);
      return failedResult;
    }

    run = persistCampaignRun(deps.peerId, projectId, {
      ...run,
      status: "completed",
      continuationInFlight: false,
      currentStage: "completed",
      completedAt: new Date().toISOString(),
    });
    deps.updateProject(attachCampaignRunToProject(project, run));
    recordTimeline(deps, projectId, correlation, "campaign_completed");
    cacheContinuationResult(deps.peerId, projectId, idempotencyKey, continuationResult);
    return continuationResult;
  });
}

export function seedCampaignPublicationState(input: {
  peerId: string;
  projectId: string;
  campaignRunId: string;
  approvalId?: string;
  hasApproval: boolean;
}): void {
  const durable = loadDurableCampaignExecutionState(input.peerId);
  if (durable.campaignPublicationByProjectId[input.projectId]) return;

  patchDurableCampaignExecutionState(input.peerId, {
    campaignPublicationByProjectId: {
      ...durable.campaignPublicationByProjectId,
      [input.projectId]: {
        status: initialCampaignPublicationStatus({ hasApproval: input.hasApproval }),
        campaignRunId: input.campaignRunId,
        approvalId: input.approvalId,
        updatedAt: new Date().toISOString(),
        retryCount: 0,
        idempotencyKey: buildCampaignContinuationIdempotencyKey({
          peerId: input.peerId,
          projectId: input.projectId,
          campaignRunId: input.campaignRunId,
          phase: "publication",
          approvalId: input.approvalId,
        }),
      },
    },
  });
}
