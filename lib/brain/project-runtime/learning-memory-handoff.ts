/**
 * Learning → Memory handoff — MemoryWriteProposal[] consumed by Memory Brain only.
 */

import type { LearningBrainGraph } from "../layers/learning/brain-types";
import type { MemoryWriteProposal } from "../layers/learning/brain-types";

export function proposalsFromLearningGraph(graph: LearningBrainGraph | null): MemoryWriteProposal[] {
  if (!graph) return [];
  return [...graph.memoryWriteProposals];
}

export function learningProposalIds(graph: LearningBrainGraph | null): string[] {
  return proposalsFromLearningGraph(graph).map((p) => p.id);
}

/** Ensures Learning never writes Memory directly — proposals only. */
export function assertLearningMemoryBoundary(input: {
  learningProposals: readonly MemoryWriteProposal[];
  memoryStoreCalled: boolean;
}): void {
  if (input.memoryStoreCalled) {
    throw new Error("Learning must not write Memory directly");
  }
  if (input.learningProposals.length === 0) return;
}
