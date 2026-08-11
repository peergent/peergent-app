export { REASONING_LAYER_VERSION, emptyReasoningGraph } from "./types";

export type {
  ReasoningConfidenceScore,
  ReasoningNode,
  ReasoningPattern,
  ReasoningContradiction,
  ReasoningUnknown,
  ReasoningOpportunity,
  ReasoningRisk,
  ReasoningHypothesis,
  ReasoningConstraint,
  ReasoningAssumption,
  ReasoningTheme,
  ReasoningPriorityInsight,
  ReasoningGraph,
} from "./types";

export { createReasoningNode, clampReasoningConfidence, resetReasoningNodeCounter } from "./reasoning-node";

export {
  deriveReasoningConfidence,
  confidenceFromSingleEvidence,
  isUnknownConfidence,
} from "./confidence-engine";

export type {
  ReasoningModuleId,
  ReasoningModuleInput,
  ReasoningModuleOutput,
  ReasoningModuleSpec,
  ReasoningModule,
} from "./reasoning-module";

export {
  REASONING_MODULE_SPECS,
  getReasoningModuleSpec,
  BUSINESS_REASONING_SPEC,
  CUSTOMER_REASONING_SPEC,
  COMPETITOR_REASONING_SPEC,
  OFFER_REASONING_SPEC,
  BRAND_REASONING_SPEC,
  MARKET_REASONING_SPEC,
  POSITIONING_REASONING_SPEC,
  RISK_REASONING_SPEC,
  OPPORTUNITY_REASONING_SPEC,
  CONSTRAINT_REASONING_SPEC,
  PATTERN_RECOGNITION_SPEC,
  CONTRADICTION_DETECTION_SPEC,
  UNKNOWN_RESOLUTION_SPEC,
} from "./modules/specs";

export { buildReasoningGraph, reasoningGraphHasEvidenceChain } from "./build-reasoning-graph";
export type { BuildReasoningGraphInput } from "./build-reasoning-graph";

export type { ReasoningRecordKey, ReasoningRecord, ReasoningRepository } from "./reasoning-repository";
export {
  InMemoryReasoningRepository,
  getDefaultReasoningRepository,
  resetDefaultReasoningRepository,
} from "./reasoning-repository";

export { ReasoningLayer, createReasoningLayer, collectReasoningGraph } from "./reasoning-layer";
export type { ReasoningLayerInput, ReasoningLayerResult } from "./reasoning-layer";

/* PX-42 — Reasoning Brain */

export {
  REASONING_BRAIN_VERSION,
  emptyReasoningBrainGraph,
} from "./brain-types";

export type {
  ReasoningBrainGraph,
  ReasoningBrainInput,
  ReasoningBrainOutput,
  ReasoningBrainPayload,
  ReasoningInterpretation,
  ReasoningBrainAssumption,
  ReasoningBrainContradiction,
  ReasoningBrainHypothesis,
  ReasoningBrainOpportunity,
  ReasoningBrainRisk,
  ReasoningBrainUnknown,
  ReasoningDecisionOption,
  ReasoningEscalation,
  ReasoningPrioritySignal,
  ReasoningEvidenceRef,
  ReasoningSnapshot,
  ReasoningRun,
  ReasoningHistory,
  ReasoningHistoryEntry,
  ReasoningConfidenceLabel,
  ReasoningPriority,
} from "./brain-types";

export {
  combineConfidence,
  enforceReasoningConfidenceCeiling,
  aggregateGraphConfidence,
  deriveInterpretationConfidence,
} from "./reasoning-confidence";

export {
  buildPrioritySignals,
  prioritizeOpportunity,
  resetReasoningPrioritizationCounter,
} from "./reasoning-prioritization";

export {
  buildReasoningContradictions,
  resetReasoningContradictionCounters,
} from "./reasoning-contradictions";

export {
  buildReasoningAssumptions,
  resetReasoningAssumptionCounter,
} from "./reasoning-assumptions";

export {
  buildReasoningOpportunities,
  containsStrategyLanguage,
  resetReasoningOpportunityCounter,
} from "./reasoning-opportunities";

export { buildReasoningRisks, resetReasoningRiskCounter } from "./reasoning-risks";

export {
  buildDecisionOptions,
  containsStrategyImperative,
  resetReasoningOptionCounter,
} from "./reasoning-options";

export {
  buildEscalations,
  createEscalation,
  resetReasoningEscalationCounter,
} from "./reasoning-escalations";

export {
  buildReasoningBrainGraph,
  reasoningBrainGraphHasEvidenceChain,
  assertNoCompanyMutation,
  assertNoStrategyLanguage,
  assertNoCreativeLanguage,
  resetReasoningGraphCounters,
} from "./reasoning-graph";

export type { BuildReasoningBrainGraphInput } from "./reasoning-graph";

export { validateReasoningBrainGraph } from "./reasoning-validator";
export type { ReasoningValidationResult } from "./reasoning-validator";

export { mapReasoningGraphToStructuredOutput } from "./map-reasoning-graph-to-output";

export {
  ReasoningBrainLayer,
  createReasoningBrainLayer,
  collectReasoningBrainGraph,
  resetReasoningBrainLayerCounters,
} from "./reasoning-brain-layer";

export type { ReasoningBrainRepository } from "./reasoning-brain-repository";

export {
  InMemoryReasoningBrainRepository,
  getDefaultReasoningBrainRepository,
  resetDefaultReasoningBrainRepository,
} from "./reasoning-brain-repository";

export {
  ReasoningBrainExecutor,
  createReasoningBrainExecutor,
  reasoningBrainContract,
} from "./reasoning-brain-executor";
