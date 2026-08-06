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
