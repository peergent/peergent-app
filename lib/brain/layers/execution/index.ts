export {
  EXECUTION_LAYER_VERSION,
  type ExecutionStatus,
  type ExecutionPublicationMode,
  type ExecutionProviderId,
  type ProviderHealthStatus,
  type ExecutionFailureClass,
  type ExecutionApprovalState,
  type ExecutionValidationState,
  type ExecutionProviderCapabilities,
  type ExecutionTarget,
  type ExecutionPayload,
  type ExecutionProvider,
  type ExecutionContext,
  type ExecutionInstruction,
  type ExecutionPriorMetadata,
  type ExecutionReceipt,
  type ExecutionFailure,
  type ExecutionAttempt,
  type ExecutionEventType,
  type ExecutionEvent,
  type ExecutionAuditRecord,
  type ExecutionResult,
  type ExecutionHistoryEntry,
  type ExecutionHistory,
  type ExecutionBrainInput,
  type ExecutionBrainOutput,
  type ExecutionBrainPayload,
} from "./types";

export type { ExecutionProviderAdapter, ProviderAdapterContext } from "./execution-provider-adapter";
export {
  buildStubProviderReceipt,
  channelToProvider,
  buildPayloadFromDeliverable,
  defaultDestination,
} from "./execution-provider-adapter";

export {
  ExecutionProviderRegistry,
  createExecutionProviderRegistry,
  getDefaultExecutionProviderRegistry,
  resetDefaultExecutionProviderRegistry,
} from "./execution-provider-registry";

export {
  validateExecutionInput,
  validateInstruction,
  assertProviderEvidence,
  containsForbiddenSecrets,
  isExecutableValidationState,
} from "./execution-validator";

export { lookupIdempotentExecution, canRetryIdempotency } from "./execution-idempotency";
export {
  classifyFailure,
  statusFromFailure,
  aggregateOverallStatus,
  DEFAULT_MAX_ATTEMPTS,
} from "./execution-retry-policy";
export { createExecutionAuditRecord, appendAuditRecord } from "./execution-audit";
export { createExecutionEvent, eventsForResult, resetExecutionEventCounter } from "./execution-events";

export type { ExecutionRepository, ExecutionStoreRecord } from "./execution-repository";
export {
  InMemoryExecutionRepository,
  getDefaultExecutionRepository,
  resetDefaultExecutionRepository,
} from "./execution-repository";

export { buildExecutionHistory, classifyRollback } from "./build-execution-history";
export type { RollbackClassification } from "./build-execution-history";
export { mapExecutionToBrainOutput } from "./map-execution-to-output";
export { ExecutionLayer, createExecutionLayer, collectExecutionHistory } from "./execution-layer";
export {
  ExecutionBrainExecutor,
  createExecutionBrainExecutor,
  executionBrainContract,
  createFromBrainInputs,
} from "./execution-brain-executor";

export { buildInstructionFromDeliverable } from "./adapters/stub-adapters";
