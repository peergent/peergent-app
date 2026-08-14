/**
 * Safe episode commit payload metrics — no customer content.
 */

import { toJson } from "@/lib/business-brain/repositories/mappers";
import type { ProjectEpisodeRecord } from "./types";
import { episodePayloadForPersistence } from "./episode-version-state";

export type EpisodeCommitPayloadMetrics = {
  organizationId: string;
  projectId: string;
  episodeId: string;
  expectedVersion: number;
  episodeStatus: string;
  snapshotState: string;
  activeBrain: string | null;
  artifactCount: number;
  resolvedGraphCount: number;
  cachedLearningProposalCount: number;
  payloadBytes: number;
  episodeJsonBytes: number;
  artifactsJsonBytes: number;
  resolvedGraphsJsonBytes: number;
  completedAt: string | null;
  hasLastError: boolean;
};

function jsonByteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(toJson(value)), "utf8");
}

function countResolvedGraphKeys(resolvedGraphs: ProjectEpisodeRecord["resolvedGraphs"]): number {
  if (!resolvedGraphs) return 0;
  return Object.values(resolvedGraphs).filter((value) => {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }).length;
}

function countArtifactRefs(artifacts: ProjectEpisodeRecord["artifacts"]): number {
  let count = 0;
  if (artifacts.companyOutputRef) count += 1;
  if (artifacts.researchOutputRef) count += 1;
  if (artifacts.reasoningOutputRef) count += 1;
  if (artifacts.marketingIntelligenceOutputRef) count += 1;
  if (artifacts.strategyOutputRef) count += 1;
  if (artifacts.planningOutputRef) count += 1;
  if (artifacts.creativeOutputRef) count += 1;
  if (artifacts.validationOutputRef) count += 1;
  if (artifacts.executionOutputRef) count += 1;
  if (artifacts.learningOutputRef) count += 1;
  count += artifacts.memoryOutputRefs.length;
  count += artifacts.performanceObservationIds.length;
  count += artifacts.approvalIds.length;
  count += artifacts.learningProposalIds.length;
  return count;
}

export function computeEpisodeCommitPayloadMetrics(
  episode: ProjectEpisodeRecord,
  expectedVersion: number
): EpisodeCommitPayloadMetrics {
  const episodeJson = episodePayloadForPersistence(episode);
  const artifactsJson = episode.artifacts;
  const resolvedGraphsJson = episode.resolvedGraphs ?? {};
  const learningJson = episode.cachedLearningProposals ?? [];

  const episodeJsonBytes = jsonByteLength(episodeJson);
  const artifactsJsonBytes = jsonByteLength(artifactsJson);
  const resolvedGraphsJsonBytes = jsonByteLength(resolvedGraphsJson);
  const learningJsonBytes = jsonByteLength(learningJson);

  return {
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    episodeId: episode.snapshot.episodeId,
    expectedVersion,
    episodeStatus: episode.episodeStatus,
    snapshotState: episode.snapshot.state,
    activeBrain: episode.snapshot.activeBrain,
    artifactCount: countArtifactRefs(episode.artifacts),
    resolvedGraphCount: countResolvedGraphKeys(episode.resolvedGraphs),
    cachedLearningProposalCount: episode.cachedLearningProposals?.length ?? 0,
    payloadBytes: episodeJsonBytes + artifactsJsonBytes + resolvedGraphsJsonBytes + learningJsonBytes,
    episodeJsonBytes,
    artifactsJsonBytes,
    resolvedGraphsJsonBytes,
    completedAt: episode.completedAt,
    hasLastError: episode.lastError != null,
  };
}
