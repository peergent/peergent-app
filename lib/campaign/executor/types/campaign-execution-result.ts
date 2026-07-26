import type { CampaignStatus } from "@/lib/campaign/types/campaign";

import type { CampaignExecutionOperation } from "./campaign-execution-operation";

export type CampaignExecutionResultStatus =
  | "executable"
  | "restricted"
  | "blocked"
  | "no_changes";

export type CampaignExecutionRestriction = {
  readonly code: string;
  readonly message: string;
  readonly relatedWorkPackageId?: string;
};

export type CampaignExecutionNextAction = {
  readonly label: string;
  readonly reason: string;
};

export type CampaignExecutionResult = {
  readonly id: string;
  readonly organizationId: string;
  readonly peerId: string;
  readonly campaignId: string;
  readonly sourcePlanId: string;
  readonly sourcePlanVersion: number;
  readonly status: CampaignExecutionResultStatus;
  readonly targetCampaignStatus: CampaignStatus;
  readonly operations: readonly CampaignExecutionOperation[];
  readonly restrictions: readonly CampaignExecutionRestriction[];
  readonly warnings: readonly string[];
  readonly nextActions: readonly CampaignExecutionNextAction[];
  readonly idempotencyKey: string;
  readonly assembledAt: string;
};
