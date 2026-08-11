/* Project Brain — shared intelligence foundation (Sprint 1) */

export type { BrainEnvironment } from "./domain/environment";
export { BRAIN_ENVIRONMENTS, isBrainEnvironment } from "./domain/environment";

export type { BrainProvenanceKind, BrainProvenanceRef } from "./domain/provenance";
export type { BrainConfidence } from "./domain/confidence";

export type { BrainRunContext } from "./context/run-context";
export type { BrainSnapshot, BrainSnapshotRef, BrainSnapshotFact } from "./context/snapshot";
export { emptyBrainSnapshot, emptyBrainSnapshotRef } from "./context/snapshot";
export {
  resolveBrainEnvironment,
  assertDemoEnvironmentOnly,
  assertEnvironmentAllowsLiveAccess,
  BrainEnvironmentIsolationError,
} from "./context/resolve-environment";

export type {
  BrainCapabilityId,
  BrainCapabilityDefinition,
  BrainSnapshotSliceKey,
  BrainCostClass,
  BrainFreshnessPolicy,
  BrainApprovalRequirement,
} from "./capabilities/registry";
export {
  BRAIN_CAPABILITY_DEFINITIONS,
  getBrainCapability,
  listBrainCapabilities,
  isCapabilityAllowedInEnvironment,
} from "./capabilities/registry";

export {
  WORKFLOW_STEP_BRAIN_MODULES,
  WORKFLOW_STEP_CAPABILITIES,
  capabilitiesForWorkflowStep,
  LEGACY_MODULE_TO_CAPABILITY,
} from "./capabilities/workflow-map";
export type { LegacyBrainModuleId } from "./capabilities/workflow-map";

export type {
  BrainFinding,
  BrainDecision,
  BrainRecommendation,
  BrainActionProposal,
  BrainExecutionResult,
  BrainWarning,
  BrainError,
  BrainStructuredOutput,
} from "./evidence/structured-output";
export { emptyBrainStructuredOutput } from "./evidence/structured-output";

export type {
  BrainRunStatus,
  BrainUsageMetadata,
  BrainRunBudget,
  BrainRun,
} from "./runtime/run-lifecycle";
export { BRAIN_RUN_STATUSES, isTerminalBrainRunStatus } from "./runtime/run-lifecycle";

export type {
  BrainCapabilityModule,
  BrainCapabilityModuleRegistry,
} from "./runtime/module-registry";
export {
  assertOrganizationScoped,
  BrainOrganizationIsolationError,
} from "./runtime/module-registry";

export type {
  BrainExecutionMode,
  BrainPolicyDecision,
  BrainApprovalContext,
  BrainPolicyResult,
} from "./policy/approval-policy";
export { evaluateBrainPolicy } from "./policy/approval-policy";

export type {
  BrainExecutionPhase,
  BrainExecutionPipelineState,
} from "./execution/pipeline";
export { createExecutionPipelineState } from "./execution/pipeline";

export type { BrainTokenBudget, BrainContextProjection } from "./providers/token-strategy";
export {
  createTokenBudget,
  projectContextBudget,
  hashContextSlices,
} from "./providers/token-strategy";

export type { BrainCacheEntry, BrainCacheGetOptions, BrainCacheStore } from "./cache/store";
export { InMemoryBrainCacheStore, buildCacheKey } from "./cache/store";

export type {
  BrainMemoryScope,
  BrainMemoryReviewState,
  BrainMemoryCandidate,
} from "./memory/candidate";
export { isMemoryExpired } from "./memory/candidate";

export type { BrainAuditRecord, BrainAuditTrace } from "./audit/record";

export type {
  BrainHealthStatus,
  BrainHealth,
  BrainRunSummary,
  BrainSourceHealth,
} from "./admin/read-models";

export type { BrainCapabilityProvider } from "./providers/provider-interface";
export { DemoBrainCapabilityProvider, createDemoBrainProvider } from "./demo/demo-provider";

export type { CampaignEvidencePresentation } from "./presentation/campaign-evidence-adapter";
export { presentBrainOutputForCampaign } from "./presentation/campaign-evidence-adapter";

/* Brain Output Layer — customer intelligence derived from structured brain outputs */
export type {
  CampaignBrainOutput,
  WorkspaceBrainOutput,
  ExecutiveSummary,
  BusinessIntelligence,
  BrainOutputRecommendation,
  LiveActivityEvent,
  ProgressNarrative,
} from "./output";
export {
  resolveCampaignBrainOutput,
  resolveWorkspaceBrainOutput,
  buildCampaignBrainOutput,
  publishBusinessIntelligence,
  publishExecutiveSummary,
} from "./output";

