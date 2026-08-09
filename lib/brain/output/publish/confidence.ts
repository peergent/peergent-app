import type { BrainConfidence } from "@/lib/brain/domain/confidence";
import type { DecisionConfidenceLevel } from "@/lib/brain/decision/decision-types";
import type { ConfidenceScore } from "../types";

function normalizeConfidence(confidence: BrainConfidence | DecisionConfidenceLevel): BrainConfidence {
  if (confidence === "very_high") return "high";
  return confidence;
}

export function confidenceFromBrain(
  confidence: BrainConfidence | DecisionConfidenceLevel,
  nl: boolean
): ConfidenceScore {
  const level = normalizeConfidence(confidence);
  const labels: Record<BrainConfidence, { en: string; nl: string; value: number }> = {
    high: { en: "High", nl: "Hoog", value: 0.85 },
    medium: { en: "Medium", nl: "Gemiddeld", value: 0.65 },
    low: { en: "Low", nl: "Laag", value: 0.4 },
  };
  const entry = labels[level] ?? labels.medium;
  return { value: entry.value, label: nl ? entry.nl : entry.en };
}

export function aggregateConfidence(scores: readonly ConfidenceScore[]): ConfidenceScore {
  if (scores.length === 0) return { value: 0.5, label: "Medium" };
  const avg = scores.reduce((sum, s) => sum + s.value, 0) / scores.length;
  if (avg >= 0.75) return { value: avg, label: "High" };
  if (avg >= 0.55) return { value: avg, label: "Medium" };
  return { value: avg, label: "Low" };
}
