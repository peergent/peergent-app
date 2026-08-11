/**
 * Reasoning Brain — opportunity interpretation (no strategy actions).
 */

import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainOpportunity } from "./brain-types";
import { enforceReasoningConfidenceCeiling } from "./reasoning-confidence";
import { prioritizeOpportunity } from "./reasoning-prioritization";

let opportunityCounter = 0;

export function resetReasoningOpportunityCounter(): void {
  opportunityCounter = 0;
}

export function buildReasoningOpportunities(input: {
  researchGraph: ResearchBrainGraph;
  createdAt: string;
}): ReasoningBrainOpportunity[] {
  const opportunities: ReasoningBrainOpportunity[] = [];

  for (const researchOpp of input.researchGraph.opportunities) {
    opportunityCounter += 1;
    const confidence = enforceReasoningConfidenceCeiling(
      researchOpp.confidence,
      researchOpp.evidenceIds.length
    );
    opportunities.push({
      id: `opp-${opportunityCounter}`,
      description: researchOpp.description,
      reason: researchOpp.title,
      expectedImpact: "Potential market or positioning advantage if validated.",
      confidence,
      requiredEffort: confidence === "high" ? "medium" : "high",
      supportingEvidence: researchOpp.evidenceIds,
      priority: prioritizeOpportunity(confidence),
      createdAt: input.createdAt,
    });
  }

  for (const finding of input.researchGraph.findings.filter(
    (f) => f.findingType === "opportunity" || f.findingType === "gap"
  )) {
    opportunityCounter += 1;
    const confidence = enforceReasoningConfidenceCeiling(
      finding.confidence,
      finding.evidenceIds.length
    );
    opportunities.push({
      id: `opp-${opportunityCounter}`,
      description: finding.summary,
      reason: finding.title,
      expectedImpact: "Gap or opportunity signal from external research.",
      confidence,
      requiredEffort: "medium",
      supportingEvidence: finding.evidenceIds,
      priority: prioritizeOpportunity(confidence),
      createdAt: input.createdAt,
    });
  }

  return opportunities;
}

/** Guard — no strategy language in opportunities. */
export function containsStrategyLanguage(text: string): boolean {
  return /\b(we should|launch|run ads|start campaign|execute|publish now)\b/i.test(text);
}
