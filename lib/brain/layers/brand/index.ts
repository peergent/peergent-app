export {
  BRAND_LAYER_VERSION,
  BRAND_CONFIDENCE,
  emptyBrandGraph,
  emptyBrandModel,
  emptyBrandResearchGraph,
} from "./types";

export type {
  BrandConfidenceScore,
  BrandConceptId,
  BrandConceptDomain,
  BrandFact,
  BrandGraph,
  BrandKnowledgeStatus,
  BrandModel,
  BrandResearchGraph,
  BrandResearchObservation,
  BrandResearchSource,
  BrandResearchSourceKind,
  BrandResearchUnknown,
} from "./types";

export {
  ALL_BRAND_CONCEPT_IDS,
  BRAND_CONCEPT_DEFINITIONS,
  getBrandConceptDefinition,
  listBrandConceptsByDomain,
} from "./brand-concepts";

export {
  brainConfidenceToBrandScore,
  clampBrandConfidence,
  createBrandResearchObservation,
  createBrandResearchUnknown,
  resetBrandObservationCounter,
  resetBrandUnknownCounter,
} from "./evidence";

export type {
  BrandResearchModuleId,
  BrandResearchModuleInput,
  BrandResearchModuleOutput,
  BrandResearchModuleSpec,
} from "./brand-research-module";

export {
  BRAND_RESEARCH_MODULE_SPECS,
  getBrandResearchModuleSpec,
  CAPABILITY_BRAND_RESEARCH_SPEC,
  CAMPAIGN_BRAND_RESEARCH_SPEC,
  CHANNEL_STYLE_RESEARCH_SPEC,
  PROFILE_BRAND_RESEARCH_SPEC,
  VISUAL_IDENTITY_RESEARCH_SPEC,
  WEBSITE_MESSAGING_RESEARCH_SPEC,
} from "./modules/specs";

export {
  buildBrandResearchGraph,
  brandResearchGraphHasProvenance,
  type BuildBrandResearchGraphInput,
} from "./build-brand-research-graph";

export {
  buildBrandGraph,
  buildBrandModel,
  brandGraphFromParts,
  brandModelHasConfidence,
  queryBrandFactsByConcept,
  queryBrandFactsByStatus,
  resetBrandFactCounter,
  type BuildBrandGraphInput,
} from "./build-brand-graph";

export type { BrandRecord, BrandRecordKey, BrandRepository } from "./brand-repository";
export {
  InMemoryBrandRepository,
  getDefaultBrandRepository,
  resetDefaultBrandRepository,
} from "./brand-repository";

export type {
  BrandBoundaryFact,
  BrandBrainConsumer,
  BrandBrainSnapshot,
} from "./brand-boundary";
export {
  BrandBoundary,
  createBrandBoundary,
  exposeBrandBrainToConsumer,
} from "./brand-boundary";

export type { BrandLayerInput, BrandLayerResult } from "./brand-layer";
export { BrandLayer, collectBrandGraph, createBrandLayer } from "./brand-layer";

export type { BrandUnderstandingInput, BrandUnderstandingResult } from "./understanding-extension";
export { buildBrandUnderstanding } from "./understanding-extension";

export type { BrandMemoryInput, BrandMemoryResult } from "./memory-extension";
export { loadBrandMemory, persistValidatedBrandKnowledge } from "./memory-extension";
