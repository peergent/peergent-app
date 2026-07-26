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
