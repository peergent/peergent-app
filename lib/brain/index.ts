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
