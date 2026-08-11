/**
 * Learning Brain — PX-46 public exports.
 */

export {
  LEARNING_BRAIN_VERSION,
  type LearningBrainGraph,
  type LearningBrainInput,
  type LearningBrainOutput,
  type LearningBrainPayload,
  type PerformanceObservation,
  type CustomerFeedbackObservation,
  type LearningExperimentContext,
  type LearningComparison,
  type LearningAnomaly,
  type LearningPattern,
  type LearningHypothesis,
  type LearningInsight,
  type LearningOutcome,
  type MemoryWriteProposal,
  type LearningRecommendation,
  type LearningContradiction,
  type LearningUnknown,
  type LearningSummary,
  type DataQualityAssessment,
  type AttributionContext,
  type MeasurementContext,
  type CausalityStrength,
  type LearningSnapshot,
  type LearningRun,
  type LearningHistory,
  type StrategyLearningSignal,
  type PlanningLearningSignal,
  type CreativeLearningSignal,
  type ValidationLearningSignal,
  type ExecutionLearningSignal,
  type AudienceLearningSignal,
  type ChannelLearningSignal,
  type MessagingLearningSignal,
  type ApprovalLearningSignal,
  type LearningSystemProposal,
} from "./brain-types";

export {
  buildLearningBrainGraph,
  hasInsufficientOutcomeData,
  singleEventIsNotPattern,
} from "./learning-brain-graph";
export {
  LearningBrainLayer,
  createLearningBrainLayer,
  buildLearningBrainGraphOutput,
  resetLearningBrainLayerCounters,
  InsufficientOutcomeDataError,
} from "./learning-brain-layer";
export {
  LearningBrainExecutor,
  createLearningBrainExecutor,
  learningBrainContract,
} from "./learning-brain-executor";
export {
  getDefaultLearningBrainRepository,
  resetDefaultLearningBrainRepository,
  type LearningBrainRepository,
} from "./learning-brain-repository";
export {
  validateLearningBrainGraph,
  assertNoCausalOverclaim,
  assertNoCreativeGeneration,
  assertNoFabricatedMetrics,
  assertNoCrossCampaignFabrication,
  hypothesisAllowsStrongCausality,
} from "./learning-validator";
export { mapLearningBrainToStructuredOutput, mapLearningBrainToOutput } from "./map-learning-brain-to-output";
export { assessDataQuality, weakestAttributionConfidence } from "./learning-data-quality";
export { learningConfidenceFromInput, minLearningConfidence } from "./learning-confidence";
export { buildLearningComparisons, interpretMultiMetric } from "./learning-comparisons";
export { detectAnomalies } from "./learning-anomalies";
export { buildPatterns, buildHypotheses } from "./learning-patterns";
export { buildMemoryWriteProposals, buildRecommendations, buildSystemProposals } from "./learning-memory-proposals";
export { detectContradictions, buildUnknowns, mergeIncrementalHypotheses } from "./learning-contradictions";
