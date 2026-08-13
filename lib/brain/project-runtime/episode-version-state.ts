/**
 * Episode durableVersion lifecycle helpers — version column is authoritative.
 */

import type { ProjectEpisodeRecord } from "./types";

/** Strip in-memory durableVersion before persisting episode JSON (column owns version). */
export function episodePayloadForPersistence(episode: ProjectEpisodeRecord): ProjectEpisodeRecord {
  const { durableVersion: _durableVersion, ...payload } = episode;
  return payload;
}

export type EpisodeVersionStateSource =
  | "commit_before_persist"
  | "commit_after_persist"
  | "cache_write"
  | "conflict_reload";

export type EpisodeVersionState = {
  organizationId: string;
  projectId: string;
  episodeId: string;
  durableVersion?: number;
  expectedVersion?: number;
  newVersion?: number;
  step: EpisodeVersionStateSource;
  source: EpisodeVersionStateSource;
};

export function buildEpisodeVersionState(
  episode: ProjectEpisodeRecord,
  input: {
    step: EpisodeVersionStateSource;
    source: EpisodeVersionStateSource;
    expectedVersion?: number;
    newVersion?: number;
  }
): EpisodeVersionState {
  return {
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    episodeId: episode.snapshot.episodeId,
    durableVersion: episode.durableVersion,
    expectedVersion: input.expectedVersion,
    newVersion: input.newVersion,
    step: input.step,
    source: input.source,
  };
}
