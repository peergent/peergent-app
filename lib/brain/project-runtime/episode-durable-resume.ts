/**
 * Durable episode resume — scope validation and L1 hydration from durable store.
 */

import type { DurablePersistencePort } from "../persistence/layer/durable-persistence-port";
import { PersistenceInfrastructureError } from "../persistence/server/persistence-config";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";
import type { EpisodeRunInput, ProjectEpisodeRecord } from "./types";

export type EpisodeRunScope = Pick<EpisodeRunInput, "organizationId" | "projectId" | "peerId">;

export function assertEpisodeMatchesRunScope(
  episode: ProjectEpisodeRecord,
  scope: EpisodeRunScope
): void {
  if (episode.snapshot.organizationId !== scope.organizationId) {
    throw new PersistenceInfrastructureError(
      "Durable episode organization mismatch.",
      "episode_scope_mismatch"
    );
  }
  if (episode.snapshot.projectId !== scope.projectId) {
    throw new PersistenceInfrastructureError(
      "Durable episode project mismatch.",
      "episode_scope_mismatch"
    );
  }
  if (episode.snapshot.peerId !== scope.peerId) {
    throw new PersistenceInfrastructureError(
      "Durable episode peer mismatch.",
      "episode_scope_mismatch"
    );
  }
}

export function hydrateEpisodeToL1(episode: ProjectEpisodeRecord): ProjectEpisodeRecord {
  getDefaultProjectEpisodeRepository().save(episode);
  return episode;
}

export async function loadDurableProjectEpisode(
  durable: DurablePersistencePort,
  scope: Pick<EpisodeRunScope, "organizationId" | "projectId">
): Promise<ProjectEpisodeRecord | null> {
  const episode = await durable.loadProjectEpisode({
    organizationId: scope.organizationId,
    projectId: scope.projectId,
  });
  if (!episode) return null;
  return episode;
}
