import type { LearningAnomaly, LearningConfidence, PerformanceObservation } from "./brain-types";

export function detectAnomalies(observations: readonly PerformanceObservation[]): LearningAnomaly[] {
  const anomalies: LearningAnomaly[] = [];
  let counter = 0;

  for (const obs of observations) {
    if (obs.value == null || obs.baseline == null) continue;
    const ratio = obs.baseline === 0 ? obs.value : obs.value / obs.baseline;
    if (ratio >= 1.5) {
      anomalies.push({
        id: `anom-${++counter}`,
        metric: obs.metric,
        expectedRange: `~${obs.baseline}`,
        observedValue: String(obs.value),
        severity: ratio >= 2 ? "high" : "medium",
        possibleExplanations: [`${obs.metric} significantly above campaign baseline`],
        evidenceIds: [obs.id],
        confidence: obs.sampleSize != null && obs.sampleSize >= 30 ? "medium" : "low",
        requiresMoreData: obs.sampleSize == null || obs.sampleSize < 30,
      });
    }
  }

  const ctr = observations.find((o) => o.metric === "ctr");
  const cvr = observations.find((o) => o.metric === "conversion_rate");
  if (ctr?.value != null && cvr?.value != null && ctr.value > (ctr.baseline ?? 0) * 1.2 && cvr.value < (cvr.baseline ?? Infinity) * 0.8) {
    anomalies.push({
      id: `anom-${++counter}`,
      metric: "ctr_vs_conversion",
      expectedRange: "Aligned CTR and conversion",
      observedValue: `CTR ${ctr.value}, CVR ${cvr.value}`,
      severity: "high",
      possibleExplanations: ["High CTR but low conversion — possible message/audience mismatch"],
      evidenceIds: [ctr.id, cvr.id],
      confidence: "medium",
      requiresMoreData: false,
    });
  }

  const validation = observations.find((o) => o.metric === "validation_score");
  const perf = observations.find((o) => o.metric === "conversion_rate");
  if (validation?.value != null && validation.value >= 90 && perf?.value != null && perf.baseline != null && perf.value < perf.baseline) {
    anomalies.push({
      id: `anom-${++counter}`,
      metric: "validation_vs_performance",
      expectedRange: "High validation aligns with performance",
      observedValue: `Validation ${validation.value}, conversion below baseline`,
      severity: "medium",
      possibleExplanations: ["Possible validation blind spot"],
      evidenceIds: [validation.id, perf.id],
      confidence: "low",
      requiresMoreData: true,
    });
  }

  return anomalies;
}
