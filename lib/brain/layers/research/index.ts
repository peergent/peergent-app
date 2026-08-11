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

/* PX-41 — Research Brain */

export {
  RESEARCH_BRAIN_VERSION,
  DEFAULT_RESEARCH_BUDGET,
  emptyResearchBrainGraph,
} from "./brain-types";

export type {
  ResearchBrainGraph,
  ResearchBrainInput,
  ResearchBrainOutput,
  ResearchBrainPayload,
  ResearchPlan,
  ResearchObjective,
  ResearchFinding,
  ResearchFindingType,
  ResearchDomainId,
  ResearchSourceRecord,
  ResearchBrainEvidence,
  ResearchCitation,
  ResearchEvidenceRef,
  ResearchComparison,
  ResearchPattern,
  ResearchContradiction,
  ResearchOpportunity,
  ResearchRisk,
  CompanyUpdateProposal,
  CompetitorProfile,
  MarketSignal,
  AudienceInsight,
  PositioningInsight,
  SearchInsight,
  UnresolvedQuestion,
  ResearchSummary,
  ResearchBudget,
  ResearchBudgetState,
  ResearchSnapshot,
  ResearchRun,
  ResearchHistory,
  ResearchHistoryEntry,
  ResearchConfidenceLabel,
  ResearchFreshnessStatus,
  ResearchSourceType,
} from "./brain-types";

export { buildResearchPlan, planQuestionsAnswered, resetResearchPlanCounter } from "./research-plan";

export {
  scoreConfidenceFactors,
  factorsToConfidenceLabel,
  computeFindingConfidence,
  aggregateGraphConfidence,
  enforceConfidenceCeiling,
} from "./research-confidence";

export { freshnessFromDates, computeValidUntil, isFreshEnough } from "./research-freshness";

export type {
  ResearchProvider,
  ResearchProviderCapability,
  ResearchProviderCapabilities,
  ResearchSearchRequest,
  ResearchFetchRequest,
  ResearchProviderResult,
  ResearchProviderContext,
  ResearchProviderEvidenceItem,
} from "./research-provider";

export {
  providerSupports,
  rejectUnsupportedCapability,
} from "./research-provider";

export {
  ResearchProviderRegistry,
  createDefaultResearchProviderRegistry,
  getDefaultResearchProviderRegistry,
  resetDefaultResearchProviderRegistry,
} from "./research-provider-registry";

export { createCompanyContextStubProvider } from "./providers/company-context-stub-provider";

export {
  createResearchSourceRecord,
  createResearchBrainEvidence,
  createResearchCitation,
  providerItemsToEvidence,
  evidenceProvenanceComplete,
  resetResearchBrainEvidenceCounters,
} from "./research-evidence-builder";

export {
  buildCompetitorResearch,
  resetResearchCompetitorCounters,
} from "./research-competitors";

export { buildMarketResearch, resetResearchMarketCounters } from "./research-market";

export { buildAudienceResearch, resetResearchAudienceCounters } from "./research-audience";

export {
  buildPositioningResearch,
  detectReviewContradiction,
  resetResearchPositioningCounters,
} from "./research-positioning";

export {
  buildCompanyUpdateProposals,
  assertNoCompanyMutation,
  resetResearchUpdateProposalCounter,
} from "./research-update-proposals";

export {
  buildResearchBrainGraph,
  researchGraphHasEvidenceChain,
  researchGraphNeverHighConfidenceWithoutEvidence,
  resetResearchGraphRunCounter,
} from "./research-graph";

export type { BuildResearchBrainGraphInput } from "./research-graph";

export { validateResearchBrainGraph } from "./research-validator";
export type { ResearchValidationResult } from "./research-validator";

export { mapResearchGraphToStructuredOutput } from "./map-research-graph-to-output";

export {
  ResearchBrainLayer,
  createResearchBrainLayer,
  collectResearchBrainGraph,
} from "./research-brain-layer";

export { resetResearchBrainLayerCounters } from "./research-brain-layer";

export type { ResearchBrainRepository } from "./research-brain-repository";

export {
  InMemoryResearchBrainRepository,
  getDefaultResearchBrainRepository,
  resetDefaultResearchBrainRepository,
  legacyGraphToRecord,
} from "./research-brain-repository";

export {
  ResearchBrainExecutor,
  createResearchBrainExecutor,
  researchBrainContract,
  testProviderCapabilityRejection,
} from "./research-brain-executor";
