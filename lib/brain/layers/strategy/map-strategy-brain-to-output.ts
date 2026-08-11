/**
 * Strategy Brain — map graph to structured output.
 */

import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { StrategyBrainGraph } from "./brain-types";
import { STRATEGY_BRAIN_VERSION } from "./brain-types";

export function mapStrategyBrainToStructuredOutput(
  graph: StrategyBrainGraph,
  generatedAt?: string
): BrainStructuredOutput {
  const at = generatedAt ?? graph.updatedAt;

  const findings = graph.strategicProblems.map((p) => ({
    id: p.id,
    label: p.title,
    value: p.description,
    confidence: p.confidence,
    provenance: p.evidenceIds.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      capturedAt: at,
    })),
  }));

  const decisions = graph.strategicDecisions.map((d) => ({
    id: d.id,
    label: d.title,
    rationale: d.reason,
    confidence: d.confidence,
    provenance: d.supportingEvidence.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      capturedAt: at,
    })),
  }));

  const recommendations = graph.opportunitySelections
    .filter((o) => o.status === "selected")
    .map((o) => ({
      id: o.opportunityId,
      label: o.title,
      priority: o.resourceRequirement,
      provenance: [{ kind: "capability_output" as const, refId: o.opportunityId, capturedAt: at }],
    }));

  const warnings = graph.escalations.map((e, i) => ({
    id: `warn-strat-${i}`,
    code: e.kind,
    message: e.reason,
    provenance: [{ kind: "capability_output" as const, refId: e.id, capturedAt: at }],
  }));

  const actionProposals = graph.approval.requiresApproval
    ? [
        {
          id: "action-strategy-approval",
          actionType: "strategy_review",
          label: graph.approval.approvalReason ?? "Strategy review required",
          requiresApproval: true,
          provenance: graph.approval.decisionIds.map((refId) => ({
            kind: "capability_output" as const,
            refId,
            capturedAt: at,
          })),
        },
      ]
    : [];

  return {
    capabilityId: "strategy",
    capabilityVersion: STRATEGY_BRAIN_VERSION,
    findings,
    decisions,
    strategyBrainGraph: graph,
    recommendations,
    actionProposals,
    executionResults: [],
    warnings,
    errors: [],
    generatedAt: at,
  };
}

export { mapStrategyBrainToStructuredOutput as mapStrategyBrainToOutput };
