/**
 * Bridge legacy CampaignRunState → ProjectEngineSnapshot.
 * Strangler pattern — existing run store maps into engine without UI changes.
 */

import type { CampaignRunState } from "@/lib/peer-experience/marketing/campaign-execution/campaign-run-types";
import { projectStateFromRunStage } from "./stage-router";
import type { ProjectEngineSnapshot, ProjectLifecycleState } from "./types";
import { createProjectEngineSnapshot } from "./create-snapshot";

export function projectSnapshotFromCampaignRun(run: CampaignRunState): ProjectEngineSnapshot {
  const base = createProjectEngineSnapshot({
    projectId: run.projectId,
    peerId: run.peerId,
    organizationId: run.organizationId,
    episodeId: run.campaignRunId,
  });

  const state: ProjectLifecycleState = projectStateFromRunStage(run.currentStage);

  const waitingReason =
    run.status === "waiting_approval"
      ? ("approval_required" as const)
      : run.status === "failed"
        ? ("retry_backoff" as const)
        : null;

  return {
    ...base,
    state,
    waitingReason,
    startedAt: run.startedAt,
    updatedAt: run.completedAt ?? run.startedAt,
    completedAt: run.status === "completed" ? run.completedAt ?? null : null,
    activeBrain: null,
  };
}

export function isEngineBlocked(snapshot: ProjectEngineSnapshot): boolean {
  return (
    snapshot.waitingReason != null ||
    snapshot.state === "waiting_for_approval" ||
    snapshot.state === "failed"
  );
}
