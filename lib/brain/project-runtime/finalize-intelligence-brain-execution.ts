/**
 * PX-63D — await durable intelligence persistence and enforce contract before success.
 */

import type { BrainOutput, BrainResult } from "../project-engine/brain-contract";
import type { ProjectBrainId } from "../project-engine/types";
import { getActiveSupabaseClient } from "../persistence/server/create-server-brain-runtime";
import {
  INTELLIGENCE_PERSISTENCE_BRAIN_IDS,
  IntelligencePersistenceContractError,
  attachIntelligenceGraphToResolvedGraphs,
  type IntelligenceGraphByBrainId,
  type IntelligencePersistenceBrainId,
} from "./intelligence-persistence-contract";
import { persistIntelligenceBrainSnapshotCritical } from "./persist-intelligence-brain-output";
import type { ProjectEpisodeRecord } from "./types";

export function isIntelligencePersistenceBrain(
  brainId: ProjectBrainId
): brainId is IntelligencePersistenceBrainId {
  return (INTELLIGENCE_PERSISTENCE_BRAIN_IDS as readonly string[]).includes(brainId);
}

export async function finalizeIntelligenceBrainExecution(input: {
  brainId: IntelligencePersistenceBrainId;
  episode: ProjectEpisodeRecord;
  result: BrainResult<BrainOutput>;
  startedMs: number;
  graphReused?: boolean;
  graph?: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId];
  outputRef?: string;
}): Promise<BrainResult<BrainOutput>> {
  const terminal =
    input.result.status === "completed" || input.result.status === "waiting_approval";
  if (!terminal) {
    return input.result;
  }

  const outputRef = input.outputRef ?? input.result.output?.outputRef ?? null;
  if (!outputRef?.trim()) {
    return {
      ...input.result,
      status: "failed",
      output: null,
      errorCode: "intelligence_missing_output_ref",
      requiresApproval: false,
      approvalKind: null,
    };
  }

  try {
    const persisted = await persistIntelligenceBrainSnapshotCritical({
      brainId: input.brainId,
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      correlationId: input.episode.correlationId,
      peerId: input.episode.snapshot.peerId,
      supabase: getActiveSupabaseClient(),
      durationMs: input.result.durationMs || Date.now() - input.startedMs,
      graphReused: input.graphReused,
      graph: input.graph,
      outputRef,
    });

    input.episode.resolvedGraphs = attachIntelligenceGraphToResolvedGraphs(
      input.episode.resolvedGraphs ?? {},
      input.brainId,
      persisted.graph
    );

    return input.result;
  } catch (error) {
    if (error instanceof IntelligencePersistenceContractError) {
      return {
        brainId: input.brainId,
        status: "failed",
        output: null,
        events: input.result.events,
        confidence: null,
        durationMs: input.result.durationMs || Date.now() - input.startedMs,
        errorCode: error.code,
        requiresApproval: false,
        approvalKind: null,
      };
    }
    throw error;
  }
}

export async function completeIntelligenceGraphReuse(input: {
  brainId: IntelligencePersistenceBrainId;
  episode: ProjectEpisodeRecord;
  graph: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId];
  outputRef: string;
  startedMs: number;
  capabilityIds: string[];
  confidence?: { value: number; label: "low" | "medium" | "high" };
  requiresApproval?: boolean;
  approvalKind?: BrainResult<BrainOutput>["approvalKind"];
}): Promise<BrainResult<BrainOutput>> {
  const generatedAt =
    "updatedAt" in input.graph && typeof input.graph.updatedAt === "string"
      ? input.graph.updatedAt
      : new Date().toISOString();

  const result: BrainResult<BrainOutput> = {
    brainId: input.brainId,
    status: input.requiresApproval ? "waiting_approval" : "completed",
    output: {
      outputRef: input.outputRef,
      capabilityIds: input.capabilityIds,
      decisionIds: [],
      generatedAt,
    },
    events: [],
    confidence: input.confidence ?? { value: 0.6, label: "medium" },
    durationMs: Date.now() - input.startedMs,
    errorCode: null,
    requiresApproval: input.requiresApproval ?? false,
    approvalKind: input.approvalKind ?? null,
  };

  return finalizeIntelligenceBrainExecution({
    brainId: input.brainId,
    episode: input.episode,
    result,
    startedMs: input.startedMs,
    graphReused: true,
    graph: input.graph,
    outputRef: input.outputRef,
  });
}