/* PX-34 — Project Engine (Brain Orchestrator) */

export type {
  ProjectLifecycleState,
  ProjectBrainId,
  ProjectEngineSnapshot,
  ProjectEngineEvaluation,
  ProjectEngineAction,
  ProjectEngineEvent,
  ProjectBrainContract,
  ProjectBrainRegistry,
  BrainContextPackage,
  BrainResultSummary,
} from "./project-engine";

export {
  PROJECT_ENGINE_VERSION,
  DEFAULT_BRAIN_PIPELINE,
  createProjectEngineSnapshot,
  evaluateProjectEpisode,
  advanceProjectEpisode,
  projectEngineEvaluate,
  assembleBrainContext,
  projectSnapshotFromCampaignRun,
  isEngineBlocked,
  canTransitionProjectState,
  capabilitiesForBrain,
} from "./project-engine";

/* Sprint 2 — Company & Website Intelligence */

export type { FreshnessState, FreshnessMetadata } from "./domain/freshness";
export { resolveFreshness } from "./domain/freshness";

export type {
  CompanyFactSource,
  CompanyProfileField,
} from "./company/source-priority";
export {
  COMPANY_FACT_SOURCE_PRIORITY,
  sourcePriorityRank,
  winningSource,
  fieldFromValue,
  fieldFromListValue,
  emptyCompanyField,
} from "./company/source-priority";

export type { CompanyProfile } from "./company/profile";
export { emptyCompanyProfile } from "./company/profile";

export type { CustomerCorrection } from "./company/corrections";
export { applyCorrectionToFieldValue } from "./company/corrections";

export type { CompanySnapshot, CompanySnapshotBuilderInput } from "./company/snapshot";
export { CompanySnapshotBuilder, buildCompanySnapshot } from "./company/snapshot-builder";

export type { WebsiteState } from "./website/states";
export { WEBSITE_STATES } from "./website/states";

export type {
  WebsiteSnapshot,
  WebsitePage,
  WebsiteFinding,
  WebsiteIssue,
  WebsiteOpportunity,
} from "./website/types";

export type { WebsiteScanPipeline, WebsiteScanPipelinePhase } from "./website/pipeline";
export { WEBSITE_SCAN_PIPELINE } from "./website/pipeline";

export { buildSimulatedWebsiteSnapshot } from "./website/simulated-snapshot";

export { executeCompanyUnderstanding } from "./capabilities/company-understanding";
export { executeWebsiteUnderstanding } from "./capabilities/website-understanding";

export {
  buildPeergentCompanyProfile,
  buildPeergentWebsiteSnapshot,
  PEERGENT_DEMO_ORG_ID,
} from "./demo/peergent-company-profile";

export {
  getDemoWebsiteSnapshot,
  setDemoWebsiteSnapshot,
  buildAndStoreDemoWebsiteSnapshot,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshot,
} from "./demo/demo-intelligence-store";

export { resolveCompanyIntelligence, resolveOrganizationId } from "./integration/resolve-company-intelligence";
export {
  resolveCompanyIntelligenceAsync,
  resolveCompanyIntelligenceLegacy,
} from "./integration/resolve-company-intelligence";
export { buildBrainStepEvidence, buildBrainStepEvidenceAsync } from "./integration/build-brain-step-evidence";

/* Sprint 3 — Context Assembly */

export type {
  ContextAssemblyResult,
  ContextAssemblyWarning,
  ContextAssemblyIssue,
  ContextAssemblyState,
  ContextAssemblySource,
} from "./context/assembly-types";

export type { CompanyContextAssemblerInput } from "./context/company-context-assembler";
export {
  CompanyContextAssembler,
  companyContextAssembler,
  assembleCompanyContext,
  assembleCompanyContextSync,
  formatMissingInformationMessage,
} from "./context/company-context-assembler";

export type {
  ReadinessDimension,
  ReadinessScore,
  ContextReadinessReport,
} from "./context/readiness";
export {
  buildReadinessReport,
  readinessNeedsMoreInfo,
  scoreCompanyProfile,
  scoreWebsite,
} from "./context/readiness";

export type {
  MissingInformationPriority,
  MissingInformationItem,
} from "./context/missing-information";
export { detectMissingInformation } from "./context/missing-information";

export type { SnapshotVersionMetadata } from "./context/snapshot-versioning";
export { buildSnapshotVersionMetadata, bumpSnapshotVersion } from "./context/snapshot-versioning";

