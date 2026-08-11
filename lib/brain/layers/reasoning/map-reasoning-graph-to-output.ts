/**
 * Reasoning Brain — map graph to BrainStructuredOutput.
 */

import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { ReasoningBrainGraph } from "./brain-types";
import { REASONING_BRAIN_VERSION } from "./brain-types";

export function mapReasoningGraphToStructuredOutput(
  graph: ReasoningBrainGraph,
  generatedAt?: string
): BrainStructuredOutput {
  const at = generatedAt ?? graph.updatedAt;

  const findings = graph.interpretations.map((i) => ({
    id: i.id,
    label: i.title,
    value: i.summary,
    confidence: i.confidence,
    provenance: i.supportedEvidence.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      label: i.title,
      capturedAt: i.createdAt,
    })),
  }));

  const warnings = graph.unknowns.map((u) => ({
    id: u.id,
    code: `reasoning_unknown_${u.category}`,
    message: u.question ? `${u.description} — ${u.question}` : u.description,
    provenance: u.relatedEvidence.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      capturedAt: at,
    })),
  }));

  return {
    capabilityId: "reasoning",
    capabilityVersion: REASONING_BRAIN_VERSION,
    findings,
    decisions: [],
    reasoningBrainGraph: graph,
    recommendations: graph.opportunities.map((o) => ({
      id: o.id,
      label: o.description.slice(0, 80),
      priority: o.priority,
      provenance: o.supportingEvidence.map((refId) => ({
        kind: "capability_output" as const,
        refId,
        capturedAt: at,
      })),
    })),
    actionProposals: graph.escalations.map((e) => ({
      id: e.id,
      actionType: `reasoning_escalation_${e.kind}`,
      label: e.title,
      requiresApproval: e.requiresCustomerInput,
      provenance: e.relatedEvidence.map((refId) => ({
        kind: "capability_output" as const,
        refId,
        capturedAt: at,
      })),
    })),
    executionResults: [],
    warnings,
    errors: [],
    generatedAt: at,
  };
}
