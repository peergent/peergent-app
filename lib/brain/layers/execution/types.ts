/**
 * Execution Brain — canonical types.
 * PX-39. Operational actuator — never thinks, generates, validates, or learns.
 */

import type { CreativeDeliverable, CreativeGraph } from "../creative/types";
import type { PublicationReadiness, ValidationGraph } from "../validation/types";

export const EXECUTION_LAYER_VERSION = "1.0.0";

/** Canonical execution lifecycle states. */
export type ExecutionStatus =
  | "PENDING"
  | "READY"
  | "EXECUTING"
  | "SUCCEEDED"
  | "FAILED"
  | "RETRYABLE"
  | "PARTIALLY_SUCCEEDED"
  | "CANCELLED";

export type ExecutionPublicationMode = "immediate" | "scheduled" | "draft";

export type ExecutionProviderId =
  | "linkedin"
  | "meta"
  | "google_ads"
  | "email"
  | "cms"
  | "crm"
  | "calendar"
  | "stub";

export type ProviderHealthStatus =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "maintenance"
  | "rate_limited";

export type ExecutionFailureClass =
  | "PERMANENT"
  | "RETRYABLE"
  | "AUTHENTICATION"
  | "RATE_LIMITED"
  | "VALIDATION"
  | "PROVIDER_UNAVAILABLE"
  | "UNKNOWN";

export type ExecutionApprovalState = "pending" | "granted" | "rejected";

export type ExecutionValidationState = PublicationReadiness;

/** Provider capability flags — adapters declare what they support. */
export type ExecutionProviderCapabilities = {
  readonly supportsPublishing: boolean;
  readonly supportsScheduling: boolean;
  readonly supportsEditing: boolean;
  readonly supportsDeletion: boolean;
  readonly supportsMedia: boolean;
  readonly supportsVideo: boolean;
  readonly supportsDrafts: boolean;
  readonly supportsRollback: boolean;
  readonly supportsLookup: boolean;
  readonly supportsCancel: boolean;
};

export type ExecutionTarget = {
  readonly provider: ExecutionProviderId;
  readonly destination: string;
  readonly channel: string;
  readonly deliverableId: string;
};

/** Structured payload reference — never stores secrets. */
export type ExecutionPayload = {
  readonly deliverableId: string;
  readonly channel: string;
  readonly headline: string;
  readonly hook: string;
  readonly bodyOutline: string;
  readonly cta: string;
  readonly payloadRef: string;
  readonly mediaRefs: readonly string[];
};

export type ExecutionProvider = {
  readonly id: ExecutionProviderId;
  readonly label: string;
  readonly health: ProviderHealthStatus;
  readonly configRef: string | null;
  readonly capabilities: ExecutionProviderCapabilities;
};

export type ExecutionContext = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly campaignId: string;
  readonly peerId: string;
  readonly episodeId?: string;
  readonly locale: "nl" | "en";
  readonly correlationId: string;
  readonly initiatedBy: string;
  readonly dryRun: boolean;
};

/** Validated instruction — the only input Execution Brain acts on. */
export type ExecutionInstruction = {
  readonly executionId: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly projectId: string;
  readonly organizationId: string;
  readonly peerId: string;
  readonly campaignId: string;
  readonly deliverable: CreativeDeliverable;
  readonly target: ExecutionTarget;
  readonly payload: ExecutionPayload;
  readonly publicationMode: ExecutionPublicationMode;
  readonly scheduleRef: string | null;
  readonly approvalState: ExecutionApprovalState;
  readonly validationState: ExecutionValidationState;
  readonly validationRef: string;
  readonly approvalRef: string | null;
  readonly priorExecutionMetadata: ExecutionPriorMetadata | null;
  readonly createdAt: string;
};

export type ExecutionPriorMetadata = {
  readonly lastAttemptAt: string | null;
  readonly attemptCount: number;
  readonly lastStatus: ExecutionStatus | null;
  readonly lastProviderReceiptId: string | null;
};

/** Provider-confirmed evidence — required for SUCCEEDED. */
export type ExecutionReceipt = {
  readonly id: string;
  readonly executionId: string;
  readonly provider: ExecutionProviderId;
  readonly externalId: string;
  readonly externalUrl: string | null;
  readonly providerTimestamp: string;
  readonly providerStatus: string;
  readonly dryRun: boolean;
  readonly evidenceSummary: string;
};

