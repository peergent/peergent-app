export { applyCampaignExecutionResult } from "./apply-campaign-execution-result";

export { executeMarketingCampaign } from "./execute-marketing-campaign";
export type { ExecuteMarketingCampaignArgs } from "./execute-marketing-campaign";

export { prepareCampaignExecution } from "./prepare-campaign-execution";
export type { PrepareCampaignExecutionArgs, PreparedCampaignExecution } from "./prepare-campaign-execution";

export {
  collectAppliedCampaignOperationIds,
  createCampaignExecutionWorkspacePersistence,
  mergeProjectsPreservingOthers,
  mergeWorkUnitsPreservingOthers,
} from "./campaign-execution-workspace-persistence";

export type {
  CampaignExecutionWorkspacePersistenceBundle,
  CampaignExecutionWorkspaceStateSnapshot,
} from "./campaign-execution-workspace-persistence";

export type {
  CampaignExecutionWorkspaceNextAction,
  CampaignExecutionWorkspaceResult,
  CampaignExecutionWorkspaceStatus,
} from "./campaign-execution-workspace-result";

export {
  CAMPAIGN_EXECUTION_ACTIVITY_LIMITATION,
  CAMPAIGN_EXECUTION_ACTIVITY_TITLE,
  CampaignExecutionWorkspaceArchivedProjectError,
  CampaignExecutionWorkspaceError,
  CampaignExecutionWorkspaceFeatureDisabledError,
  CampaignExecutionWorkspaceNonCampaignProjectError,
  CampaignExecutionWorkspacePreparationError,
  CampaignExecutionWorkspaceProjectMissingError,
  campaignExecutionWorkspaceResultFromError,
  shouldAppendCampaignExecutionActivity,
} from "./campaign-execution-workspace-result";

export type {
  CampaignExecutionApplicationSource,
  CampaignExecutionPersistencePort,
} from "./campaign-execution-application-source";

export {
  CAMPAIGN_EXECUTOR_OPERATION_ID_RAW_PREFIX,
  extractExecutorOperationIdFromRawRequest,
  rawRequestWithExecutorOperationId,
} from "./campaign-execution-application-source";

export type {
  CampaignExecutionApplicationErrorRecord,
  CampaignExecutionApplicationResult,
  CampaignExecutionApplicationStatus,
} from "./campaign-execution-application-result";

export { CAMPAIGN_EXECUTION_APPLICATION_PARTIAL_WRITE_LIMITATION } from "./campaign-execution-application-result";

export {
  CampaignExecutionApplicationBlockedResultError,
  CampaignExecutionApplicationDuplicateWorkUnitError,
  CampaignExecutionApplicationError,
  CampaignExecutionApplicationInvalidStatusTransitionError,
  CampaignExecutionApplicationNotFoundError,
  CampaignExecutionApplicationPersistenceFailureError,
  CampaignExecutionApplicationScopeMismatchError,
  CampaignExecutionApplicationUnsupportedOperationError,
  CampaignExecutionApplicationUnresolvedWorkUnitError,
} from "./errors";

/* Sprint 9.5 — production campaign run pipeline */

export type {
  CampaignExecutionStage,
  CampaignPublicationState,
  CampaignPublicationStatus,
  CampaignRunState,
  CampaignRunStatus,
} from "./campaign-run-types";
export {
  ACTIVE_CAMPAIGN_RUN_STATUSES,
  ACTIVE_PUBLICATION_STATUSES,
  CAMPAIGN_RUN_STALE_MS,
  isActiveCampaignRunStatus,
  isActivePublicationStatus,
  isCampaignRunStale,
} from "./campaign-run-types";

export {
  buildCampaignContinuationIdempotencyKey,
  createCampaignRunId,
} from "./campaign-run-id";

export type { CampaignExecutionCorrelation } from "./campaign-execution-correlation";
export {
  buildCampaignExecutionCorrelation,
  formatCampaignExecutionCorrelation,
} from "./campaign-execution-correlation";

export type {
  CampaignExecutionTimelineEvent,
  CampaignExecutionTimelineEventKind,
} from "./campaign-execution-timeline";
export {
  appendTimelineEvent,
  campaignExecutionTimelineEventLabel,
  compareTimelineEvents,
  createCampaignExecutionTimelineEvent,
  EXECUTION_TIMELINE_ORDER,
  timelineEventToActivityFeedItem,
} from "./campaign-execution-timeline";

export type { DurableCampaignExecutionState } from "./durable-campaign-state-store";
export {
  loadDurableCampaignExecutionState,
  mergeDurableIntoWorkspaceState,
  patchDurableCampaignExecutionState,
  resetDurableCampaignExecutionStateForTests,
  saveDurableCampaignExecutionState,
} from "./durable-campaign-state-store";

export {
  attachCampaignPublicationToProject,
  attachCampaignRunToProject,
  inferBrainPipelineStagesComplete,
  markCampaignRunStageComplete,
  persistCampaignPublication,
  persistCampaignRun,
  resolveCampaignRunForProject,
} from "./campaign-run-store";

export {
  assertPublicationTransition,
  canTransitionPublicationStatus,
  initialCampaignPublicationStatus,
  isPublicationRetryable,
  isPublicationTerminal,
} from "./publication-state-machine";

export {
  cachePublicationCompletion,
  executeCampaignPublication,
  retryCampaignPublication,
  type CampaignPublicationExecutorInput,
  type CampaignPublicationExecutorResult,
} from "./publication-executor";

export {
  acquireContinuationLock,
  cacheContinuationResult,
  clearContinuationLocksForTests,
  getCachedContinuationResult,
  isContinuationInFlight,
} from "./idempotent-continuation";

export {
  continueCampaignWithExecution,
  seedCampaignPublicationState,
  type ContinueCampaignWithExecutionDeps,
} from "./continue-campaign-with-execution";

export {
  detectRecoverableCampaignExecutions,
  recoverCampaignExecutions,
  type RecoverableCampaignExecution,
} from "./campaign-execution-recovery";

export { persistCampaignApprovalDurably } from "./persist-campaign-approval-durably";
