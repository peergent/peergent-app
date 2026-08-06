/** Production campaign execution identity — Sprint 9.5. */

export type CampaignExecutionStage =
  | "pending"
  | "research"
  | "reasoning"
  | "marketing_intelligence"
  | "strategy"
  | "planning"
  | "creative"
  | "validation"
  | "scheduling"
  | "executive_briefing"
  | "campaign_approval"
  | "publication"
  | "memory_update"
  | "completed";

export type CampaignRunStatus =
  | "idle"
  | "running"
  | "waiting_approval"
  | "publication_pending"
  | "completed"
  | "failed";

export type CampaignRunState = {
  readonly campaignRunId: string;
  readonly status: CampaignRunStatus;
  readonly currentStage: CampaignExecutionStage;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly idempotencyKey: string;
  readonly continuationInFlight?: boolean;
  readonly continuationStartedAt?: string;
  readonly approvalId?: string;
  readonly organizationId: string;
  readonly peerId: string;
  readonly projectId: string;
  readonly lastStageCompletedAt?: Partial<Record<CampaignExecutionStage, string>>;
  readonly failureCode?: string;
  readonly failureMessageSafe?: string;
};

export type CampaignPublicationStatus =
  | "pending"
  | "approved"
  | "publishing"
  | "published"
  | "failed"
  | "retrying";

export type CampaignPublicationState = {
  readonly status: CampaignPublicationStatus;
  readonly campaignRunId: string;
  readonly approvalId?: string;
  readonly updatedAt: string;
  readonly publishedAt?: string;
  readonly failureCode?: string;
  readonly failureMessageSafe?: string;
  readonly retryCount: number;
  readonly idempotencyKey: string;
};

export const ACTIVE_CAMPAIGN_RUN_STATUSES: readonly CampaignRunStatus[] = [
  "running",
  "publication_pending",
];

export const ACTIVE_PUBLICATION_STATUSES: readonly CampaignPublicationStatus[] = [
  "publishing",
  "retrying",
];

export function isActiveCampaignRunStatus(status: CampaignRunStatus | undefined): boolean {
  if (!status) return false;
  return ACTIVE_CAMPAIGN_RUN_STATUSES.includes(status);
}

export function isActivePublicationStatus(
  status: CampaignPublicationStatus | undefined
): boolean {
  if (!status) return false;
  return ACTIVE_PUBLICATION_STATUSES.includes(status);
}

export const CAMPAIGN_RUN_STALE_MS = 130_000;

export function isCampaignRunStale(run: CampaignRunState | undefined, now = Date.now()): boolean {
  if (!run?.continuationStartedAt || !run.continuationInFlight) return false;
  return now - Date.parse(run.continuationStartedAt) > CAMPAIGN_RUN_STALE_MS;
}
