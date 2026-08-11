import type { StrategyBrainGraph } from "../strategy/brain-types";
import type { PlanningBrainGraph } from "../planning/brain-types";
import type { CreativeGraph } from "../creative/types";
import type { ValidationGraph } from "../validation/types";
import type { ExecutionHistory } from "../execution/types";
import type {
  ApprovalLearningSignal,
  AudienceLearningSignal,
  ChannelLearningSignal,
  CreativeLearningSignal,
  CustomerFeedbackObservation,
  ExecutionLearningSignal,
  LearningConfidence,
  MessagingLearningSignal,
  PerformanceObservation,
  PlanningLearningSignal,
  StrategyLearningSignal,
  ValidationLearningSignal,
} from "./brain-types";

export function buildStrategySignals(input: {
  strategyGraph?: StrategyBrainGraph | null;
  observations: readonly PerformanceObservation[];
}): StrategyLearningSignal[] {
  if (!input.strategyGraph) return [];
  const signals: StrategyLearningSignal[] = [];
  let i = 0;
  for (const ch of input.strategyGraph.channelStrategy.filter((c) => c.selected)) {
    const obs = input.observations.filter((o) => o.channel === ch.channel);
    signals.push({
      id: `strat-sig-${++i}`,
      subject: ch.channel,
      finding: obs.length > 0 ? `${ch.role} channel produced measurable outcomes` : "Insufficient outcome data for channel effectiveness",
      decisionRef: input.strategyGraph.strategicDecisions.find((d) => d.decisionType === "channel")?.id ?? null,
      confidence: obs.length > 0 ? "medium" : "low",
    });
  }
  return signals;
}

export function buildPlanningSignals(input: {
  planningGraph?: PlanningBrainGraph | null;
  observations: readonly PerformanceObservation[];
}): PlanningLearningSignal[] {
  if (!input.planningGraph) return [];
  const signals: PlanningLearningSignal[] = [];
  if (input.planningGraph.contextGaps.length > 0) {
    signals.push({
      id: "plan-sig-gap",
      subject: "Context gaps",
      finding: "Tracking or integration gaps may have affected delivery timing",
      workPackageRef: input.planningGraph.workPackages.find((w) => w.title.includes("tracking"))?.id ?? null,
      confidence: "medium",
    });
  }
  if (input.planningGraph.approvalGates.some((g) => g.blocking)) {
    signals.push({
      id: "plan-sig-approval",
      subject: "Approval sequencing",
      finding: "Approval gates may create bottlenecks in operational flow",
      workPackageRef: null,
      confidence: "low",
    });
  }
  return signals;
}

export function buildCreativeSignals(input: {
  creativeGraph?: CreativeGraph | null;
  observations: readonly PerformanceObservation[];
}): CreativeLearningSignal[] {
  const variants = input.observations.filter((o) => o.metadata.variant);
  return variants.map((o, i) => ({
    id: `cre-sig-${i}`,
    subject: o.metadata.variant ?? "variant",
    finding:
      o.value != null && o.baseline != null && o.value > o.baseline
        ? `${o.metadata.variant} outperformed campaign median for ${o.metric}`
        : `${o.metadata.variant} performance recorded`,
    deliverableRef: o.deliverableId ?? null,
    confidence: "low",
  }));
}

export function buildValidationSignals(input: {
  validationGraph?: ValidationGraph | null;
  observations: readonly PerformanceObservation[];
}): ValidationLearningSignal[] {
  const vScore = input.observations.find((o) => o.metric === "validation_score");
  const cvr = input.observations.find((o) => o.metric === "conversion_rate");
  if (!vScore) return [];
  const reinforced = vScore.value != null && vScore.value >= 90 && cvr?.value != null && cvr.baseline != null && cvr.value >= cvr.baseline;
  const blindSpot = vScore.value != null && vScore.value >= 90 && cvr?.value != null && cvr.baseline != null && cvr.value < cvr.baseline;
  return [
    {
      id: "val-sig-1",
      subject: "Validation vs performance",
      finding: reinforced
        ? "High validation score aligned with strong conversion"
        : blindSpot
          ? "High validation score but weak performance — possible blind spot"
          : "Validation signal recorded",
      validationRef: input.validationGraph ? "validation-graph" : null,
      confidence: blindSpot ? "low" : "medium",
    },
  ];
}

