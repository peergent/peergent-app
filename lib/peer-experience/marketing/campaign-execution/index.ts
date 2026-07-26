export { applyCampaignExecutionResult } from "./apply-campaign-execution-result";

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