export type {
  ContextAssemblyAuditEntry,
  ContextAssemblyAuditTrace,
} from "./context/assembly-audit";
export { createAssemblyAuditTrace } from "./context/assembly-audit";

export { buildBrainSnapshotFromCompany } from "./context/brain-snapshot-builder";
export { resolveContextFreshness } from "./context/freshness-resolver";

export type { InvalidationNode, InvalidationEvent, ContextHashSlice } from "./invalidation/dependency-graph";
export {
  INVALIDATION_DEPENDENCIES,
  resolveInvalidationCascade,
  invalidationForCorrection,
  createInvalidationEvent,
  CONTEXT_HASH_SLICES,
  slicesForInvalidationTrigger,
} from "./invalidation/dependency-graph";

export type {
  WebsiteFetchRequest,
  WebsiteFetchResult,
  WebsiteExtractionResult,
  WebsiteNormalizationResult,
  WebsiteSnapshotResult,
  WebsiteScanExecutor,
  WebsiteExecutionPhase,
} from "./website/execution-types";
export { WEBSITE_EXECUTION_PHASES } from "./website/execution-types";

export type { WebsiteProvider, WebsiteProviderScanInput } from "./website/providers/website-provider";
export {
  DemoWebsiteProvider,
  createDemoWebsiteProvider,
  buildDemoWebsiteSnapshotSync,
} from "./website/providers/demo-website-provider";

export {
  DemoWebsiteScanExecutor,
  createDemoWebsiteScanExecutor,
} from "./website/website-scan-executor";

export {
  applyCorrectionToListValue,
  defaultInvalidationsForField,
} from "./company/corrections";

export {
  buildAndStoreDemoWebsiteSnapshotSync,
  seedPeergentDemoWebsiteSnapshotSync,
} from "./demo/demo-intelligence-store";

export type {
  CompanyReadinessReadModel,
  WebsiteFreshnessReadModel,
  SnapshotVersionReadModel,
  InvalidationQueueReadModel,
  CapabilityReadinessReadModel,
  AssemblyAuditReadModel,
} from "./admin/assembly-read-models";

export type {
  CompanyHealth,
  WebsiteHealth,
  IntelligenceFreshnessReport,
  CapabilityReadiness,
} from "./admin/intelligence-read-models";

export type {
  WebsiteChangeEvent,
  CacheInvalidationTrigger,
} from "./change-detection/contracts";
export { WEBSITE_CHANGE_AFFECTED_CAPABILITIES } from "./change-detection/contracts";

/* Sprint 4 — Brain Runtime */

export type { BrainRunRequest, BrainRuntimeBudgetLimits, BrainRunRequestWithBudget } from "./runtime/run-request";
export type { BrainRunResult, BrainRunSubmitResult } from "./runtime/run-result";
export type { BrainRuntimeDeps } from "./runtime/brain-runtime";
export { BrainRuntime, createBrainRuntime } from "./runtime/brain-runtime";

export {
  BrainRuntimeError,
  BrainRunTransitionError,
  BrainRunNotFoundError,
  BrainRunBudgetExceededError,
  BrainRunReadinessError,
  BrainOutputValidationError,
  BrainRunIsolationError,
} from "./runtime/errors";

export { assertValidTransition, canTransition, transitionStatus } from "./runtime/state-machine";

export type {
  BrainRunRecord,
  BrainRunRepository,
  BrainOutputRepository,
  BrainAuditRepository,
  BrainIdempotencyRepository,
} from "./runtime/repositories/contracts";
export { InMemoryBrainRunRepository } from "./runtime/repositories/in-memory-run-repository";
export { InMemoryBrainOutputRepository } from "./runtime/repositories/in-memory-output-repository";
export { InMemoryBrainAuditRepository } from "./runtime/repositories/in-memory-audit-repository";
export { InMemoryBrainIdempotencyRepository } from "./runtime/repositories/in-memory-idempotency-repository";

export type { CapabilityExecutionRequirements, ReadinessGateResult } from "./runtime/readiness-gate";
export {
  getCapabilityExecutionRequirements,
  evaluateReadinessGate,
  capabilityContextSlices,
} from "./runtime/readiness-gate";

export type { ProjectedBrainContext } from "./runtime/context-projection";
export { projectBrainContext, buildCacheKeyParts } from "./runtime/context-projection";

