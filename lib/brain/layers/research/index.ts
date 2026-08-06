export {
  RESEARCH_LAYER_VERSION,
  RESEARCH_CONFIDENCE,
  emptyResearchGraph,
} from "./types";

export type {
  ResearchConfidenceScore,
  ResearchSourceKind,
  ResearchSource,
  ResearchValidationStatus,
  ResearchEvidence,
  ResearchUnknown,
  ResearchSwotNode,
  ResearchGraph,
  ResearchGraphNodeKey,
} from "./types";

export {
  createResearchEvidence,
  clampConfidence,
  brainConfidenceToScore,
  resetResearchEvidenceCounter,
} from "./evidence";

export { createResearchUnknown, resetResearchUnknownCounter } from "./unknowns";

export type {
  ResearchModuleId,
  ResearchModuleInput,
  ResearchModuleOutput,
  ResearchModuleSpec,
  ResearchModule,
} from "./research-module";

export { averageModuleConfidence } from "./research-module";

export {
  RESEARCH_MODULE_SPECS,
  getResearchModuleSpec,
  COMPANY_RESEARCH_SPEC,
  WEBSITE_RESEARCH_SPEC,
  COMPETITOR_RESEARCH_SPEC,
  PRODUCT_RESEARCH_SPEC,
  AUDIENCE_RESEARCH_SPEC,
  SEO_RESEARCH_SPEC,
  BRAND_RESEARCH_SPEC,
  MARKET_RESEARCH_SPEC,
  OFFER_RESEARCH_SPEC,
} from "./modules/specs";

export { buildResearchGraph, researchGraphHasProvenance } from "./build-research-graph";
export type { BuildResearchGraphInput } from "./build-research-graph";

export type { ResearchRecordKey, ResearchRecord, ResearchRepository } from "./research-repository";
export {
  InMemoryResearchRepository,
  getDefaultResearchRepository,
  resetDefaultResearchRepository,
} from "./research-repository";

export {
  ResearchLayer,
  createResearchLayer,
  collectResearchGraph,
} from "./research-layer";

export type { ResearchLayerInput, ResearchLayerResult } from "./research-layer";
