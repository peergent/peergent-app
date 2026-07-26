export type CampaignExecutionApplicationStatus =
  | "applied"
  | "partially_applied"
  | "no_changes"
  | "blocked"
  | "failed";

export type CampaignExecutionApplicationErrorRecord = {
  readonly code: string;
  readonly message: string;
};

export type CampaignExecutionApplicationResult = {
  readonly status: CampaignExecutionApplicationStatus;
  readonly campaignId: string;
  readonly executionResultId: string;
  readonly appliedOperationIds: readonly string[];
  readonly skippedOperationIds: readonly string[];
  readonly createdWorkUnitIds: readonly string[];
  readonly updatedWorkUnitIds: readonly string[];
  readonly campaignUpdated: boolean;
  readonly warnings: readonly string[];
  readonly errors: readonly CampaignExecutionApplicationErrorRecord[];
  readonly appliedAt: string;
};

/** Workspace storage is not transactional — callers may see partial writes. */
export const CAMPAIGN_EXECUTION_APPLICATION_PARTIAL_WRITE_LIMITATION =
  "Marketing workspace persistence does not support atomic transactions; partial writes may occur before a critical failure." as const;