export type { BudgetValidationResult } from "./runtime/budget-validator";
export {
  validateRuntimeBudget,
  assertBudgetAllowed,
  createRunBudget,
  recordZeroProviderUsage,
} from "./runtime/budget-validator";

export {
  validateBrainStructuredOutput,
  assertValidBrainOutput,
  outputHasCustomerExplanation,
} from "./runtime/output-validator";

export type { ProviderSelectionResult } from "./runtime/provider-selector";
export { selectBrainProvider } from "./runtime/provider-selector";

export type { BrainRunAuditMetadata } from "./runtime/audit-builder";
export { buildRunAuditRecord, buildRunAuditMetadata } from "./runtime/audit-builder";

export {
  createDefaultBrainRuntime,
  getDefaultBrainRuntime,
  resetDefaultBrainRuntime,
  createBrainRuntimeWithAssembly,
  createLiveBrainRuntime,
} from "./integration/brain-runtime-factory";

export {
  executeBrainForWorkflowStep,
  executeBrainForWorkflowStepSync,
  primaryCapabilityForWorkflowStep,
} from "./integration/execute-brain-for-workflow-step";

export type { CapabilityExecutionContext, DemoPerformanceMetric, CapabilityExecutionResult } from "./capabilities/execution-context";
export {
  CAPABILITY_DEPENDENCIES,
  CAPABILITY_OPTIONAL_DEPENDENCIES,
  getCapabilityDependencies,
  resolveCapabilityExecutionOrder,
  validateCapabilityDependencyGraphAcyclic,
  dependentsOf,
} from "./capabilities/capability-dependencies";
export { executeBrandUnderstanding } from "./capabilities/brand-understanding";
export { executeCompetitorUnderstanding } from "./capabilities/competitor-understanding";
export { executeStrategy } from "./capabilities/strategy";
export { executeChannelPlanning } from "./capabilities/channel-planning";
export { executeCreativeGeneration } from "./capabilities/creative-generation";
export { executePerformanceInterpretation } from "./capabilities/performance-interpretation";
export { executeOptimization } from "./capabilities/optimization";
export {
  buildCapabilityExecutionContext,
  hashUpstreamOutputVersions,
} from "./integration/build-capability-execution-context";
export {
  validateCapabilityOutputQuality,
  collapseDuplicateFindings,
} from "./capabilities/shared/output-quality";
export type { CapabilityInspectionReadModel, CapabilityDependencyStatus } from "./admin/capability-read-models";
export {
  buildCapabilityInspectionReadModel,
  listCapabilityInspectionReadModels,
  staleDependentsForCapability,
} from "./admin/capability-read-models";

/* Sprint 6 — Persistence & Live Integration */

export type {
  PersistedBrainOutputRecord,
  PersistedSnapshotRecord,
  PersistedIdempotencyRecord,
  PersistedDependencyState,
  InvalidationQueueItem,
  PersistedCacheMetadata,
  PersistedApprovalRecord,
  BrainRecoveryClassification,
  BrainRecoveryAssessment,
  UpstreamOutputResolution,
  StoredMemoryCandidate,
} from "./persistence/types";

export type {
  AsyncBrainRunRepository,
  AsyncBrainOutputRepository,
  AsyncBrainAuditRepository,
  AsyncBrainIdempotencyRepository,
  BrainSnapshotRepository,
  CustomerCorrectionRepository,
  BrainMemoryCandidateRepository,
  BrainDependencyStateRepository,
  BrainInvalidationQueueRepository,
  BrainCacheMetadataRepository,
  BrainApprovalRepository,
  AsyncBrainRepositories,
  RepositoryStorageMode,
} from "./persistence/contracts";

export {
  createPersistentInMemoryRepositories,
  resetPersistentBrainStores,
} from "./persistence/in-memory-persistent-repositories";

export {
  createBrainRepositories,
  assertLiveNeverUsesDemoStorage,
  assertDemoNeverUsesLiveStorage,
  resetBrainRepositoryStores,
  resolveRepositoryStorageMode,
} from "./persistence/repository-factory";

export type { BrainRepositoryBundle } from "./persistence/repository-factory";
export { BrainInvalidationService } from "./persistence/invalidation-service";
export { UpstreamOutputResolver } from "./persistence/upstream-output-resolver";
export { classifyBrainRunRecovery } from "./persistence/run-recovery";
export { logBrainOperation } from "./persistence/brain-logger";
export { assembleLiveCompanyContext } from "./integration/live-company-intelligence";
export type { LiveCompanyIntelligenceInput } from "./integration/live-company-intelligence";

