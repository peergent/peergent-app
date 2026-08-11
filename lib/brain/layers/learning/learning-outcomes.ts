import type {
  LearningComparison,
  LearningInsight,
  LearningOutcome,
  LearningOutcomeClassification,
  LearningConfidence,
  PerformanceObservation,
} from "./brain-types";
import { interpretMultiMetric } from "./learning-comparisons";

export function classifyOutcomes(input: {
  comparisons: readonly LearningComparison[];
  observations: readonly PerformanceObservation[];
  upstreamConfidence: LearningConfidence;
}): LearningOutcome[] {
  const outcomes: LearningOutcome[] = [];
  let counter = 0;

  for (const cmp of input.comparisons) {
    if (cmp.type !== "target_vs_actual" && cmp.type !== "expected_vs_actual") continue;
    const classification = classifyFromDirection(cmp.direction, cmp.significance);
    outcomes.push({
      id: `out-${++counter}`,
      classification,
      whatHappened: cmp.observed,
      againstExpectation: cmp.expected,
      businessImpact: classification === "outperformed" ? "Positive vs expectation" : classification === "underperformed" ? "Below expectation" : "Neutral or unclear",
      confidence: cmp.confidence,
      unknowns: cmp.delta == null ? ["Magnitude uncertain"] : [],
      evidenceRefs: cmp.evidenceRefs,
    });
  }

  const execFail = input.observations.find((o) => o.metric === "execution_status" && o.value === 0);
  if (execFail) {
    outcomes.push({
      id: `out-${++counter}`,
      classification: "execution_failure",
      whatHappened: "Execution did not complete successfully",
      againstExpectation: "Successful execution",
      businessImpact: "Performance window affected",
      confidence: "high",
      unknowns: [],
      evidenceRefs: [execFail.id],
    });
  }

  const measureFail = input.observations.find((o) => o.value == null && o.metric !== "execution_status");
  if (measureFail) {
    outcomes.push({
      id: `out-${++counter}`,
      classification: "measurement_failure",
      whatHappened: "Metric could not be measured",
      againstExpectation: "Complete measurement",
      businessImpact: "Learning limited for this metric",
      confidence: "medium",
      unknowns: ["Missing metric value"],
      evidenceRefs: [measureFail.id],
    });
  }

  const ctr = input.observations.find((o) => o.metric === "ctr");
  const qlr = input.observations.find((o) => o.metric === "qualified_lead_rate");
  if (ctr?.value != null && qlr?.value != null && ctr.value > (ctr.baseline ?? 0) && qlr.value != null && qlr.baseline != null && qlr.value < qlr.baseline) {
    outcomes.push({
      id: `out-${++counter}`,
      classification: "mixed",
      whatHappened: "High engagement without downstream business impact",
      againstExpectation: "Engagement aligns with qualified leads",
      businessImpact: "Vanity metric uplift — not overall success",
      confidence: "medium",
      unknowns: ["Attribution across funnel stages"],
      evidenceRefs: [ctr.id, qlr.id],
    });
  }

  return outcomes;
}

function classifyFromDirection(
  direction: LearningComparison["direction"],
  significance: LearningConfidence
): LearningOutcomeClassification {
  if (significance === "low") return "inconclusive";
  if (direction === "up") return "outperformed";
  if (direction === "down") return "underperformed";
  return "met_expectation";
}

export function buildInsights(input: {
  observations: readonly PerformanceObservation[];
  comparisons: readonly LearningComparison[];
  multiMetricNote: string | null;
  upstreamConfidence: LearningConfidence;
}): LearningInsight[] {
  const insights: LearningInsight[] = [];
  let counter = 0;

  for (const obs of input.observations.slice(0, 6)) {
    if (obs.value == null) continue;
    insights.push({
      id: `ins-${++counter}`,
      observation: `${obs.metric} observed at ${obs.value}${obs.unit ? ` ${obs.unit}` : ""}`,
      interpretation:
        obs.baseline != null && obs.value > obs.baseline
          ? `${obs.metric} outperformed baseline during measurement window`
          : `${obs.metric} recorded for analysis`,
      whyItMatters: obs.metric.includes("lead") || obs.metric.includes("conversion") ? "Downstream business impact" : "Engagement signal — interpret with funnel context",
      businessImpact: obs.metric.includes("qualified") ? "Pipeline impact" : "Diagnostic signal",
      evidenceRefs: [obs.id],
      confidence: obs.attributionConfidence,
      scope: obs.segment ?? obs.channel ?? "campaign",
      limitations: obs.sampleSize == null ? ["Sample size unknown"] : obs.sampleSize < 30 ? ["Small sample"] : [],
    });
  }

  if (input.multiMetricNote) {
    insights.push({
      id: `ins-${++counter}`,
      observation: "Multiple related metrics observed",
      interpretation: input.multiMetricNote,
      whyItMatters: "Isolated metrics can mislead — combined interpretation required",
      businessImpact: "Guards against vanity-metric optimization",
      evidenceRefs: input.observations.map((o) => o.id),
      confidence: input.upstreamConfidence,
      scope: "campaign",
      limitations: ["Correlation only unless experiment valid"],
    });
  }

  return insights;
}
