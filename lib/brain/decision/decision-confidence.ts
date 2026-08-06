import type { BrainConfidence } from "../domain/confidence";
import type { DecisionConfidenceInput, DecisionConfidenceLevel } from "./decision-types";

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function sectionScore(confidence: BrainConfidence): number {
  switch (confidence) {
    case "high":
      return 0.85;
    case "medium":
      return 0.6;
    default:
      return 0.35;
  }
}

/** Derive customer-facing confidence band from evidence quality signals. */
export function calculateDecisionConfidence(input: DecisionConfidenceInput): {
  level: DecisionConfidenceLevel;
  score: number;
} {
  const researchScore = clamp(input.researchEvidenceCount / 6);
  const reasoningScore = clamp(input.reasoningConfidence);
  const brandScore = input.brandConfirmed ? 0.15 : 0;
  const missingPenalty = clamp(input.missingInformationCount * 0.08, 0, 0.35);
  const contradictionPenalty = clamp(input.contradictionCount * 0.1, 0, 0.25);
  const assumptionPenalty = clamp(input.assumptionCount * 0.04, 0, 0.15);
  const dependencyScore = clamp(input.dependencyQuality) * 0.1;
  const section = sectionScore(input.sectionConfidence);

  const score = clamp(
    section * 0.35 +
      researchScore * 0.2 +
      reasoningScore * 0.25 +
      brandScore +
      dependencyScore -
      missingPenalty -
      contradictionPenalty -
      assumptionPenalty
  );

  let level: DecisionConfidenceLevel;
  if (score >= 0.82) level = "very_high";
  else if (score >= 0.65) level = "high";
  else if (score >= 0.45) level = "medium";
  else level = "low";

  return { level, score };
}

export function decisionConfidenceLabel(level: DecisionConfidenceLevel, nl: boolean): string {
  const labels: Record<DecisionConfidenceLevel, { en: string; nl: string }> = {
    very_high: { en: "Very High", nl: "Zeer hoog" },
    high: { en: "High", nl: "Hoog" },
    medium: { en: "Medium", nl: "Gemiddeld" },
    low: { en: "Low", nl: "Laag" },
  };
  return nl ? labels[level].nl : labels[level].en;
}
