import type { CampaignPublicationStatus } from "./campaign-run-types";

const ALLOWED_TRANSITIONS: Record<
  CampaignPublicationStatus,
  readonly CampaignPublicationStatus[]
> = {
  pending: ["approved"],
  approved: ["publishing"],
  publishing: ["published", "failed"],
  published: [],
  failed: ["retrying"],
  retrying: ["published", "failed"],
};

export function canTransitionPublicationStatus(
  from: CampaignPublicationStatus,
  to: CampaignPublicationStatus
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertPublicationTransition(
  from: CampaignPublicationStatus,
  to: CampaignPublicationStatus
): void {
  if (!canTransitionPublicationStatus(from, to)) {
    throw new Error(`Invalid publication transition: ${from} → ${to}`);
  }
}

export function initialCampaignPublicationStatus(input: {
  hasApproval: boolean;
}): CampaignPublicationStatus {
  return input.hasApproval ? "approved" : "pending";
}

export function isPublicationTerminal(status: CampaignPublicationStatus): boolean {
  return status === "published";
}

export function isPublicationRetryable(status: CampaignPublicationStatus): boolean {
  return status === "failed";
}
