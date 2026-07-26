/** Typed errors for Campaign Executor — no storage or framework leakage. */

export class CampaignExecutorError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CampaignExecutorError";
    this.code = code;
  }
}

export class CampaignExecutorInvalidOrganizationIdError extends CampaignExecutorError {
  constructor() {
    super("CAMPAIGN_EXECUTOR_INVALID_ORGANIZATION_ID", "organizationId is required.");
    this.name = "CampaignExecutorInvalidOrganizationIdError";
  }
}

export class CampaignExecutorInvalidPeerIdError extends CampaignExecutorError {
  constructor() {
    super("CAMPAIGN_EXECUTOR_INVALID_PEER_ID", "peerId is required.");
    this.name = "CampaignExecutorInvalidPeerIdError";
  }
}

export class CampaignExecutorInvalidCampaignIdError extends CampaignExecutorError {
  constructor() {
    super("CAMPAIGN_EXECUTOR_INVALID_CAMPAIGN_ID", "campaignId is required.");
    this.name = "CampaignExecutorInvalidCampaignIdError";
  }
}

export class CampaignExecutorPlanCampaignMismatchError extends CampaignExecutorError {
  constructor() {
    super(
      "CAMPAIGN_EXECUTOR_PLAN_CAMPAIGN_MISMATCH",
      "executionPlan.campaignId must match source campaignId."
    );
    this.name = "CampaignExecutorPlanCampaignMismatchError";
  }
}

export class CampaignExecutorPlanOrganizationMismatchError extends CampaignExecutorError {
  constructor() {
    super(
      "CAMPAIGN_EXECUTOR_PLAN_ORGANIZATION_MISMATCH",
      "executionPlan.organizationId must match source organizationId."
    );
    this.name = "CampaignExecutorPlanOrganizationMismatchError";
  }
}

export class CampaignExecutorInvalidExecutionOrderError extends CampaignExecutorError {
  constructor(message: string) {
    super("CAMPAIGN_EXECUTOR_INVALID_EXECUTION_ORDER", message);
    this.name = "CampaignExecutorInvalidExecutionOrderError";
  }
}

export class CampaignExecutorMissingDependencyPackageError extends CampaignExecutorError {
  constructor(packageId: string, dependencyId: string) {
    super(
      "CAMPAIGN_EXECUTOR_MISSING_DEPENDENCY_PACKAGE",
      `Work package "${packageId}" depends on missing package "${dependencyId}".`
    );
    this.name = "CampaignExecutorMissingDependencyPackageError";
  }
}

export class CampaignExecutorContradictoryCampaignStatusError extends CampaignExecutorError {
  constructor(message: string) {
    super("CAMPAIGN_EXECUTOR_CONTRADICTORY_CAMPAIGN_STATUS", message);
    this.name = "CampaignExecutorContradictoryCampaignStatusError";
  }
}

export class CampaignExecutorDuplicateOperationIdError extends CampaignExecutorError {
  constructor(operationId: string) {
    super(
      "CAMPAIGN_EXECUTOR_DUPLICATE_OPERATION_ID",
      `Duplicate operation id "${operationId}".`
    );
    this.name = "CampaignExecutorDuplicateOperationIdError";
  }
}

export class CampaignExecutorUnsafeManualOnlyExecutionError extends CampaignExecutorError {
  constructor() {
    super(
      "CAMPAIGN_EXECUTOR_UNSAFE_MANUAL_ONLY",
      "Manual-only approval policy blocks autonomous execution operations."
    );
    this.name = "CampaignExecutorUnsafeManualOnlyExecutionError";
  }
}
