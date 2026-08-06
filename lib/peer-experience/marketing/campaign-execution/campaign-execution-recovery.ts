import type { MarketingProject } from "../projects/types";

import { continueCampaignWithExecution, type ContinueCampaignWithExecutionDeps } from "./continue-campaign-with-execution";
import { isCampaignRunStale } from "./campaign-run-types";
import { loadDurableCampaignExecutionState } from "./durable-campaign-state-store";
import { executeCampaignPublication } from "./publication-executor";
import type { CampaignExecutionTimelineEvent } from "./campaign-execution-timeline";
import { attachCampaignPublicationToProject, attachCampaignRunToProject } from "./campaign-run-store";

export type RecoverableCampaignExecution = {
  readonly projectId: string;
  readonly campaignRunId: string;
  readonly reason: "interrupted_publication" | "stale_continuation";
};

export function detectRecoverableCampaignExecutions(
  peerId: string,
  projects: readonly MarketingProject[]
): RecoverableCampaignExecution[] {
  const durable = loadDurableCampaignExecutionState(peerId);
  const recoverable: RecoverableCampaignExecution[] = [];

  for (const project of projects) {
    const run =
      project.campaignSetup?.campaignRun ??
      durable.campaignRunByProjectId[project.id];
    const publication =
      project.campaignSetup?.campaignPublication ??
      durable.campaignPublicationByProjectId[project.id];

    if (!run) continue;

    if (
      publication &&
      (publication.status === "publishing" || publication.status === "retrying")
    ) {
      recoverable.push({
        projectId: project.id,
        campaignRunId: run.campaignRunId,
        reason: "interrupted_publication",
      });
      continue;
    }

    if (run.continuationInFlight && isCampaignRunStale(run)) {
      recoverable.push({
        projectId: project.id,
        campaignRunId: run.campaignRunId,
        reason: "stale_continuation",
      });
    }
  }

  return recoverable;
}

export async function recoverCampaignExecutions(input: {
  peerId: string;
  organizationId: string;
  projects: readonly MarketingProject[];
  deps: ContinueCampaignWithExecutionDeps;
  logTimelineActivity: (event: CampaignExecutionTimelineEvent) => void;
}): Promise<void> {
  const recoverable = detectRecoverableCampaignExecutions(input.peerId, input.projects);
  for (const item of recoverable) {
    const project = input.projects.find((p) => p.id === item.projectId);
    if (!project) continue;

    const durable = loadDurableCampaignExecutionState(input.peerId);
    const publication =
      project.campaignSetup?.campaignPublication ??
      durable.campaignPublicationByProjectId[item.projectId];
    const run =
      project.campaignSetup?.campaignRun ??
      durable.campaignRunByProjectId[item.projectId];

    if (!run) continue;

    if (item.reason === "interrupted_publication" && publication) {
      const pubResult = await executeCampaignPublication({
        peerId: input.peerId,
        projectId: item.projectId,
        campaignRunId: item.campaignRunId,
        approvalId: publication.approvalId,
        hasApproval: Boolean(publication.approvalId),
        resumeIfInterrupted: true,
        existingPublication: publication,
        publish:
          input.deps.publishCampaign ??
          (async () => ({ ok: true, message: "Publication recovered." })),
        appendTimeline: (events) => {
          for (const event of events) {
            input.logTimelineActivity(event);
          }
          return events;
        },
      });

      const updated = attachCampaignPublicationToProject(project, pubResult.publication);
      input.deps.updateProject(
        attachCampaignRunToProject(updated, {
          ...run,
          continuationInFlight: false,
          status: pubResult.ok ? "completed" : "failed",
          currentStage: pubResult.ok ? "completed" : "publication",
          completedAt: pubResult.ok ? new Date().toISOString() : run.completedAt,
        })
      );
      continue;
    }

    if (item.reason === "stale_continuation") {
      await continueCampaignWithExecution(item.projectId, input.deps);
    }
  }
}
