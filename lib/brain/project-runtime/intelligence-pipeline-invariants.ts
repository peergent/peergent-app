/**
 * PX-63 — production invariants for intelligence pipeline outputs.
 */

import type { ProjectEpisodeRecord } from "./types";
import { resolveBrainOutputs } from "./brain-output-resolver";
import {
  containsPlaceholderMarketUnderstanding,
  PLACEHOLDER_MARKET_UNDERSTANDING_VALUE,
} from "./intelligence-pipeline-diagnostics";
import { mapReasoningGraphToStructuredOutput } from "../layers/reasoning/map-reasoning-graph-to-output";
import { mapMarketingIntelligenceToStructuredOutput } from "../layers/marketing-intelligence/map-marketing-intelligence-to-output";

export { PLACEHOLDER_MARKET_UNDERSTANDING_VALUE };

export type IntelligencePipelineInvariantViolation = {
  readonly code:
    | "placeholder_reasoning_output"
    | "placeholder_marketing_intelligence_output"
    | "missing_research_graph"
    | "missing_reasoning_graph"
    | "missing_marketing_intelligence_graph";
  readonly message: string;
};

export function detectIntelligencePipelinePlaceholderViolations(
  episode: ProjectEpisodeRecord
): IntelligencePipelineInvariantViolation[] {
  const violations: IntelligencePipelineInvariantViolation[] = [];
  const resolved = resolveBrainOutputs({
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    artifacts: episode.artifacts,
    episodeResolvedGraphs: episode.resolvedGraphs,
  });

  const completed = new Set(episode.snapshot.completedBrains);

  if (completed.has("research") && !resolved.researchBrainGraph) {
    violations.push({
      code: "missing_research_graph",
      message: "Research brain completed without durable ResearchBrainGraph.",
    });
  }

  if (completed.has("reasoning")) {
    if (!resolved.reasoningBrainGraph) {
      violations.push({
        code: "missing_reasoning_graph",
        message: "Reasoning brain completed without durable ReasoningBrainGraph.",
      });
    } else {
      const output = mapReasoningGraphToStructuredOutput(resolved.reasoningBrainGraph);
      if (output.findings.some((f) => containsPlaceholderMarketUnderstanding(f.value))) {
        violations.push({
          code: "placeholder_reasoning_output",
          message: `Reasoning output contains placeholder: ${PLACEHOLDER_MARKET_UNDERSTANDING_VALUE}`,
        });
      }
    }
  }

  if (completed.has("marketing_intelligence")) {
    if (!resolved.marketingIntelligenceBrainGraph) {
      violations.push({
        code: "missing_marketing_intelligence_graph",
        message: "Marketing intelligence brain completed without durable MarketingIntelligenceBrainGraph.",
      });
    } else {
      const output = mapMarketingIntelligenceToStructuredOutput(
        resolved.marketingIntelligenceBrainGraph
      );
      if (output.findings.some((f) => containsPlaceholderMarketUnderstanding(f.value))) {
        violations.push({
          code: "placeholder_marketing_intelligence_output",
          message: `Marketing intelligence output contains placeholder: ${PLACEHOLDER_MARKET_UNDERSTANDING_VALUE}`,
        });
      }
    }
  }

  return violations;
}

export function assertProductionIntelligencePipelineHealthy(episode: ProjectEpisodeRecord): void {
  const violations = detectIntelligencePipelinePlaceholderViolations(episode);
  if (violations.length === 0) return;
  throw new Error(
    `Intelligence pipeline invariant violation(s): ${violations.map((v) => v.message).join("; ")}`
  );
}
