/**
 * Learning Brain — map graph to structured output.
 */

import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { LearningBrainGraph } from "./brain-types";
import { LEARNING_BRAIN_VERSION } from "./brain-types";

export function mapLearningBrainToStructuredOutput(
  graph: LearningBrainGraph,
  generatedAt?: string
): BrainStructuredOutput {
  const at = generatedAt ?? graph.updatedAt;

  const findings = graph.insights.map((i) => ({
    id: i.id,
    label: i.observation,
    value: i.interpretation,
    confidence: i.confidence,
    provenance: i.evidenceRefs.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      capturedAt: at,
    })),
  }));

  const recommendations = graph.recommendations.map((r) => ({
    id: r.id,
    label: r.title,
    priority: r.confidence,
    provenance: r.evidence.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      capturedAt: at,
    })),
  }));

  const actionProposals = graph.memoryWriteProposals.map((p) => ({
    id: p.id,
    actionType: "memory_write_proposal",
    label: p.title,
    requiresApproval: true,
    provenance: p.evidenceRefs.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      capturedAt: at,
    })),
  }));

  const warnings = graph.unknowns.filter((u) => u.blockingForLearning).map((u, i) => ({
    id: `warn-learn-${i}`,
    code: u.id,
    message: u.question,
    provenance: [{ kind: "capability_output" as const, refId: u.id, capturedAt: at }],
  }));

  return {
    capabilityId: "learning",
    capabilityVersion: LEARNING_BRAIN_VERSION,
    findings,
    decisions: [],
    learningBrainGraph: graph,
    recommendations,
    actionProposals,
    executionResults: [],
    warnings,
    errors: [],
    generatedAt: at,
  };
}

export { mapLearningBrainToStructuredOutput as mapLearningBrainToOutput };
