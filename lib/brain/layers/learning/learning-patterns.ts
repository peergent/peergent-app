import type {
  LearningHypothesis,
  LearningPattern,
  PerformanceObservation,
  LearningConfidence,
} from "./brain-types";
import { minLearningConfidence } from "./learning-confidence";

const MIN_PATTERN_OBSERVATIONS = 3;
const MIN_PATTERN_CAMPAIGNS = 2;

export function buildPatterns(input: {
  observations: readonly PerformanceObservation[];
  priorPatterns?: readonly LearningPattern[];
  durableMemoryAllowed: boolean;
}): LearningPattern[] {
  const patterns: LearningPattern[] = [];
  const byMessage = groupObs(input.observations, (o) => o.metadata.messageTerritory ?? "");
  let counter = 0;

  for (const [territory, obs] of Object.entries(byMessage)) {
    if (!territory || obs.length < MIN_PATTERN_OBSERVATIONS) continue;
    const campaigns = unique(obs.map((o) => o.campaignId).filter(Boolean) as string[]);
    if (campaigns.length < MIN_PATTERN_CAMPAIGNS) continue;

    patterns.push({
      id: `pat-${++counter}`,
      category: "messaging",
      title: `${territory} messaging correlation`,
      description: `Across ${obs.length} observations in ${campaigns.length} campaigns, ${territory} correlated with stronger engagement.`,
      scope: "organization",
      supportingObservations: obs.map((o) => o.id),
      supportingCampaigns: campaigns,
      supportingDeliverables: unique(obs.map((o) => o.deliverableId).filter(Boolean) as string[]),
      sampleSize: obs.length,
      consistency: obs.length >= 5 ? "medium" : "low",
      businessImpact: "May improve qualified engagement when reused in comparable contexts",
      confidence: input.durableMemoryAllowed ? "medium" : "low",
      firstObservedAt: obs[0]?.observedAt ?? new Date().toISOString(),
      lastObservedAt: obs[obs.length - 1]?.observedAt ?? new Date().toISOString(),
      contradictions: [],
    });
  }

  return [...(input.priorPatterns ?? []), ...patterns];
}

export function buildHypotheses(input: {
  observations: readonly PerformanceObservation[];
  patterns: readonly LearningPattern[];
  priorHypotheses?: readonly LearningHypothesis[];
  experimentValid: boolean;
  upstreamConfidence: LearningConfidence;
  createdAt: string;
}): LearningHypothesis[] {
  const hypotheses: LearningHypothesis[] = [];
  let counter = 0;

  for (const obs of input.observations) {
    if (obs.metadata.messageTerritory && obs.value != null && obs.baseline != null && obs.value > obs.baseline) {
      hypotheses.push({
        id: `hyp-${++counter}`,
        statement: `${obs.metadata.messageTerritory} correlated with higher ${obs.metric} during this window`,
        reason: "Single-observation uplift vs baseline — not yet a durable pattern",
        supportingEvidence: [obs.id],
        contradictingEvidence: [],
        confidence: "low",
        status: "proposed",
        validationNeeded: true,
        recommendedTest: "Repeat in comparable audience/channel context",
        scope: obs.segment ?? obs.channel ?? "campaign",
        causalityStrength: "correlation",
        createdAt: input.createdAt,
      });
    }
  }

  for (const pattern of input.patterns) {
    hypotheses.push({
      id: `hyp-${++counter}`,
      statement: pattern.description,
      reason: "Repeated evidence across campaigns",
      supportingEvidence: pattern.supportingObservations,
      contradictingEvidence: pattern.contradictions,
      confidence: minLearningConfidence(pattern.confidence, input.upstreamConfidence),
      status: pattern.sampleSize >= 5 ? "supported" : "proposed",
      validationNeeded: pattern.sampleSize < 8,
      recommendedTest: pattern.sampleSize < 8 ? "Controlled experiment recommended" : null,
      scope: pattern.scope,
      causalityStrength: input.experimentValid ? "experimental" : "correlation",
      createdAt: input.createdAt,
    });
  }

  return [...(input.priorHypotheses ?? []), ...hypotheses];
}

export function singleEventIsNotPattern(observationCount: number, campaignCount: number): boolean {
  return observationCount < MIN_PATTERN_OBSERVATIONS || campaignCount < MIN_PATTERN_CAMPAIGNS;
}

function groupObs(obs: readonly PerformanceObservation[], key: (o: PerformanceObservation) => string) {
  return obs.reduce<Record<string, PerformanceObservation[]>>((acc, o) => {
    const k = key(o);
    if (!k) return acc;
    acc[k] = [...(acc[k] ?? []), o];
    return acc;
  }, {});
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
