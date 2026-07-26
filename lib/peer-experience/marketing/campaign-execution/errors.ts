/** Typed errors for campaign execution application — no raw storage leakage. */

export class CampaignExecutionApplicationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CampaignExecutionApplicationError";
    this.code = code;
  }
}

export class CampaignExecutionApplicationNotFoundError extends CampaignExecutionApplicationError {
  constructor(kind: "campaign" | "project", id: string) {
    super(
      "CAMPAIGN_EXECUTION_APPLICATION_NOT_FOUND",
      `${kind === "campaign" ? "Campaign" : "Project"} "${id}" was not found.`
    );
    this.name = "CampaignExecutionApplicationNotFoundError";
  }
}

export class CampaignExecutionApplicationScopeMismatchError extends CampaignExecutionApplicationError {
  constructor(message: string) {
    super("CAMPAIGN_EXECUTION_APPLICATION_SCOPE_MISMATCH", message);
    this.name = "CampaignExecutionApplicationScopeMismatchError";
  }
}

export class CampaignExecutionApplicationBlockedResultError extends CampaignExecutionApplicationError {
  constructor() {
    super(
      "CAMPAIGN_EXECUTION_APPLICATION_BLOCKED_RESULT",
      "Blocked execution results cannot be applied."
    );
    this.name = "CampaignExecutionApplicationBlockedResultError";
  }
}

export class CampaignExecutionApplicationUnsupportedOperationError extends CampaignExecutionApplicationError {
  constructor(type: string) {
    super(
      "CAMPAIGN_EXECUTION_APPLICATION_UNSUPPORTED_OPERATION",
      `Unsupported campaign execution operation type "${type}".`
    );
    this.name = "CampaignExecutionApplicationUnsupportedOperationError";
  }
}

export class CampaignExecutionApplicationUnresolvedWorkUnitError extends CampaignExecutionApplicationError {
  constructor(ref: string) {
    super(
      "CAMPAIGN_EXECUTION_APPLICATION_UNRESOLVED_WORK_UNIT",
      `Could not resolve work unit reference "${ref}".`
    );
    this.name = "CampaignExecutionApplicationUnresolvedWorkUnitError";
  }
}

export class CampaignExecutionApplicationDuplicateWorkUnitError extends CampaignExecutionApplicationError {
  constructor(operationId: string) {
    super(
      "CAMPAIGN_EXECUTION_APPLICATION_DUPLICATE_WORK_UNIT",
      `Work unit for operation "${operationId}" already exists.`
    );
    this.name = "CampaignExecutionApplicationDuplicateWorkUnitError";
  }
}

export class CampaignExecutionApplicationInvalidStatusTransitionError extends CampaignExecutionApplicationError {
  constructor(message: string) {
    super("CAMPAIGN_EXECUTION_APPLICATION_INVALID_STATUS_TRANSITION", message);
    this.name = "CampaignExecutionApplicationInvalidStatusTransitionError";
  }
}

export class CampaignExecutionApplicationPersistenceFailureError extends CampaignExecutionApplicationError {
  readonly causeLabel: string;

  constructor(causeLabel: string) {
    super(
      "CAMPAIGN_EXECUTION_APPLICATION_PERSISTENCE_FAILURE",
      "Campaign execution could not be persisted safely."
    );
    this.name = "CampaignExecutionApplicationPersistenceFailureError";
    this.causeLabel = causeLabel;
  }
}
