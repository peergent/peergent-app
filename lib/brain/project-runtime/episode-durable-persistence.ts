/**
 * Critical episode persistence — L1 cache + awaited durable writes.
 */

import type { DurablePersistencePort } from "../persistence/layer/durable-persistence-port";
import {
  emitPersistenceDiagnostic,
  safePersistenceError,
} from "../persistence/layer/persistence-diagnostics";
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
  const enteredMs = Date.now();
  const syncBrainDocs = options?.syncBrainDocs !== false;

  emitPersistenceDiagnostic({
    event: "episode_commit_critical_entered",
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    episodeId: episode.snapshot.episodeId,
    expectedVersion: episode.durableVersion ?? 0,
    syncBrainDocs,
  });

  cacheEpisode(episode);

  try {
    if (syncBrainDocs) {
      const syncStartedMs = Date.now();
      emitPersistenceDiagnostic({
        event: "episode_commit_sync_brain_docs_started",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        episodeId: episode.snapshot.episodeId,
        operation: "syncBrainDocumentsFromCache",
      });
      try {
        await durable.syncBrainDocumentsFromCache({
          organizationId: episode.snapshot.organizationId,
          projectId: episode.snapshot.projectId,
        });
        emitPersistenceDiagnostic({
          event: "episode_commit_sync_brain_docs_completed",
          organizationId: episode.snapshot.organizationId,
          projectId: episode.snapshot.projectId,
          episodeId: episode.snapshot.episodeId,
          durationMs: Date.now() - syncStartedMs,
        });
      } catch (error) {
        const safe = safePersistenceError(error);
        emitPersistenceDiagnostic({
          event: "episode_commit_sync_brain_docs_failed",
          organizationId: episode.snapshot.organizationId,
          projectId: episode.snapshot.projectId,
          episodeId: episode.snapshot.episodeId,
          operation: "syncBrainDocumentsFromCache",
          errorName: safe.errorName,
          errorCode: safe.errorCode,
          reason: safe.reason,
          durationMs: Date.now() - syncStartedMs,
        });
        throw error;
      }
    }

    const persistStartedMs = Date.now();
    emitPersistenceDiagnostic({
      event: "episode_commit_persist_started",
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      episodeId: episode.snapshot.episodeId,
      expectedVersion: episode.durableVersion ?? 0,
      operation: "persistEpisodeCritical",
    });

    try {
      await durable.persistEpisodeCritical(episode, episode.durableVersion ?? 0);
      emitPersistenceDiagnostic({
        event: "episode_commit_persist_completed",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        episodeId: episode.snapshot.episodeId,
        newVersion: episode.durableVersion,
        durationMs: Date.now() - persistStartedMs,
      });
    } catch (error) {
      const safe = safePersistenceError(error);
      emitPersistenceDiagnostic({
        event: "episode_commit_persist_failed",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        episodeId: episode.snapshot.episodeId,
        expectedVersion: episode.durableVersion ?? 0,
        operation: "persistEpisodeCritical",
        errorName: safe.errorName,
        errorCode: safe.errorCode,
        reason: safe.reason,
        durationMs: Date.now() - persistStartedMs,
      });
      throw error;
    }

    emitPersistenceDiagnostic({
      event: "episode_commit_critical_completed",
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      episodeId: episode.snapshot.episodeId,
      newVersion: episode.durableVersion,
      durationMs: Date.now() - enteredMs,
    });

    return episode;
  } catch (error) {
    const safe = safePersistenceError(error);
    emitPersistenceDiagnostic({
      event: "episode_commit_critical_failed",
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      episodeId: episode.snapshot.episodeId,
      errorName: safe.errorName,
      errorCode: safe.errorCode,
      reason: safe.reason,
      durationMs: Date.now() - enteredMs,
    });
    throw error;
  }
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
