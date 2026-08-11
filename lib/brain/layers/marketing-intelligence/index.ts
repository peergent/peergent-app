export {
  MARKETING_INTELLIGENCE_LAYER_VERSION,
  type MarketingIntelligenceGraph,
  type MarketingIntelligenceInsight,
  emptyMarketingIntelligenceGraph,
} from "./types";

export type {
  MarketingIntelligenceThinkingRecord,
  MarketingIntelligenceThinkingId,
} from "./marketing-intelligence-thinking";

export {
  buildMarketingIntelligenceThinking,
  MARKETING_INTELLIGENCE_THINKING_QUESTIONS,
} from "./marketing-intelligence-thinking";

export {
  buildMarketingIntelligenceGraph,
  type BuildMarketingIntelligenceInput,
} from "./build-marketing-intelligence";

export {
  MarketingIntelligenceLayer,
  createMarketingIntelligenceLayer,
  collectMarketingIntelligenceGraph,
  type MarketingIntelligenceLayerInput,
  type MarketingIntelligenceLayerResult,
} from "./marketing-intelligence-layer";

export {
  getDefaultMarketingIntelligenceRepository,
  resetDefaultMarketingIntelligenceRepository,
  type MarketingIntelligenceRepository,
} from "./marketing-intelligence-repository";

export { MARKETING_INTELLIGENCE_MODULE_SPECS } from "./modules/specs";

export type { MarketingIntelligenceModuleSpec } from "./marketing-intelligence-module";

/* PX-43 — Marketing Intelligence Brain */

export {
  MARKETING_INTELLIGENCE_BRAIN_VERSION,
  emptyMarketingIntelligenceBrainGraph,
} from "./brain-types";

export type {
  MarketingIntelligenceBrainGraph,
  MarketingIntelligenceBrainInput,
  MarketingIntelligenceBrainOutput,
  MarketingIntelligenceBrainPayload,
  AudienceSegmentIntelligence,
  ChannelIntelligence,
  MessagingIntelligence,
  CompetitiveMarketingIntelligence,
  MarketIntelligenceSignal,
  FunnelIntelligence,
  OfferIntelligence,
  ContentIntelligence,
  SearchIntelligence,
  PaidMediaIntelligence,
  OrganicIntelligence,
  MarketingBenchmark,
  MarketingOpportunity,
  MarketingRisk,
  MarketingPrioritySignal,
  MarketingStrategyInput,
  MarketingIntelligenceSnapshot,
  MarketingIntelligenceRun,
  MarketingIntelligenceHistory,
  InsufficientDataReason,
} from "./brain-types";

export {
  combineUpstreamConfidence,
  enforceMarketingConfidenceCeiling,
  aggregateGraphConfidence,
} from "./marketing-intelligence-confidence";

export { collectMarketingEvidence } from "./marketing-intelligence-evidence";

export { buildAudienceIntelligence } from "./marketing-intelligence-audience";
export {
  buildChannelIntelligence,
  containsChannelStrategyLanguage,
} from "./marketing-intelligence-channels";
export {
  buildMessagingIntelligence,
  detectMessagingSaturation,
} from "./marketing-intelligence-messaging";
export { buildCompetitiveMarketingIntelligence } from "./marketing-intelligence-competitors";
export { buildMarketIntelligence } from "./marketing-intelligence-market";
export { buildFunnelIntelligence, detectFunnelGaps } from "./marketing-intelligence-funnel";
export { buildOfferIntelligence } from "./marketing-intelligence-offer";
export { buildContentIntelligence } from "./marketing-intelligence-content";
export { buildSearchIntelligence } from "./marketing-intelligence-search";
export { buildPaidMediaIntelligence } from "./marketing-intelligence-paid";
export { buildOrganicIntelligence } from "./marketing-intelligence-organic";
export { buildBenchmarkContext } from "./marketing-intelligence-benchmarks";
export {
  buildMarketingOpportunities,
  containsStrategyLanguage,
} from "./marketing-intelligence-opportunities";
export { buildMarketingRisks } from "./marketing-intelligence-risks";
export { buildMarketingPriorities, buildStrategyInputs } from "./marketing-intelligence-priorities";

export {
  buildMarketingIntelligenceBrainGraph,
  assertNoCompanyMutation,
  assertNoStrategyLanguage,
  assertNoCreativeLanguage,
  assertNoExternalResearchPerformed,
} from "./marketing-intelligence-graph";

export type { BuildMarketingIntelligenceBrainGraphInput } from "./marketing-intelligence-graph";

export { validateMarketingIntelligenceBrainGraph } from "./marketing-intelligence-validator";
export type { MarketingIntelligenceValidationResult } from "./marketing-intelligence-validator";

export { mapMarketingIntelligenceToStructuredOutput } from "./map-marketing-intelligence-to-output";

export {
  MarketingIntelligenceBrainLayer,
  createMarketingIntelligenceBrainLayer,
  collectMarketingIntelligenceBrainGraph,
  resetMarketingIntelligenceBrainLayerCounters,
} from "./marketing-intelligence-brain-layer";

export type { MarketingIntelligenceBrainRepository } from "./marketing-intelligence-brain-repository";

export {
  getDefaultMarketingIntelligenceBrainRepository,
  resetDefaultMarketingIntelligenceBrainRepository,
} from "./marketing-intelligence-brain-repository";

export {
  MarketingIntelligenceBrainExecutor,
  createMarketingIntelligenceBrainExecutor,
  marketingIntelligenceBrainContract,
} from "./marketing-intelligence-brain-executor";
