import type {
  DataQualityAssessment,
  DataQualityLevel,
  LearningConfidence,
  PerformanceObservation,
} from "./brain-types";

export function assessDataQuality(observations: readonly PerformanceObservation[]): DataQualityAssessment {
  if (observations.length === 0) {
    return {
      qualityScore: null,
      qualityLevel: "poor",
      limitations: ["No performance observations provided"],
      usableForLearning: false,
      usableForDurableMemory: false,
    };
  }

  const levels = observations.map((o) => o.dataQuality);
  const poorCount = levels.filter((l) => l === "poor").length;
  const hasSampleSize = observations.some((o) => o.sampleSize != null && o.sampleSize >= 30);
  const hasTracking = observations.every((o) => o.value != null);

  let qualityLevel: DataQualityLevel = "fair";
  if (poorCount === 0 && hasSampleSize && hasTracking) qualityLevel = "good";
  if (poorCount > observations.length / 2) qualityLevel = "poor";

  const limitations: string[] = [];
  if (!hasSampleSize) limitations.push("Insufficient sample size for durable patterns");
  if (poorCount > 0) limitations.push("Some observations have poor data quality");
  if (!hasTracking) limitations.push("Missing metric values in some observations");

  return {
    qualityScore: hasSampleSize ? 0.72 : 0.45,
    qualityLevel,
    limitations,
    usableForLearning: observations.length >= 1 && qualityLevel !== "poor",
    usableForDurableMemory: hasSampleSize && observations.length >= 4 && qualityLevel === "good",
  };
}

export function weakestAttributionConfidence(observations: readonly PerformanceObservation[]): LearningConfidence {
  const confidences = observations.map((o) => o.attributionConfidence);
  if (confidences.includes("low")) return "low";
  if (confidences.includes("medium")) return "medium";
  return observations.length > 0 ? "medium" : "low";
}
