/** Typed errors for campaign planning adapters — no storage or framework leakage. */

export class CampaignPlanningError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CampaignPlanningError";
    this.code = code;
  }
}

export class CampaignPlanningMissingProjectError extends CampaignPlanningError {
  constructor(projectId: string) {
    super(
      "CAMPAIGN_PLANNING_MISSING_PROJECT",
      `No marketing project found for id "${projectId}".`
    );
    this.name = "CampaignPlanningMissingProjectError";
  }
}

export class CampaignPlanningArchivedProjectError extends CampaignPlanningError {
  constructor(projectId: string) {
    super(
      "CAMPAIGN_PLANNING_ARCHIVED_PROJECT",
      `Project "${projectId}" is archived and cannot be planned.`
    );
    this.name = "CampaignPlanningArchivedProjectError";
  }
}

export class CampaignPlanningInvalidScopeError extends CampaignPlanningError {
  constructor(message: string) {
    super("CAMPAIGN_PLANNING_INVALID_SCOPE", message);
    this.name = "CampaignPlanningInvalidScopeError";
  }
}

export class CampaignPlanningProjectionError extends CampaignPlanningError {
  constructor(message: string) {
    super("CAMPAIGN_PLANNING_PROJECTION_FAILED", message);
    this.name = "CampaignPlanningProjectionError";
  }
}
