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