export {
  getBrainRunDetail,
  listBrainRuns,
  getBrainRuntimeHealth,
  getCapabilityHealth,
  getCompanyReadiness,
  getWebsiteFreshness,
  listInvalidations,
  listMemoryCandidates,
  getPersistentOutputLineage,
  toCustomerSafeRunSummary,
} from "./admin/persistence-read-models";

/* Sprint 7 — Generic LLM layer */

export { isBrainUseOpenAIEnabled, BRAIN_FEATURE_FLAGS } from "./config/brain-feature-flags";
export { createLlmBrainProvider } from "./providers/llm-brain-provider";
export { isBrainProviderWithUsage } from "./providers/provider-usage";
export { createBrainLlmClient } from "./llm/client";
export { createLlmRequest } from "./llm/request";
export { strategyPromptBuilder, StrategyPromptBuilder } from "./prompts/strategy-prompt-builder";
export { buildStrategyProjectedContext } from "./prompts/projected-context";
export {
  validateStrategyLlmPayload,
  mapStrategyPayloadToBrainOutput,
} from "./llm/response-validator";
export {
  registerBrainLlmProvider,
  getBrainLlmProvider,
  getDefaultBrainLlmProvider,
  resetBrainLlmProviderRegistry,
} from "./llm/provider-registry";
export { resetPromptContextCache } from "./llm/prompt-cache";
export { recordProviderUsage } from "./runtime/budget-validator";
export type { BrainLlmProvider } from "./llm/provider";
export type { BrainLlmRequest, BrainLlmResponse, BrainLlmUsage } from "./llm/types";
export {
  BrainLlmError,
  BrainLlmValidationError,
  BrainLlmParseError,
  BrainLlmMissingKeyError,
} from "./llm/errors";

/* Sprint 8 — Research Layer */

export {
  RESEARCH_LAYER_VERSION,
  RESEARCH_CONFIDENCE,
  emptyResearchGraph,
  createResearchEvidence,
  createResearchUnknown,
  buildResearchGraph,
  researchGraphHasProvenance,
  RESEARCH_MODULE_SPECS,
  getResearchModuleSpec,
  ResearchLayer,
  createResearchLayer,
  collectResearchGraph,
  InMemoryResearchRepository,
  getDefaultResearchRepository,
  resetDefaultResearchRepository,
  resetResearchEvidenceCounter,
  resetResearchUnknownCounter,
} from "./layers/research";

export type {
  ResearchGraph,
  ResearchEvidence,
  ResearchUnknown,
  ResearchSource,
  ResearchSourceKind,
  ResearchModuleSpec,
  ResearchRepository,
  ResearchLayerInput,
  ResearchLayerResult,
  BuildResearchGraphInput,
  ResearchBrainGraph,
  ResearchBrainInput,
  ResearchBrainOutput,
  ResearchBrainPayload,
  ResearchPlan,
  ResearchFinding,
  ResearchBrainRepository,
  CompanyUpdateProposal,
  CompetitorProfile,
} from "./layers/research";

/* PX-41 — Research Brain */

export {
  RESEARCH_BRAIN_VERSION,
  buildResearchPlan,
  buildResearchBrainGraph,
  validateResearchBrainGraph,
  mapResearchGraphToStructuredOutput,
  ResearchBrainLayer,
  createResearchBrainLayer,
  collectResearchBrainGraph,
  researchBrainContract,
  createResearchBrainExecutor,
  getDefaultResearchBrainRepository,
  resetDefaultResearchBrainRepository,
  getDefaultResearchProviderRegistry,
  resetDefaultResearchProviderRegistry,
  enforceConfidenceCeiling,
  buildCompanyUpdateProposals,
  assertNoCompanyMutation,
} from "./layers/research";

/* Sprint 9 — Reasoning Layer */

export {
  REASONING_LAYER_VERSION,
  emptyReasoningGraph,
  createReasoningNode,
  buildReasoningGraph,
  reasoningGraphHasEvidenceChain,
  REASONING_MODULE_SPECS,
  getReasoningModuleSpec,
  ReasoningLayer,
  createReasoningLayer,
  collectReasoningGraph,
  InMemoryReasoningRepository,
  getDefaultReasoningRepository,
  resetDefaultReasoningRepository,
  resetReasoningNodeCounter,
  deriveReasoningConfidence,
} from "./layers/reasoning";

