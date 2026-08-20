import type { ProjectBrainId } from "../project-engine/types";

/**
 * Brains that consume resolved pipeline graphs and must run via Project Brain registry
 * executors — not generic BrainRuntime capability stubs.
 */
export const PIPELINE_GRAPH_BRAIN_IDS: readonly ProjectBrainId[] = [
  "research",
  "reasoning",
  "marketing_intelligence",
  "strategy",
  "planning",
  "creative",
  "validation",
  "execution",
  "memory",
  "learning",
] as const;

export function isPipelineGraphBrain(brainId: ProjectBrainId): boolean {
  return PIPELINE_GRAPH_BRAIN_IDS.includes(brainId);
}
