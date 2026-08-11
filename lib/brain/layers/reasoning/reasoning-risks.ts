/**
 * Reasoning Brain — risk interpretation.
 */

import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainRisk, ReasoningImportance, ReasoningPriority } from "./brain-types";
import { enforceReasoningConfidenceCeiling } from "./reasoning-confidence";

let riskCounter = 0;

export function resetReasoningRiskCounter(): void {
  riskCounter = 0;
}

function mapSeverity(importance: string): ReasoningImportance {
  if (importance === "critical") return "critical";
  if (importance === "high") return "high";
  if (importance === "medium") return "medium";
  return "low";
}

export function buildReasoningRisks(input: {
  researchGraph: ResearchBrainGraph;
  knownRisks?: readonly string[];
  createdAt: string;
}): ReasoningBrainRisk[] {
  const risks: ReasoningBrainRisk[] = [];

  for (const researchRisk of input.researchGraph.risks) {
    riskCounter += 1;
    risks.push({
      id: `risk-${riskCounter}`,
      description: researchRisk.description,
      likelihood: researchRisk.confidence === "high" ? "high" : "medium",
      severity: mapSeverity("medium"),
      businessImpact: "May affect market positioning or conversion.",
      mitigationSuggestion: "Validate with additional research before strategic commitment.",
      confidence: enforceReasoningConfidenceCeiling(
        researchRisk.confidence,
        researchRisk.evidenceIds.length
      ),
      supportingEvidence: researchRisk.evidenceIds,
      createdAt: input.createdAt,
    });
  }

  for (const finding of input.researchGraph.findings.filter((f) => f.findingType === "risk")) {
    riskCounter += 1;
    risks.push({
      id: `risk-${riskCounter}`,
      description: finding.summary,
      likelihood: "medium" as ReasoningPriority,
      severity: mapSeverity(finding.importance),
      businessImpact: "Identified through research interpretation.",
      mitigationSuggestion: "Monitor and gather confirming evidence.",
      confidence: enforceReasoningConfidenceCeiling(
        finding.confidence,
        finding.evidenceIds.length
      ),
      supportingEvidence: finding.evidenceIds,
      createdAt: input.createdAt,
    });
  }

  for (const known of input.knownRisks ?? []) {
    riskCounter += 1;
    risks.push({
      id: `risk-${riskCounter}`,
      description: known,
      likelihood: "medium",
      severity: "medium",
      businessImpact: "Customer-supplied constraint.",
      mitigationSuggestion: "Account for this risk in downstream strategy.",
      confidence: "medium",
      supportingEvidence: [],
      createdAt: input.createdAt,
    });
  }

  return risks;
}
