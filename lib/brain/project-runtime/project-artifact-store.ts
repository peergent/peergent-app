/**
 * Project-scoped artifact reference store — refs only, graphs resolved via repositories.
 */

import type { ProjectBrainArtifacts, ProjectEpisodeRecord } from "./types";
import type { ProjectBrainId } from "../project-engine/types";

export function createEmptyArtifacts(input: {
  organizationId: string;
  projectId: string;
  episodeId: string;
  correlationId: string;
}): ProjectBrainArtifacts {
  return {
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    correlationId: input.correlationId,
    memoryOutputRefs: [],
    performanceObservationIds: [],
    approvalIds: [],
    learningProposalIds: [],
  };
}

export function recordBrainOutputRef(
  artifacts: ProjectBrainArtifacts,
  brainId: ProjectBrainId,
  outputRef: string | null | undefined
): ProjectBrainArtifacts {
  if (!outputRef) return artifacts;
  switch (brainId) {
    case "company":
      return { ...artifacts, companyOutputRef: outputRef };
    case "research":
      return { ...artifacts, researchOutputRef: outputRef };
    case "reasoning":
      return { ...artifacts, reasoningOutputRef: outputRef };
    case "marketing_intelligence":
      return { ...artifacts, marketingIntelligenceOutputRef: outputRef };
    case "strategy":
      return { ...artifacts, strategyOutputRef: outputRef };
    case "planning":
      return { ...artifacts, planningOutputRef: outputRef };
    case "creative":
      return { ...artifacts, creativeOutputRef: outputRef };
    case "validation":
      return { ...artifacts, validationOutputRef: outputRef };
    case "memory":
      return { ...artifacts, memoryOutputRefs: [...artifacts.memoryOutputRefs, outputRef] };
    case "execution":
      return { ...artifacts, executionOutputRef: outputRef };
    case "learning":
      return { ...artifacts, learningOutputRef: outputRef };
    default:
      return artifacts;
  }
}

export function artifactsFromEpisode(episode: ProjectEpisodeRecord): ProjectBrainArtifacts {
  return episode.artifacts;
}

export function brainOutputRefMap(artifacts: ProjectBrainArtifacts): Record<string, string | undefined> {
  return {
    company: artifacts.companyOutputRef,
    research: artifacts.researchOutputRef,
    reasoning: artifacts.reasoningOutputRef,
    marketing_intelligence: artifacts.marketingIntelligenceOutputRef,
    strategy: artifacts.strategyOutputRef,
    planning: artifacts.planningOutputRef,
    creative: artifacts.creativeOutputRef,
    validation: artifacts.validationOutputRef,
    execution: artifacts.executionOutputRef,
    learning: artifacts.learningOutputRef,
    memory: artifacts.memoryOutputRefs.at(-1),
  };
}
