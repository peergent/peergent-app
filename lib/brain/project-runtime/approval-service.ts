/**
 * Project approval persistence — orchestration pause/resume.
 */

import type { ProjectApprovalRecord, ProjectEpisodeRecord, SubmitApprovalInput } from "./types";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";
import { commitApprovalCritical } from "./episode-durable-persistence";
import { getActiveDurablePersistence } from "../persistence/layer/active-durable-persistence";
import type { DurablePersistencePort } from "../persistence/layer/durable-persistence-port";

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

export async function submitProjectApprovalDurable(
  input: SubmitApprovalInput,
  durable?: DurablePersistencePort | null
): Promise<ProjectEpisodeRecord> {
  const updated = submitProjectApproval(input);
  const port = durable ?? getActiveDurablePersistence();
  if (!port) return updated;

  const record: ProjectApprovalRecord = {
    id: input.approvalId,
    projectId: input.projectId,
    organizationId: input.organizationId,
    checkpointKind: updated.snapshot.approvalCheckpoint?.kind ?? "campaign_approval",
    decision: input.decision,
    actor: input.actor,
    comment: input.comment,
    decidedAt: input.timestamp ?? new Date().toISOString(),
  };

  return commitApprovalCritical(record, updated, port);
}
