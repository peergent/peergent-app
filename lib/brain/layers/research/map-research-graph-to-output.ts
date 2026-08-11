/**
 * Research Brain — map graph to BrainStructuredOutput.
 */

import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { ResearchBrainGraph } from "./brain-types";
import { RESEARCH_BRAIN_VERSION } from "./brain-types";

export function mapResearchGraphToStructuredOutput(
  graph: ResearchBrainGraph,
  generatedAt?: string
): BrainStructuredOutput {
  const at = generatedAt ?? graph.updatedAt;

  const findings = graph.findings.map((f) => ({
    id: f.id,
    label: f.title,
    value: f.summary,
    confidence: f.confidence,
    provenance: f.evidenceIds.map((evidenceId) => ({
      kind: "capability_output" as const,
      refId: evidenceId,
      label: f.domain,
      capturedAt: f.createdAt,
    })),
  }));

  const warnings = graph.unresolvedQuestions.map((q) => ({
    id: q.id,
    code: "unresolved_research_question",
    message: `${q.question}: ${q.reason}`,
    provenance: [
      {
        kind: "capability_output" as const,
        refId: graph.plan.id,
        capturedAt: at,
      },
    ],
  }));

  if (graph.budgetState.exhausted) {
    warnings.push({
      id: "warn-budget-exhausted",
      code: "research_budget_exhausted",
      message: `Research stopped: ${graph.budgetState.stopReason ?? "budget_limit"}`,
      provenance: [
        {
          kind: "capability_output" as const,
          refId: graph.plan.id,
          capturedAt: at,
        },
      ],
    });
  }

  return {
    capabilityId: "research",
    capabilityVersion: RESEARCH_BRAIN_VERSION,
    findings,
    decisions: [],
    researchBrainGraph: graph,
    recommendations: graph.opportunities.map((o) => ({
      id: o.id,
      label: o.title,
      priority: o.confidence === "high" ? ("high" as const) : ("medium" as const),
      provenance: o.evidenceIds.map((refId) => ({
        kind: "capability_output" as const,
        refId,
        capturedAt: at,
      })),
    })),
    actionProposals: graph.proposedUpdates.map((p) => ({
      id: p.id,
      actionType: "company_update_proposal",
      label: p.proposedValue,
      requiresApproval: p.requiresCustomerConfirmation,
      provenance: p.evidenceIds.map((refId) => ({
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
