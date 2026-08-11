import type { StrategyBrainGraph } from "../strategy/brain-types";
import type { PlanningBrainGraph } from "../planning/brain-types";
import type {
  LearningComparison,
  LearningConfidence,
  PerformanceObservation,
} from "./brain-types";
import { minLearningConfidence } from "./learning-confidence";

export function buildLearningComparisons(input: {
  observations: readonly PerformanceObservation[];
  strategyGraph?: StrategyBrainGraph | null;
  planningGraph?: PlanningBrainGraph | null;
  upstreamConfidence: LearningConfidence;
}): LearningComparison[] {
  const comparisons: LearningComparison[] = [];
  let counter = 0;

  for (const obs of input.observations) {
    if (obs.target != null && obs.value != null) {
      const delta = obs.value - obs.target;
      comparisons.push({
        id: `cmp-target-${++counter}`,
        type: "target_vs_actual",
        expected: String(obs.target),
        observed: String(obs.value),
        delta: String(delta),
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
        significance: Math.abs(delta) > (obs.target * 0.1) ? "medium" : "low",
        confidence: minLearningConfidence(obs.attributionConfidence, input.upstreamConfidence),
        evidenceRefs: [obs.id],
        context: `${obs.metric} for ${obs.channel ?? "campaign"}`,
      });
    }

    if (obs.baseline != null && obs.value != null) {
      const delta = obs.value - obs.baseline;
      comparisons.push({
        id: `cmp-baseline-${++counter}`,
        type: "baseline_vs_actual",
        expected: String(obs.baseline),
        observed: String(obs.value),
        delta: String(delta),
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
        significance: Math.abs(delta) > (obs.baseline * 0.15) ? "medium" : "low",
        confidence: minLearningConfidence(obs.attributionConfidence, input.upstreamConfidence),
        evidenceRefs: [obs.id],
        context: `${obs.metric} vs baseline`,
      });
    }
  }

  const byChannel = groupBy(input.observations.filter((o) => o.channel && o.value != null), (o) => o.channel!);
  const channelKeys = Object.keys(byChannel);
  if (channelKeys.length >= 2) {
    const [a, b] = channelKeys;
    const avgA = average(byChannel[a]!.map((o) => o.value!));
    const avgB = average(byChannel[b]!.map((o) => o.value!));
    comparisons.push({
      id: `cmp-channel-${++counter}`,
      type: "channel_vs_channel",
      expected: `${a} vs ${b}`,
      observed: `${avgA.toFixed(2)} vs ${avgB.toFixed(2)}`,
      delta: String(avgA - avgB),
      direction: avgA > avgB ? "up" : "down",
      significance: "medium",
      confidence: input.upstreamConfidence,
      evidenceRefs: [...byChannel[a]!, ...byChannel[b]!].map((o) => o.id),
      context: "Channel performance comparison",
    });
  }

  const bySegment = groupBy(input.observations.filter((o) => o.segment && o.value != null), (o) => o.segment!);
  const segKeys = Object.keys(bySegment);
  if (segKeys.length >= 2) {
    comparisons.push({
      id: `cmp-audience-${++counter}`,
      type: "audience_vs_audience",
      expected: segKeys.join(" vs "),
      observed: segKeys.map((k) => String(average(bySegment[k]!.map((o) => o.value!)))).join(" vs "),
      delta: null,
      direction: "unknown",
      significance: "medium",
      confidence: input.upstreamConfidence,
      evidenceRefs: segKeys.flatMap((k) => bySegment[k]!.map((o) => o.id)),
      context: "Audience segment comparison",
    });
  }

  if (input.strategyGraph) {
    for (const kpi of input.strategyGraph.kpiFramework.slice(0, 3)) {
      const related = input.observations.filter((o) =>
        o.metric.toLowerCase().includes(kpi.name.toLowerCase().split(" ")[0] ?? "")
      );
      if (related.length > 0 && related[0]?.value != null) {
        comparisons.push({
          id: `cmp-strategy-${++counter}`,
          type: "strategy_vs_outcome",
          expected: kpi.purpose,
          observed: `${related[0].metric}: ${related[0].value}`,
          delta: null,
          direction: "unknown",
          significance: "medium",
          confidence: minLearningConfidence(input.strategyGraph.confidence, input.upstreamConfidence),
          evidenceRefs: related.map((o) => o.id),
          context: "Strategy KPI vs observed outcome",
        });
      }
    }
  }

  if (input.planningGraph && input.observations.some((o) => o.metric === "execution_status")) {
    comparisons.push({
      id: `cmp-plan-${++counter}`,
      type: "plan_vs_execution",
      expected: "Successful execution per plan",
      observed: "Execution outcome recorded",
      delta: null,
      direction: "unknown",
      significance: "low",
      confidence: input.upstreamConfidence,
      evidenceRefs: input.observations.filter((o) => o.metric === "execution_status").map((o) => o.id),
      context: "Planning vs execution outcome",
    });
  }

  const variants = input.observations.filter((o) => o.metadata.variant);
  if (variants.length >= 2) {
    const groups = groupBy(variants, (o) => o.metadata.variant ?? "unknown");
    const keys = Object.keys(groups);
    comparisons.push({
      id: `cmp-creative-${++counter}`,
      type: "creative_vs_creative",
      expected: keys.join(" vs "),
      observed: keys.map((k) => `${k}: ${average(groups[k]!.map((o) => o.value ?? 0))}`).join("; "),
      delta: null,
      direction: "unknown",
      significance: "medium",
      confidence: input.upstreamConfidence,
      evidenceRefs: variants.map((o) => o.id),
      context: "Creative variant comparison",
    });
  }

  return comparisons;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = keyFn(item);
    acc[k] = [...(acc[k] ?? []), item];
    return acc;
  }, {});
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function interpretMultiMetric(observations: readonly PerformanceObservation[]): string | null {
  const ctr = observations.find((o) => o.metric === "ctr" && o.value != null);
  const cvr = observations.find((o) => o.metric === "conversion_rate" && o.value != null);
  const qlr = observations.find((o) => o.metric === "qualified_lead_rate" && o.value != null);
  if (ctr && cvr && qlr && ctr.value! > (ctr.baseline ?? 0) && cvr.value! < (cvr.baseline ?? Infinity)) {
    return "Creative attracted attention but likely reduced audience/message fit (CTR ↑, CVR ↓, qualified lead rate ↓).";
  }
  const roas = observations.find((o) => o.metric === "roas" && o.value != null);
  const volume = observations.find((o) => o.metric === "impressions" && o.value != null);
  if (roas && volume && roas.value! > (roas.baseline ?? 0) && volume.value! < (volume.baseline ?? Infinity)) {
    return "Efficiency improved but growth contribution declined (ROAS ↑, volume ↓).";
  }
  return null;
}