export type {
  ReasoningGraph,
  ReasoningNode,
  ReasoningPattern,
  ReasoningContradiction,
  ReasoningUnknown,
  ReasoningOpportunity,
  ReasoningRisk,
  ReasoningModuleSpec,
  ReasoningRepository,
  ReasoningLayerInput,
  ReasoningLayerResult,
  BuildReasoningGraphInput,
  ReasoningBrainGraph,
  ReasoningBrainInput,
  ReasoningBrainOutput,
  ReasoningBrainPayload,
  ReasoningInterpretation,
  ReasoningBrainRepository,
} from "./layers/reasoning";

/* PX-42 — Reasoning Brain */

export {
  REASONING_BRAIN_VERSION,
  buildReasoningBrainGraph,
  validateReasoningBrainGraph,
  mapReasoningGraphToStructuredOutput,
  ReasoningBrainLayer,
  createReasoningBrainLayer,
  collectReasoningBrainGraph,
  reasoningBrainContract,
  createReasoningBrainExecutor,
  getDefaultReasoningBrainRepository,
  resetDefaultReasoningBrainRepository,
  assertNoStrategyLanguage,
  assertNoCreativeLanguage,
} from "./layers/reasoning";

/* Sprint 9.3 — Marketing Intelligence Layer */

export {
  MARKETING_INTELLIGENCE_LAYER_VERSION,
  buildMarketingIntelligenceGraph,
  buildMarketingIntelligenceThinking,
  MARKETING_INTELLIGENCE_MODULE_SPECS,
  MARKETING_INTELLIGENCE_THINKING_QUESTIONS,
  MarketingIntelligenceLayer,
  createMarketingIntelligenceLayer,
  collectMarketingIntelligenceGraph,
  getDefaultMarketingIntelligenceRepository,
  resetDefaultMarketingIntelligenceRepository,
} from "./layers/marketing-intelligence";

export type {
  MarketingIntelligenceGraph,
  MarketingIntelligenceInsight,
  BuildMarketingIntelligenceInput,
  MarketingIntelligenceLayerInput,
  MarketingIntelligenceLayerResult,
  MarketingIntelligenceModuleSpec,
  MarketingIntelligenceThinkingRecord,
  MarketingIntelligenceThinkingId,
} from "./layers/marketing-intelligence";

export { buildExecutiveCampaignBriefing } from "./presentation/executive-briefing";
export type { ExecutiveCampaignBriefing, ExecutiveBriefingSection } from "./presentation/executive-briefing";

export {
  buildExecutiveReviewNavigation,
  createBriefingFrame,
  createDecisionFrame,
  type ExecutiveReviewFrame,
  type ExecutiveReviewLayer,
  type ExecutiveReviewNavigation,
} from "./presentation/executive-review-disclosure";

/* Sprint 10.2 — Decision Engine */

export {
  DECISION_ENGINE_VERSION,
  buildDecisionsFromStrategyGraph,
  calculateDecisionConfidence,
  decisionConfidenceLabel,
  validateDecision,
  validateDecisionCollection,
  presentDecisionSummary,
  presentDecisionExplainability,
  presentTopDecisions,
  mapDecisionToBrainDecision,
  mapDecisionsToBrainDecisions,
} from "./decision";

export type {
  Decision,
  DecisionCategory,
  DecisionCollection,
  DecisionConfidenceLevel,
  DecisionDependency,
  DecisionCustomerChallenge,
  DecisionPresentationSummary,
  DecisionExplainabilityView,
  DecisionValidationResult,
} from "./decision";

export { finalizeStrategyWithSelfCritique } from "./strategy/strategy-self-critique";
export type { StrategyCritiqueResult } from "./strategy/strategy-self-critique";

/* Sprint 9 — Strategy Layer */

export {
  STRATEGY_GRAPH_VERSION,
  buildStrategyGraph,
  mapStrategyGraphToBrainOutput,
  validateStrategyQuality,
  scoreStrategyQuality,
  executeStrategyWithGraph,
} from "./strategy";

export type {
  StrategyGraph,
  StrategySection,
  StrategyQualityResult,
  BuildStrategyGraphInput,
} from "./strategy";

/* Sprint 10.0 — Brand Brain Layer */

