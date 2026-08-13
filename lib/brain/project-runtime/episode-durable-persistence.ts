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
import { buildEpisodeVersionState } from "./episode-version-state";

export function cacheEpisode(
  episode: ProjectEpisodeRecord,
  source: "cache_write" = "cache_write"
): ProjectEpisodeRecord {
  getDefaultProjectEpisodeRepository().save(episode);
  const state = buildEpisodeVersionState(episode, { step: source, source });
  emitPersistenceDiagnostic({
    event: "episode_version_cache_write",
    organizationId: state.organizationId,
    projectId: state.projectId,
    episodeId: state.episodeId,
    durableVersion: state.durableVersion,
    step: state.step,
    source: state.source,
  });
  return episode;
}

export async function commitEpisodeCritical(
  episode: ProjectEpisodeRecord,
  durable: DurablePersistencePort,
  options?: { syncBrainDocs?: boolean }
): Promise<ProjectEpisodeRecord> {
  const enteredMs = Date.now();
  const syncBrainDocs = options?.syncBrainDocs !== false;
  const expectedVersion = episode.durableVersion ?? 0;

  emitPersistenceDiagnostic({
    event: "episode_commit_critical_entered",
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    episodeId: episode.snapshot.episodeId,
    expectedVersion,
    syncBrainDocs,
  });

  const beforeCommit = buildEpisodeVersionState(episode, {
    step: "commit_before_persist",
    source: "commit_before_persist",
    expectedVersion,
  });
  emitPersistenceDiagnostic({
    event: "episode_version_state_before_commit",
    organizationId: beforeCommit.organizationId,
    projectId: beforeCommit.projectId,
    episodeId: beforeCommit.episodeId,
    durableVersion: beforeCommit.durableVersion,
    expectedVersion: beforeCommit.expectedVersion,
    step: beforeCommit.step,
    source: beforeCommit.source,
  });

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
      expectedVersion,
      operation: "persistEpisodeCritical",
    });

    try {
      await durable.persistEpisodeCritical(episode, expectedVersion);
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
        expectedVersion,
        operation: "persistEpisodeCritical",
        errorName: safe.errorName,
        errorCode: safe.errorCode,
        reason: safe.reason,
        durationMs: Date.now() - persistStartedMs,
      });
      throw error;
    }

    const afterCommit = buildEpisodeVersionState(episode, {
      step: "commit_after_persist",
      source: "commit_after_persist",
      expectedVersion,
      newVersion: episode.durableVersion,
    });
    emitPersistenceDiagnostic({
      event: "episode_version_state_after_commit",
      organizationId: afterCommit.organizationId,
      projectId: afterCommit.projectId,
      episodeId: afterCommit.episodeId,
      durableVersion: afterCommit.durableVersion,
      expectedVersion: afterCommit.expectedVersion,
      newVersion: afterCommit.newVersion,
      step: afterCommit.step,
      source: afterCommit.source,
    });

    cacheEpisode(episode);

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
  await durable.persistApprovalCritical(record);
  return commitEpisodeCritical(episode, durable);
}

export async function appendEventDurable(
  event: ProjectRuntimeEvent,
  durable: DurablePersistencePort
): Promise<void> {
  getDefaultProjectEpisodeRepository().appendEvent(event.projectId, event);
  await durable.appendEventTelemetry(event);
}
