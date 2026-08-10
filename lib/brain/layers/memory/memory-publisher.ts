/**
 * MemoryPublisher — structured memory artifacts for future Brain Output Layer consumption.
 * Never writes UI text.
 */

import type { MemoryGraph, MemorySummary } from "./types";
import { buildMemorySummary } from "./build-memory-graph";

export type MemoryPublishPayload = {
  graph: MemoryGraph;
  summary: MemorySummary;
  storedCount: number;
  mergedCount: number;
  activeMemoryCount: number;
  domainCounts: Readonly<Record<string, number>>;
  evolutionCount: number;
};

export class MemoryPublisher {
  publish(input: { graph: MemoryGraph }): MemoryPublishPayload {
    const graph = input.graph;
    const summary = buildMemorySummary(graph);

    const domainCounts: Record<string, number> = {};
    for (const node of graph.nodes) {
      domainCounts[node.domain] = node.memoryIds.length;
    }

    return {
      graph,
      summary,
      storedCount: summary.storedCount,
      mergedCount: summary.mergedCount,
      activeMemoryCount: summary.totalActiveMemories,
      domainCounts,
      evolutionCount: graph.evolution.length,
    };
  }
}

export function createMemoryPublisher(): MemoryPublisher {
  return new MemoryPublisher();
}

export function publishMemoryOutput(input: { graph: MemoryGraph }): MemoryPublishPayload {
  return createMemoryPublisher().publish(input);
}