export {
  BRAND_LAYER_VERSION,
  BRAND_CONFIDENCE,
  ALL_BRAND_CONCEPT_IDS,
  BRAND_CONCEPT_DEFINITIONS,
  BRAND_RESEARCH_MODULE_SPECS,
  buildBrandResearchGraph,
  buildBrandGraph,
  buildBrandModel,
  brandResearchGraphHasProvenance,
  brandModelHasConfidence,
  queryBrandFactsByConcept,
  queryBrandFactsByStatus,
  BrandLayer,
  createBrandLayer,
  collectBrandGraph,
  BrandBoundary,
  createBrandBoundary,
  exposeBrandBrainToConsumer,
  InMemoryBrandRepository,
  getDefaultBrandRepository,
  resetDefaultBrandRepository,
  createBrandResearchObservation,
  createBrandResearchUnknown,
  resetBrandObservationCounter,
  resetBrandUnknownCounter,
  resetBrandFactCounter,
  buildBrandUnderstanding,
  persistValidatedBrandKnowledge,
  loadBrandMemory,
} from "./layers/brand";

export type {
  BrandGraph,
  BrandModel,
  BrandResearchGraph,
  BrandResearchObservation,
  BrandFact,
  BrandConceptId,
  BrandKnowledgeStatus,
  BrandBoundaryFact,
  BrandBrainSnapshot,
  BrandBrainConsumer,
  BrandLayerInput,
  BrandLayerResult,
  BuildBrandResearchGraphInput,
  BuildBrandGraphInput,
  BrandRepository,
} from "./layers/brand";

/* Sprint 11.0 — Planning Brain Layer */

export {
  PLANNING_LAYER_VERSION,
  PLANNING_MODULE_SPECS,
  buildPlanningGraph,
  analyzePlanningDependencies,
  assessPlanningReadiness,
  buildPlanningTimeline,
  buildPlanningRisks,
  validatePlanningGraph,
  scorePlanningQuality,
  presentExecutionPlanSummary,
  presentExecutionPlanDetail,
  presentExecutionPlanBriefingSections,
  PlanningLayer,
  createPlanningLayer,
  collectPlanningGraph,
  planFromBrainInputs,
  getDefaultPlanningRepository,
  resetDefaultPlanningRepository,
} from "./layers/planning";

export {
  CAMPAIGN_PLANNING_CAPABILITY_ID,
} from "./planning/campaign-planning-types";

export type {
  PlanningOutputMetadata,
  PlanningBuildResult,
} from "./planning/campaign-planning-types";

export {
  ensureCampaignPlanning,
  readPlanningGraphFromProject,
  readPlanningGraphFromOutputs,
} from "./integration/ensure-campaign-planning";

export { mergeCampaignOutputsWithPlanning } from "./integration/merge-campaign-planning-outputs";

export {
  computePlanningCacheIdentity,
  isStoredCampaignPlanningCompatible,
  readStoredCampaignPlanning,
} from "./planning/planning-cache-identity";

export { mapPlanningGraphToBrainOutput } from "./planning/map-planning-graph-to-output";

export type {
  PlanningGraph,
  PlanningNode,
  PlanningDecision,
  PlanningObjective,
  PlanningReadinessAssessment,
  PlanningReadinessLevel,
  PlanningRisk,
  PlanningTimelineIntent,
  PlanningValidationResult,
  BuildPlanningGraphInput,
  PlanningLayerInput,
} from "./layers/planning";

/* PX-35 — Creative Brain Layer */

export type {
  CreativeGraph,
  CreativeBrainInput,
  CreativeBrainOutput,
  CreativeCampaign,
  CreativeMessaging,
  CreativeChannelPlan,
  CreativeDeliverable,
  CreativeDecision,
  CreativeDirection,
  CreativeThinkingPhase,
} from "./layers/creative";

export {
  CREATIVE_LAYER_VERSION,
  CREATIVE_MODULE_SPECS,
  buildCreativeGraph,
  validateCreativeGraph,
  scoreCreativeQuality,
  mapCreativeGraphToBrainOutput,
  CreativeLayer,
  createCreativeLayer,
  collectCreativeGraph,
  createFromBrainInputs as createCreativeFromBrainInputs,
  CreativeBrainExecutor,
  createCreativeBrainExecutor,
  getDefaultCreativeRepository,
  resetDefaultCreativeRepository,
} from "./layers/creative";

export {
  createDefaultProjectBrainRegistry,
  companyBrainContract,
  creativeBrainContract,
  validationBrainContract,
  memoryBrainContract,
  executionBrainContract,
} from "./integration/creative-brain-registry";

/* PX-40 — Company Brain Layer */

export type {
  CompanyGraph,
  CompanyBrainInput,
  CompanyBrainOutput,
  CompanyOutput,
  CompanyFact,
  CompanyNode,
  CompanyRelation,
  CompanyVersion,
  CompanyKnowledgeSource,
  CompanyDomainId,
  CompanyGraphSnapshot,
  CompanyHistory,
} from "./layers/company";