export type ExecutionFailure = {
  readonly id: string;
  readonly executionId: string;
  readonly provider: ExecutionProviderId;
  readonly failureClass: ExecutionFailureClass;
  readonly message: string;
  readonly retryable: boolean;
  readonly at: string;
};

export type ExecutionAttempt = {
  readonly id: string;
  readonly executionId: string;
  readonly attemptNumber: number;
  readonly status: ExecutionStatus;
  readonly provider: ExecutionProviderId;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly receipt: ExecutionReceipt | null;
  readonly failure: ExecutionFailure | null;
  readonly idempotencyKey: string;
  readonly correlationId: string;
};

export type ExecutionEventType =
  | "execution_requested"
  | "execution_started"
  | "provider_called"
  | "execution_succeeded"
  | "execution_failed"
  | "execution_retryable"
  | "execution_partially_succeeded"
  | "execution_cancelled";

export type ExecutionEvent = {
  readonly id: string;
  readonly type: ExecutionEventType;
  readonly executionId: string;
  readonly at: string;
  readonly provider: ExecutionProviderId | null;
  readonly status: ExecutionStatus;
  readonly summary: string;
  readonly correlationId: string;
};

/** Immutable audit record — never mutated after creation. */
export type ExecutionAuditRecord = {
  readonly id: string;
  readonly executionId: string;
  readonly initiatedBy: string;
  readonly initiatedAt: string;
  readonly provider: ExecutionProviderId;
  readonly payloadRef: string;
  readonly approvalRef: string | null;
  readonly validationRef: string;
  readonly resultStatus: ExecutionStatus;
  readonly receiptId: string | null;
  readonly failureId: string | null;
  readonly rollbackRef: string | null;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly dryRun: boolean;
};

export type ExecutionResult = {
  readonly executionId: string;
  readonly status: ExecutionStatus;
  readonly receipt: ExecutionReceipt | null;
  readonly failure: ExecutionFailure | null;
  readonly attempt: ExecutionAttempt;
};

export type ExecutionHistoryEntry = {
  readonly instruction: ExecutionInstruction;
  readonly status: ExecutionStatus;
  readonly attempts: readonly ExecutionAttempt[];
  readonly receipts: readonly ExecutionReceipt[];
  readonly failures: readonly ExecutionFailure[];
  readonly events: readonly ExecutionEvent[];
  readonly audit: ExecutionAuditRecord;
};

/** Complete execution artifact — persisted brain output. */
export type ExecutionHistory = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId: string;
  readonly projectId: string;
  readonly episodeId?: string;
  readonly createdAt: string;
  readonly validationGraphRef: string;
  readonly creativeGraphRef: string;
  readonly overallStatus: ExecutionStatus;
  readonly entries: readonly ExecutionHistoryEntry[];
  readonly events: readonly ExecutionEvent[];
  readonly auditRecords: readonly ExecutionAuditRecord[];
  readonly dryRun: boolean;
};

export type ExecutionBrainInput = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly peerId: string;
  readonly episodeId?: string;
  readonly locale?: "nl" | "en";
  readonly creativeGraph: CreativeGraph;
  readonly validationGraph: ValidationGraph;
  readonly approvalGranted: boolean;
  readonly approvalRef?: string | null;
  readonly idempotencyKey: string;
  readonly correlationId?: string;
  readonly initiatedBy?: string;
  readonly dryRun?: boolean;
  readonly publicationMode?: ExecutionPublicationMode;
  readonly scheduleRef?: string | null;
  readonly providerOverrides?: Partial<Record<string, ExecutionProviderId>>;
  readonly providerHealthOverrides?: Partial<Record<ExecutionProviderId, ProviderHealthStatus>>;
};

export type ExecutionBrainOutput = {
  readonly history: ExecutionHistory;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
};

export type ExecutionBrainPayload = Omit<
  ExecutionBrainInput,
  "organizationId" | "projectId" | "peerId" | "episodeId" | "locale"
> & {
  readonly creativeGraph?: CreativeGraph | null;
  readonly validationGraph?: ValidationGraph | null;
};
