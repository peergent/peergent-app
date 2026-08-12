/**
 * Project approval persistence — orchestration pause/resume.
 */

import type { ProjectApprovalRecord, ProjectEpisodeRecord, SubmitApprovalInput } from "./types";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";

export function submitProjectApproval(input: SubmitApprovalInput): ProjectEpisodeRecord {
  const repo = getDefaultProjectEpisodeRepository();
  const episode = repo.get({ organizationId: input.organizationId, projectId: input.projectId });
  if (!episode) {
    throw new Error(`Project episode not found: ${input.projectId}`);
  }

  const record: ProjectApprovalRecord = {
    id: input.approvalId,
    projectId: input.projectId,
    organizationId: input.organizationId,
    checkpointKind: episode.snapshot.approvalCheckpoint?.kind ?? "campaign_approval",
    decision: input.decision,
    actor: input.actor,
    comment: input.comment,
    decidedAt: input.timestamp ?? new Date().toISOString(),
  };

  const approvalGrantedForExecution =
    input.decision === "approved" &&
    (record.checkpointKind === "campaign_approval" || record.checkpointKind === "publication_confirm");

  const updated: ProjectEpisodeRecord = {
    ...episode,
    approvalSatisfied: input.decision === "approved",
    approvalGrantedForExecution: episode.approvalGrantedForExecution || approvalGrantedForExecution,
    artifacts: {
      ...episode.artifacts,
      approvalIds: [...episode.artifacts.approvalIds, record.id],
    },
    updatedAt: new Date().toISOString(),
  };

  repo.saveApproval(record);
  repo.save(updated);
  return updated;
}