export {
  COMPANY_LAYER_VERSION,
  COMPANY_DOMAIN_SPECS,
  buildCompanyGraph,
  buildCompanyRelations,
  validateCompanyGraph,
  scoreCompanyQuality,
  mapCompanyGraphToBrainOutput,
  buildCompanyOutput,
  CompanyLayer,
  createCompanyLayer,
  collectCompanyGraph,
  CompanyBrainExecutor,
  createCompanyBrainExecutor,
  createFromBrainInputs as createCompanyFromBrainInputs,
  getDefaultCompanyRepository,
  resetDefaultCompanyRepository,
  createCompanyVersion,
  nextCompanyVersion,
} from "./layers/company";

/* PX-39 — Execution Brain Layer */

export type {
  ExecutionHistory,
  ExecutionBrainInput,
  ExecutionBrainOutput,
  ExecutionInstruction,
  ExecutionReceipt,
  ExecutionFailure,
  ExecutionAttempt,
  ExecutionAuditRecord,
  ExecutionEvent,
  ExecutionStatus,
  ExecutionProviderId,
  ExecutionResult,
} from "./layers/execution";

export {
  EXECUTION_LAYER_VERSION,
  buildExecutionHistory,
  validateExecutionInput,
  validateInstruction,
  assertProviderEvidence,
  mapExecutionToBrainOutput,
  ExecutionLayer,
  createExecutionLayer,
  collectExecutionHistory,
  ExecutionBrainExecutor,
  createExecutionBrainExecutor,
  createFromBrainInputs as createExecutionFromBrainInputs,
  getDefaultExecutionRepository,
  resetDefaultExecutionRepository,
  getDefaultExecutionProviderRegistry,
  resetDefaultExecutionProviderRegistry,
  lookupIdempotentExecution,
  classifyRollback,
  classifyFailure,
  aggregateOverallStatus,
  createExecutionAuditRecord,
  eventsForResult,
  isExecutableValidationState,
} from "./layers/execution";

/* PX-37 — Memory Brain Layer */

export type {
  MemoryGraph,
  MemoryBrainInput,
  MemoryBrainOutput,
  MemoryRecord,
  MemoryNode,
  MemoryRelation,
  MemoryDecision,
  MemorySummary,
  MemorySnapshot,
  MemoryQuery,
  MemoryQueryResult,
  MemoryDomainId,
  MemoryEvidence,
  MemoryEvolutionEntry,
} from "./layers/memory";

export {
  MEMORY_LAYER_VERSION,
  MEMORY_MODULE_SPECS,
  buildMemoryGraph,
  buildMemorySummary,
  validateMemoryGraph,
  scoreMemoryQuality,
  mapMemoryGraphToBrainOutput,
  MemoryLayer,
  createMemoryLayer,
  collectMemoryGraph,
  MemoryBrainExecutor,
  createMemoryBrainExecutor,
  createFromBrainInputs as createMemoryFromBrainInputs,
  MemoryPublisher,
  createMemoryPublisher,
  publishMemoryOutput,
  MemoryRetriever,
  createMemoryRetriever,
  retrieveMemories,
  retrieveRelevantMemories,
  MemoryIndexer,
  indexMemories,
  getDefaultMemoryRepository,
  resetDefaultMemoryRepository,
  memoryMergeKey,
  mergeMemories,
  decideMemoryAction,
} from "./layers/memory";

/* PX-36 — Validation Brain Layer */

export type {
  ValidationGraph,
  ValidationBrainInput,
  ValidationBrainOutput,
  ValidationReport,
  ValidationIssue,
  ValidationCategory,
  ValidationWarning,
  ValidationPass,
  ValidationDecision,
  ValidationScore,
  ValidationSummary,
  PublicationReadiness,
  ValidationDomainId,
} from "./layers/validation";

export {
  VALIDATION_LAYER_VERSION,
  VALIDATION_MODULE_SPECS,
  buildValidationGraph,
  buildValidationSummary,
  validateValidationGraph,
  scoreValidationQuality,
  mapValidationGraphToBrainOutput,
  ValidationLayer,
  createValidationLayer,
  collectValidationGraph,
  ValidationBrainExecutor,
  createValidationBrainExecutor,
  createFromBrainInputs as createValidationFromBrainInputs,
  ValidationPublisher,
  createValidationPublisher,
  publishValidationOutput,
  getDefaultValidationRepository,
  resetDefaultValidationRepository,
} from "./layers/validation";
