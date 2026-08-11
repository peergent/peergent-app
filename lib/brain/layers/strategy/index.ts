/**
 * Strategy Brain — PX-44 public exports.
 */

export {
  STRATEGY_BRAIN_VERSION,
  emptyStrategyBrainGraph,
  emptyPositioningStrategy,
  type StrategyBrainGraph,
  type StrategyBrainInput,
  type StrategyBrainOutput,
  type StrategyBrainPayload,
  type StrategySnapshot,
  type StrategyRun,
  type StrategyHistory,
  type StrategyHistoryEntry,
  type StrategicDecision,
  type StrategicDecisionRecord,
  type StrategicProblem,
  type OpportunitySelection,
  type AudienceStrategy,
  type PositioningStrategy,
  type ChannelStrategy,
  type BudgetStrategy,
  type FunnelStrategy,
  type OfferStrategyDirection,
  type MessagingStrategyDirection,
  type StrategicKpi,
  type CampaignObjective,
  type StrategicTradeoff,
  type RejectedAlternative,
  type StrategicAssumption,
  type StrategicRisk,
  type StrategicPriority,
  type StrategyRationale,
  type StrategyEscalation,
  type StrategyApprovalRequirement,
  type PlanningStrategyInput,
  type StrategyConfidence,
  type StrategicDecisionType,
} from "./brain-types";

export { buildStrategyBrainGraph, type StrategyBrainInput as BuildStrategyBrainGraphInput } from "./strategy-brain-graph";
export { StrategyBrainLayer, createStrategyBrainLayer, buildStrategyBrainGraphOutput, resetStrategyBrainLayerCounters } from "./strategy-brain-layer";
export { StrategyBrainExecutor, createStrategyBrainExecutor, strategyBrainContract } from "./strategy-brain-executor";
export {
  getDefaultStrategyBrainRepository,
  resetDefaultStrategyBrainRepository,
  type StrategyBrainRepository,
} from "./strategy-brain-repository";
export {
  validateStrategyBrainGraph,
  assertNoCreativeLanguage,
  assertNoPlanningLanguage,
  assertNoResearchCalls,
  assertNoCompanyMutation,
  containsCreativeLanguage,
  containsPlanningLanguage,
} from "./strategy-validator";
export { mapStrategyBrainToStructuredOutput, mapStrategyBrainToOutput } from "./map-strategy-brain-to-output";
export { enforceStrategyConfidenceCeiling, confidenceFromUpstream, minStrategyConfidence } from "./strategy-confidence";
export { buildStrategicProblems } from "./strategy-problems";
export { selectOpportunities } from "./strategy-opportunity-selection";
export { buildAudienceStrategy } from "./strategy-audience";
export { buildPositioningStrategy } from "./strategy-positioning";
export { buildChannelStrategy } from "./strategy-channels";
export { buildBudgetStrategy } from "./strategy-budget";
export { buildFunnelStrategy } from "./strategy-funnel";
export { buildOfferStrategyDirection } from "./strategy-offer";
export { buildMessagingStrategyDirection } from "./strategy-messaging";
export { buildKpiFramework, assertNoFabricatedKpiTargets } from "./strategy-kpis";
export { buildCampaignObjectives } from "./strategy-campaign-objectives";
export { buildStrategicTradeoffs } from "./strategy-tradeoffs";
export { buildStrategicAssumptions, buildStrategicRisks } from "./strategy-risks";
export { buildStrategyEscalations, hasBlockingEscalation } from "./strategy-escalations";
