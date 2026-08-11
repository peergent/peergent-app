/**
 * Reasoning Brain — explicit assumption tracking.
 */

import type { CompanyGraph } from "../company/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainAssumption } from "./brain-types";

let assumptionCounter = 0;

export function resetReasoningAssumptionCounter(): void {
  assumptionCounter = 0;
}

export function buildReasoningAssumptions(input: {
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  createdAt: string;
}): ReasoningBrainAssumption[] {
  const assumptions: ReasoningBrainAssumption[] = [];

  const lowConfidenceFacts = input.companyGraph.facts.filter((f) => f.confidence === "low");
  for (const fact of lowConfidenceFacts.slice(0, 5)) {
    assumptionCounter += 1;
    assumptions.push({
      id: `asm-${assumptionCounter}`,
      statement: fact.value,
      confidence: "low",
      whyAssumed: `Company fact "${fact.title}" has low confidence and is treated as assumption.`,
      requiredEvidence: [`company:${fact.id}`],
      validationNeeded: true,
      relatedEvidence: [fact.id],
      createdAt: input.createdAt,
    });
  }

  const hypotheses = input.researchGraph.findings.filter((f) => f.findingType === "hypothesis");
  for (const finding of hypotheses.slice(0, 5)) {
    assumptionCounter += 1;
    assumptions.push({
      id: `asm-${assumptionCounter}`,
      statement: finding.summary,
      confidence: "low",
      whyAssumed: "Research flagged this as hypothesis — not verified fact.",
      requiredEvidence: finding.evidenceIds,
      validationNeeded: true,
      relatedEvidence: finding.evidenceIds,
      createdAt: input.createdAt,
    });
  }

  for (const unknown of input.researchGraph.unresolvedQuestions.slice(0, 3)) {
    assumptionCounter += 1;
    assumptions.push({
      id: `asm-${assumptionCounter}`,
      statement: `Assuming current understanding holds until: ${unknown.question}`,
      confidence: "low",
      whyAssumed: "Unresolved research question — proceeding with partial information.",
      requiredEvidence: [],
      validationNeeded: true,
      relatedEvidence: [],
      createdAt: input.createdAt,
    });
  }

  return assumptions;
}
