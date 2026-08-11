import type { LearningConfidence } from "./brain-types";

const ORDER: LearningConfidence[] = ["low", "medium", "high"];

export function minLearningConfidence(...values: LearningConfidence[]): LearningConfidence {
  if (values.length === 0) return "low";
  return values.reduce((min, v) => (ORDER.indexOf(v) < ORDER.indexOf(min) ? v : min));
}

export function learningConfidenceFromInput(input: {
  dataQuality: "poor" | "fair" | "good" | "excellent";
  observationCount: number;
  campaignCount: number;
  attributionConfidence: LearningConfidence;
  hasContradictions: boolean;
  experimentValid: boolean;
}): LearningConfidence {
  if (input.dataQuality === "poor" || input.observationCount === 0) return "low";
  let base: LearningConfidence = input.dataQuality === "excellent" ? "medium" : "low";
  if (input.observationCount >= 5 && input.campaignCount >= 2) base = "medium";
  if (input.experimentValid && input.observationCount >= 10) base = "high";
  base = minLearningConfidence(base, input.attributionConfidence);
  if (input.hasContradictions && base === "high") base = "medium";
  return base;
}

export function capCausalityConfidence(
  causality: import("./brain-types").CausalityStrength,
  confidence: LearningConfidence
): LearningConfidence {
  if (causality === "none" || causality === "correlation") return minLearningConfidence(confidence, "medium");
  if (causality === "suggestive") return minLearningConfidence(confidence, "medium");
  return confidence;
}