export function buildExecutionSignals(input: {
  executionHistory?: ExecutionHistory | null;
  observations: readonly PerformanceObservation[];
}): ExecutionLearningSignal[] {
  const fail = input.observations.find((o) => o.metric === "execution_status" && o.value === 0);
  if (!fail) return [];
  return [
    {
      id: "exec-sig-1",
      subject: "Execution reliability",
      finding: "Execution failure affected performance measurement window",
      executionRef: input.executionHistory?.entries?.[0]?.audit?.id ?? null,
      confidence: "high",
    },
  ];
}

export function buildAudienceSignals(observations: readonly PerformanceObservation[]): AudienceLearningSignal[] {
  const bySegment = observations.filter((o) => o.segment && o.value != null);
  const segments = [...new Set(bySegment.map((o) => o.segment!))];
  return segments.map((seg, i) => {
    const segObs = bySegment.filter((o) => o.segment === seg);
    const avg = segObs.reduce((s, o) => s + (o.value ?? 0), 0) / segObs.length;
    return {
      id: `aud-sig-${i}`,
      audience: seg,
      observedBehavior: `Average metric performance ${avg.toFixed(2)}`,
      expectedBehavior: "Segment performs at campaign median",
      performanceDifference: segObs[0]?.baseline != null ? String(avg - segObs[0].baseline!) : "Unknown",
      confidence: segObs.length >= 2 ? "medium" : "low",
      sampleSize: segObs[0]?.sampleSize ?? null,
      businessImpact: "Audience prioritization consideration",
      futureConsideration: "Strategy may review audience weighting via Memory",
    };
  });
}

export function buildChannelSignals(input: {
  strategyGraph?: StrategyBrainGraph | null;
  observations: readonly PerformanceObservation[];
}): ChannelLearningSignal[] {
  const channels = [...new Set(input.observations.map((o) => o.channel).filter(Boolean))] as string[];
  return channels.map((ch, i) => {
    const obs = input.observations.filter((o) => o.channel === ch);
    const role = input.strategyGraph?.channelStrategy.find((c) => c.channel === ch)?.role ?? "unknown";
    return {
      id: `ch-sig-${i}`,
      channel: ch,
      role,
      expectedOutcome: "Supports strategic channel role",
      actualOutcome: obs.map((o) => `${o.metric}: ${o.value ?? "n/a"}`).join("; "),
      efficiency: "Not auto-reallocated — observation only",
      quality: obs.some((o) => o.metric.includes("lead")) ? "Lead quality signal present" : "Engagement-focused",
      funnelContribution: "Observed in measurement window",
      confidence: obs.length >= 2 ? "medium" : "low",
      limitations: ["Does not trigger budget reallocation"],
    };
  });
}

export function buildMessagingSignals(observations: readonly PerformanceObservation[]): MessagingLearningSignal[] {
  return observations
    .filter((o) => o.metadata.messageTerritory)
    .map((o, i) => ({
      id: `msg-sig-${i}`,
      messageTerritory: o.metadata.messageTerritory!,
      hookType: o.metadata.hookType ?? null,
      proofType: o.metadata.proofType ?? null,
      performanceRelationship:
        o.value != null && o.baseline != null && o.value > o.baseline
          ? "Correlated with uplift — not universal rule"
          : "Observed — scope limited",
      scope: o.segment ?? o.channel ?? "campaign",
      confidence: "low",
    }));
}

export function buildApprovalSignals(input: {
  customerFeedback: readonly CustomerFeedbackObservation[];
  priorApprovalSignals?: readonly ApprovalLearningSignal[];
}): ApprovalLearningSignal[] {
  const rejects = input.customerFeedback.filter((f) => f.kind === "rejected");
  const signals = rejects.map((f, i) => ({
    id: `appr-sig-${i}`,
    pattern: f.subject,
    finding: f.reason ?? "Customer rejected creative direction",
    confidence: "medium" as LearningConfidence,
  }));
  return [...(input.priorApprovalSignals ?? []), ...signals];
}
