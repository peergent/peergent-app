/**
 * Critical episode persistence — L1 cache + awaited durable writes.
 */

import type { DurablePersistencePort } from "../persistence/layer/durable-persistence-port";
import type { ProjectApprovalRecord, ProjectEpisodeRecord, ProjectRuntimeEvent } from "./types";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";

export function cacheEpisode(episode: ProjectEpisodeRecord): ProjectEpisodeRecord {
  getDefaultProjectEpisodeRepository().save(episode);
  return episode;
}

export async function commitEpisodeCritical(
  episode: ProjectEpisodeRecord,
  durable: DurablePersistencePort,
  options?: { syncBrainDocs?: boolean }
): Promise<ProjectEpisodeRecord> {
  cacheEpisode(episode);
  if (options?.syncBrainDocs !== false) {
    await durable.syncBrainDocumentsFromCache({
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
    });
  }
  await durable.persistEpisodeCritical(episode, episode.durableVersion ?? 0);
  return episode;
}

export async function commitApprovalCritical(
  record: ProjectApprovalRecord,
  episode: ProjectEpisodeRecord,
  durable: DurablePersistencePort
): Promise<ProjectEpisodeRecord> {
  getDefaultProjectEpisodeRepository().saveApproval(record);
  cacheEpisode(episode);
  await durable.persistApprovalCritical(record);
  await durable.persistEpisodeCritical(episode, episode.durableVersion ?? 0);
  return episode;
}

export async function appendEventDurable(
  event: ProjectRuntimeEvent,
  durable: DurablePersistencePort
): Promise<void> {
  getDefaultProjectEpisodeRepository().appendEvent(event.projectId, event);
  await durable.appendEventTelemetry(event);
}
