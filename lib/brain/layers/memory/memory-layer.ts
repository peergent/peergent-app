import { buildMemoryGraph } from "./build-memory-graph";
import type { MemoryBrainInput } from "./types";
import type { MemoryRepository } from "./memory-repository";
import { getDefaultMemoryRepository } from "./memory-repository";
import { mapMemoryGraphToBrainOutput } from "./map-memory-graph-to-output";
import { validateMemoryGraph } from "./memory-validator";
import { MEMORY_MODULE_SPECS } from "./modules/specs";
import type { MemoryBrainOutput, MemoryGraph, MemorySnapshot } from "./types";

export type MemoryLayerResult = {
  graph: MemoryGraph;
  validation: ReturnType<typeof validateMemoryGraph>;
  structuredOutput: MemoryBrainOutput["structuredOutput"];
  outputRef: string;
  snapshot: MemorySnapshot;
};

/**
 * Memory Brain Layer — commits organizational knowledge from validated campaign outputs.
 * Does NOT generate content, validate, or optimize.
 */
export class MemoryLayer {
  constructor(private readonly repository: MemoryRepository = getDefaultMemoryRepository()) {}

  listModuleSpecs() {
    return MEMORY_MODULE_SPECS;
  }

  buildGraph(input: MemoryBrainInput): MemoryLayerResult {
    const priorMemories = input.priorMemories ?? this.repository.getOrgMemories(input.organizationId);
    const graph = buildMemoryGraph({ ...input, priorMemories });
    const validation = validateMemoryGraph(graph);
    const structuredOutput = mapMemoryGraphToBrainOutput({
      graph,
      campaignContext: input.campaignContext,
      locale: input.locale,
    });
    const outputRef = `memory:${input.organizationId}:${input.projectId}:${graph.createdAt}`;
    const snapshot: MemorySnapshot = {
      id: `snap-${graph.createdAt}`,
      organizationId: input.organizationId,
      campaignId: input.projectId,
      episodeId: input.episodeId ?? null,
      createdAt: graph.createdAt,
      memoryCount: graph.memories.length,
      graphRef: outputRef,
    };
    return { graph, validation, structuredOutput, outputRef, snapshot };
  }

  produceAndStore(input: MemoryBrainInput): MemoryLayerResult {
    const result = this.buildGraph(input);
    this.repository.store({
      key: {
        organizationId: input.organizationId,
        campaignId: input.projectId,
        episodeId: input.episodeId,
        correlationId: input.correlationId,
      },
      graph: result.graph,
      outputRef: result.outputRef,
      storedAt: new Date().toISOString(),
      snapshot: result.snapshot,
    });
    return result;
  }

  getLatestGraph(input: { organizationId: string; campaignId?: string }): MemoryGraph | null {
    return this.repository.getLatest(input)?.graph ?? null;
  }

  getOrgMemories(organizationId: string) {
    return this.repository.getOrgMemories(organizationId);
  }
}

export function createMemoryLayer(repository?: MemoryRepository): MemoryLayer {
  return new MemoryLayer(repository);
}

export function collectMemoryGraph(input: MemoryBrainInput): MemoryGraph {
  return buildMemoryGraph(input);
}
