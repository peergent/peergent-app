/**
 * Performance observation ingestion — deterministic fixture path for Learning Brain.
 */

import type { PerformanceObservation } from "../layers/learning/brain-types";
import type { ProjectEpisodeRecord, StoredPerformanceObservation } from "./types";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";

export type IngestPerformanceObservationsInput = {
  organizationId: string;
  projectId: string;
  campaignId?: string;
  observations: readonly PerformanceObservation[];
};

export function validatePerformanceObservation(obs: PerformanceObservation): string[] {
  const errors: string[] = [];
  if (!obs.id?.trim()) errors.push("missing id");
  if (!obs.metric?.trim()) errors.push("missing metric");
  if (!obs.source?.trim()) errors.push("missing source");
  if (!obs.measurementWindow?.trim()) errors.push("missing measurementWindow");
  if (!obs.dataQuality) errors.push("missing dataQuality");
  if (obs.value === undefined) errors.push("missing value field");
  if (obs.value !== null && typeof obs.value !== "number") errors.push("invalid value");
  return errors;
}

export function ingestPerformanceObservations(input: IngestPerformanceObservationsInput): ProjectEpisodeRecord {
  const repo = getDefaultProjectEpisodeRepository();
  const episode = repo.get({ organizationId: input.organizationId, projectId: input.projectId });
  if (!episode) {
    throw new Error(`Project episode not found: ${input.projectId}`);
  }

  const stored: StoredPerformanceObservation[] = [];
  for (const obs of input.observations) {
    const errors = validatePerformanceObservation(obs);
    if (errors.length > 0) {
      throw new Error(`Invalid performance observation ${obs.id}: ${errors.join(", ")}`);
    }
    stored.push({
      ...obs,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId ?? obs.campaignId ?? input.projectId,
      ingestionId: `ingest-${obs.id}`,
      ingestedAt: new Date().toISOString(),
    });
  }

  repo.saveObservations(input.projectId, stored);

  const updated: ProjectEpisodeRecord = {
    ...episode,
    performanceObservationsAvailable: stored.length > 0,
    artifacts: {
      ...episode.artifacts,
      performanceObservationIds: [
        ...episode.artifacts.performanceObservationIds,
        ...stored.map((s) => s.ingestionId),
      ],
    },
    updatedAt: new Date().toISOString(),
  };
  repo.save(updated);
  return updated;
}

export function getPerformanceObservations(projectId: string): readonly StoredPerformanceObservation[] {
  return getDefaultProjectEpisodeRepository().getObservations(projectId);
}
