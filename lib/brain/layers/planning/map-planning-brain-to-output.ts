/**
 * Planning Brain — map graph to structured output.
 */

import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { PlanningBrainGraph } from "./brain-types";
import { PLANNING_BRAIN_VERSION } from "./brain-types";

export function mapPlanningBrainToStructuredOutput(
  graph: PlanningBrainGraph,
  generatedAt?: string
): BrainStructuredOutput {
  const at = generatedAt ?? graph.updatedAt;

  const findings = graph.planningObjectives.map((o) => ({
    id: o.id,
    label: o.objective,
    value: o.businessOutcome,
    confidence: o.confidence,
    provenance: [{ kind: "capability_output" as const, refId: o.strategyObjectiveId, capturedAt: at }],
  }));

  const decisions = graph.planningDecisions.map((d) => ({
    id: d.id,
    label: d.decision,
    rationale: d.reason,
    confidence: d.confidence,
    provenance: d.dependencies.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      capturedAt: at,
    })),
  }));

  const recommendations = graph.deliverables.map((d) => ({
    id: d.id,
    label: d.type,
    priority: d.priority,
    provenance: d.strategyRefs.map((refId) => ({
      kind: "capability_output" as const,
      refId,
      capturedAt: at,
    })),
  }));

  const warnings = graph.contextGaps.map((g, i) => ({
    id: `warn-plan-${i}`,
    code: g.id,
    message: g.missingContext,
    provenance: [{ kind: "capability_output" as const, refId: g.id, capturedAt: at }],
  }));

  return {
    capabilityId: "planning",
    capabilityVersion: PLANNING_BRAIN_VERSION,
    findings,
    decisions,
    planningBrainGraph: graph,
    recommendations,
    actionProposals: graph.approvalGates
      .filter((g) => g.blocking)
      .map((g) => ({
        id: g.id,
        actionType: g.kind,
        label: g.reason,
        requiresApproval: true,
        provenance: g.decisionRefs.map((refId) => ({
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

export { mapPlanningBrainToStructuredOutput as mapPlanningBrainToOutput };
