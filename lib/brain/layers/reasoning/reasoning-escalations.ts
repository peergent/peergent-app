/**
 * Reasoning Brain — escalations for Strategy Brain and customer input.
 */

import type {
  ReasoningBrainContradiction,
  ReasoningBrainUnknown,
  ReasoningEscalation,
  ReasoningEscalationKind,
} from "./brain-types";

let escalationCounter = 0;

export function resetReasoningEscalationCounter(): void {
  escalationCounter = 0;
}

export function createEscalation(input: {
  kind: ReasoningEscalationKind;
  title: string;
  reason: string;
  relatedContradictionId?: string | null;
  relatedEvidence?: readonly string[];
  priority?: "high" | "medium" | "low";
  requiresCustomerInput?: boolean;
  createdAt: string;
}): ReasoningEscalation {
  escalationCounter += 1;
  return {
    id: `esc-${escalationCounter}`,
    kind: input.kind,
    title: input.title,
    reason: input.reason,
    relatedContradictionId: input.relatedContradictionId ?? null,
    relatedEvidence: input.relatedEvidence ?? [],
    priority: input.priority ?? "medium",
    requiresCustomerInput: input.requiresCustomerInput ?? false,
    createdAt: input.createdAt,
  };
}

export function buildEscalations(input: {
  contradictions: readonly ReasoningBrainContradiction[];
  unknowns: readonly ReasoningBrainUnknown[];
  inconclusiveResearch: boolean;
  brandConflicts: readonly string[];
  createdAt: string;
  existing?: readonly ReasoningEscalation[];
}): ReasoningEscalation[] {
  const escalations: ReasoningEscalation[] = [...(input.existing ?? [])];

  for (const contradiction of input.contradictions) {
    if (contradiction.resolutionStatus === "escalated") continue;
    escalations.push(
      createEscalation({
        kind: "company_research_conflict",
        title: `Conflict: ${contradiction.companyClaim.slice(0, 60)}`,
        reason: contradiction.interpretation,
        relatedContradictionId: contradiction.id,
        relatedEvidence: contradiction.evidenceIds,
        priority: "high",
        requiresCustomerInput: true,
        createdAt: input.createdAt,
      })
    );
  }

  if (input.inconclusiveResearch) {
    escalations.push(
      createEscalation({
        kind: "inconclusive_research",
        title: "Research inconclusive",
        reason: "External research did not reach sufficient confidence for key questions.",
        priority: "medium",
        requiresCustomerInput: false,
        createdAt: input.createdAt,
      })
    );
  }

  for (const unknown of input.unknowns.filter((u) => u.category === "investigation_required")) {
    escalations.push(
      createEscalation({
        kind: "insufficient_evidence",
        title: "Investigation required",
        reason: unknown.description,
        relatedEvidence: unknown.relatedEvidence,
        priority: "medium",
        requiresCustomerInput: false,
        createdAt: input.createdAt,
      })
    );
  }

  for (const conflict of input.brandConflicts) {
    escalations.push(
      createEscalation({
        kind: "brand_conflict",
        title: "Brand alignment conflict",
        reason: conflict,
        priority: "high",
        requiresCustomerInput: true,
        createdAt: input.createdAt,
      })
    );
  }

  return escalations;
}
