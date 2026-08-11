/**
 * Marketing Intelligence — benchmarks.
 * Never fabricate benchmark numbers.
 */

import type { MemoryGraph } from "../memory/types";
import type { MarketingBenchmark } from "./brain-types";

let benchmarkCounter = 0;

export function resetBenchmarkCounter(): void {
  benchmarkCounter = 0;
}

export function buildBenchmarkContext(input: {
  memoryGraph?: MemoryGraph | null;
  channelData?: readonly string[];
}): MarketingBenchmark[] {
  const benchmarks: MarketingBenchmark[] = [];

  const performanceMemories =
    input.memoryGraph?.memories.filter((m) => m.category === "performance_memory") ?? [];

  for (const memory of performanceMemories.slice(0, 3)) {
    benchmarkCounter += 1;
    benchmarks.push({
      id: `bench-${benchmarkCounter}`,
      metric: memory.title,
      channel: null,
      range: null,
      source: {
        id: `src-${memory.id}`,
        kind: "memory",
        refId: memory.id,
        capturedAt: memory.updatedAt,
      },
      confidence: "medium",
      benchmarkUnavailable: false,
      evidenceIds: [memory.id],
    });
  }

  if (benchmarks.length === 0) {
    benchmarkCounter += 1;
    benchmarks.push({
      id: `bench-${benchmarkCounter}`,
      metric: "industry_ctr",
      channel: null,
      range: null,
      source: null,
      confidence: "unavailable",
      benchmarkUnavailable: true,
      evidenceIds: [],
    });
  }

  return benchmarks;
}
