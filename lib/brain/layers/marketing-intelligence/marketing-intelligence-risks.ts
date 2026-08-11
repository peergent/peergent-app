/**
 * Marketing Intelligence — risk signals.
 */

import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { MarketingEvidenceRef, MarketingRisk } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

let riskCounter = 0;

export function resetMarketingRiskCounter(): void {
  riskCounter = 0;
}

export function buildMarketingRisks(input: {
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
  knownConstraints?: readonly string[];
}): MarketingRisk[] {
  const risks: MarketingRisk[] = [];

  for (const researchRisk of input.researchGraph.risks) {
    riskCounter += 1;
    risks.push({
      id: `mi-risk-${riskCounter}`,
      description: researchRisk.description,
      category: researchRisk.domain,
      likelihood: researchRisk.confidence === "high" ? "high" : "medium",
      severity: "medium",
      marketingImpact: researchRisk.description,
      businessImpact: "May affect marketing effectiveness.",
      affectedChannels: [],
      affectedAudience: [],
      confidence: enforceMarketingConfidenceCeiling(researchRisk.confidence, researchRisk.evidenceIds.length),
      evidenceIds: researchRisk.evidenceIds,
      mitigationConsideration: "Validate before strategic commitment.",
    });
  }

  for (const contradiction of input.reasoningGraph.contradictions) {
    riskCounter += 1;
    risks.push({
      id: `mi-risk-${riskCounter}`,
      description: contradiction.interpretation,
      category: "contradiction",
      likelihood: "high",
      severity: "high",
      marketingImpact: "Messaging or channel assumptions may be misaligned.",
      businessImpact: contradiction.companyClaim,
      affectedChannels: [],
      affectedAudience: [],
      confidence: contradiction.confidence,
      evidenceIds: contradiction.evidenceIds,
      mitigationConsideration: "Resolve company vs market conflict before scaling spend.",
    });
  }

  for (const constraint of input.knownConstraints ?? []) {
    riskCounter += 1;
    risks.push({
      id: `mi-risk-${riskCounter}`,
      description: constraint,
      category: "constraint",
      likelihood: "medium",
      severity: "medium",
      marketingImpact: "Constrains marketing options.",
      businessImpact: constraint,
      affectedChannels: [],
      affectedAudience: [],
      confidence: "medium",
      evidenceIds: [],
      mitigationConsideration: "Account for constraint in Strategy Brain planning.",
    });
  }

  return risks;
}
