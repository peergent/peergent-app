/**
 * Learning Brain — graph builder orchestrator.
 */

import type {
  LearningBrainGraph,
  LearningBrainInput,
  LearningSummary,
  MeasurementContext,
} from "./brain-types";
import { LEARNING_BRAIN_VERSION } from "./brain-types";
import { assessDataQuality, weakestAttributionConfidence } from "./learning-data-quality";
import { buildLearningComparisons, interpretMultiMetric } from "./learning-comparisons";
import { detectAnomalies } from "./learning-anomalies";
import { buildPatterns, buildHypotheses, singleEventIsNotPattern } from "./learning-patterns";
import { classifyOutcomes, buildInsights } from "./learning-outcomes";
import {
  buildStrategySignals,
  buildPlanningSignals,
  buildCreativeSignals,
  buildValidationSignals,
  buildExecutionSignals,
  buildAudienceSignals,
  buildChannelSignals,
  buildMessagingSignals,
  buildApprovalSignals,
} from "./learning-signals";
import { detectContradictions, buildUnknowns, mergeIncrementalHypotheses } from "./learning-contradictions";
import { buildMemoryWriteProposals, buildRecommendations, buildSystemProposals } from "./learning-memory-proposals";
import { learningConfidenceFromInput } from "./learning-confidence";

export function buildLearningBrainGraph(input: LearningBrainInput): LearningBrainGraph | null {
  if (input.performanceObservations.length === 0) return null;

  const createdAt = new Date().toISOString();
  const observations = input.performanceObservations;
  const dataQuality = assessDataQuality(observations);
  const attributionConfidence = weakestAttributionConfidence(observations);
  const experimentValid = (input.experiments ?? []).some((e) => e.validity === "high");

  const measurementWindow: MeasurementContext = input.measurementContext ?? {
    windowStart: observations[0]?.observedAt ?? null,
    windowEnd: observations[observations.length - 1]?.observedAt ?? null,
    durationDays: null,
    attribution: {
      model: observations[0]?.attributionModel ?? "unknown",
      source: observations[0]?.source ?? "observation",
      confidence: attributionConfidence,
      knownLimitations: attributionConfidence === "low" ? ["Weak attribution"] : [],
      crossChannelEffects: [],
      trackingCompleteness: null,
    },
  };

  const upstreamConfidence = learningConfidenceFromInput({
    dataQuality: dataQuality.qualityLevel,
    observationCount: observations.length,
    campaignCount: unique(observations.map((o) => o.campaignId).filter(Boolean) as string[]).length,
    attributionConfidence,
    hasContradictions: false,
    experimentValid,
  });

  const comparisons = buildLearningComparisons({
    observations,
    strategyGraph: input.strategyGraph,
    planningGraph: input.planningGraph,
    upstreamConfidence,
  });

  const anomalies = detectAnomalies(observations);
  const multiMetricNote = interpretMultiMetric(observations);

  const patterns = buildPatterns({
    observations,
    priorPatterns: input.priorPatterns,
    durableMemoryAllowed: dataQuality.usableForDurableMemory,
  });

  const rawHypotheses = buildHypotheses({
    observations,
    patterns,
    priorHypotheses: input.priorHypotheses,
    experimentValid,
    upstreamConfidence,
    createdAt,
  });

  const hypotheses = mergeIncrementalHypotheses(input.priorHypotheses ?? [], rawHypotheses);
  const contradictions = detectContradictions({ hypotheses, patterns });
  const insights = buildInsights({ observations, comparisons, multiMetricNote, upstreamConfidence });
  const outcomes = classifyOutcomes({ comparisons, observations, upstreamConfidence });

  const strategySignals = buildStrategySignals({ strategyGraph: input.strategyGraph, observations });
  const planningSignals = buildPlanningSignals({ planningGraph: input.planningGraph, observations });
  const creativeSignals = buildCreativeSignals({ creativeGraph: input.creativeGraph, observations });
  const validationSignals = buildValidationSignals({ validationGraph: input.validationGraph, observations });
  const executionSignals = buildExecutionSignals({ executionHistory: input.executionHistory, observations });
  const audienceSignals = buildAudienceSignals(observations);
  const channelSignals = buildChannelSignals({ strategyGraph: input.strategyGraph, observations });
  const messagingSignals = buildMessagingSignals(observations);
  const approvalSignals = buildApprovalSignals({
    customerFeedback: input.customerFeedback ?? [],
    priorApprovalSignals: input.approvalSignals,
  });

  const unknowns = buildUnknowns({
    observationCount: observations.length,
    hasBaseline: observations.some((o) => o.baseline != null),
    attributionWeak: attributionConfidence === "low",
    durationDays: measurementWindow.durationDays,
    executionInterrupted: observations.some((o) => o.metric === "execution_status" && o.value === 0),
  });

  const campaignIds = unique(observations.map((o) => o.campaignId).filter(Boolean) as string[]);
  const deliverableIds = unique(observations.map((o) => o.deliverableId).filter(Boolean) as string[]);

  const memoryWriteProposals = buildMemoryWriteProposals({
    patterns,
    hypotheses,
    insights,
    durableMemoryAllowed: dataQuality.usableForDurableMemory,
    campaignIds,
    deliverableIds,
  });

  const recommendations = buildRecommendations({ hypotheses, patterns });
  const systemProposals = buildSystemProposals({
    validationBlindSpot: anomalies.some((a) => a.metric === "validation_vs_performance"),
    planningGap: (input.planningGraph?.contextGaps.length ?? 0) > 0,
  });

  const confidence = learningConfidenceFromInput({
    dataQuality: dataQuality.qualityLevel,
    observationCount: observations.length,
    campaignCount: campaignIds.length,
    attributionConfidence,
    hasContradictions: contradictions.length > 0,
    experimentValid,
  });

  const summary: LearningSummary = {
    observationsAnalyzed: observations.length,
    comparisonsMade: comparisons.length,
    patternsFound: patterns.length,
    hypothesesCreated: hypotheses.length,
    confirmedLearnings: hypotheses.filter((h) => h.status === "confirmed").length,
    inconclusiveLearnings: outcomes.filter((o) => o.classification === "inconclusive").length,
    contradictions: contradictions.length,
    memoryProposals: memoryWriteProposals.length,
    futureRecommendations: recommendations.length,
    dataQuality: dataQuality.qualityLevel,
    confidence,
  };

  return {
    version: LEARNING_BRAIN_VERSION,
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    createdAt,
    updatedAt: createdAt,
    measurementWindow,
    changeReason: input.changeReason ?? "Learning brain run",
    supersedes: input.supersedesSnapshotId ?? null,
    observations,
    customerFeedback: input.customerFeedback ?? [],
    experiments: input.experiments ?? [],
    dataQuality,
    comparisons,
    anomalies,
    patterns,
    hypotheses,
    insights,
    outcomes,
    strategySignals,
    planningSignals,
    creativeSignals,
    validationSignals,
    executionSignals,
    audienceSignals,
    channelSignals,
    messagingSignals,
    approvalSignals,
    contradictions,
    unknowns,
    recommendations,
    systemProposals,
    memoryWriteProposals,
    confidence,
    summary,
  };
}

export function hasInsufficientOutcomeData(input: LearningBrainInput): boolean {
  return input.performanceObservations.length === 0;
}

export { singleEventIsNotPattern };

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export type { LearningBrainInput };
