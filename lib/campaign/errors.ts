/** Typed errors for Campaign assembly — no raw dependency payloads in messages. */

export class CampaignAssemblyError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CampaignAssemblyError";
    this.code = code;
  }
}

export class CampaignInvalidOrganizationIdError extends CampaignAssemblyError {
  constructor() {
    super("CAMPAIGN_INVALID_ORGANIZATION_ID", "Campaign source organizationId is required.");
    this.name = "CampaignInvalidOrganizationIdError";
  }
}

export class CampaignOrganizationMismatchError extends CampaignAssemblyError {
  constructor(field: string, expected: string, actual: string) {
    super(
      "CAMPAIGN_ORGANIZATION_MISMATCH",
      `Campaign source ${field} organization "${actual}" does not match "${expected}".`
    );
    this.name = "CampaignOrganizationMismatchError";
  }
}

export class CampaignInvalidTimelineError extends CampaignAssemblyError {
  constructor(message: string) {
    super("CAMPAIGN_INVALID_TIMELINE", message);
    this.name = "CampaignInvalidTimelineError";
  }
}

export class CampaignInvalidBudgetError extends CampaignAssemblyError {
  constructor(message: string) {
    super("CAMPAIGN_INVALID_BUDGET", message);
    this.name = "CampaignInvalidBudgetError";
  }
}

export class CampaignInvalidProgressError extends CampaignAssemblyError {
  constructor(message: string) {
    super("CAMPAIGN_INVALID_PROGRESS", message);
    this.name = "CampaignInvalidProgressError";
  }
}

export class CampaignInvalidCompletionError extends CampaignAssemblyError {
  constructor(role: string, value: number) {
    super(
      "CAMPAIGN_INVALID_COMPLETION",
      `Workforce completion for "${role}" must be between 0 and 100 (received ${value}).`
    );
    this.name = "CampaignInvalidCompletionError";
  }
}

export class CampaignUnsupportedWorkforceRoleError extends CampaignAssemblyError {
  constructor(role: string) {
    super("CAMPAIGN_UNSUPPORTED_WORKFORCE_ROLE", `Unsupported campaign workforce role "${role}".`);
    this.name = "CampaignUnsupportedWorkforceRoleError";
  }
}

export class CampaignContradictoryStatusError extends CampaignAssemblyError {
  constructor(details: string) {
    super("CAMPAIGN_CONTRADICTORY_STATUS", details);
    this.name = "CampaignContradictoryStatusError";
  }
}

export class CampaignInvalidCampaignIdError extends CampaignAssemblyError {
  constructor() {
    super("CAMPAIGN_INVALID_CAMPAIGN_ID", "Campaign source campaignId is required.");
    this.name = "CampaignInvalidCampaignIdError";
  }
}
