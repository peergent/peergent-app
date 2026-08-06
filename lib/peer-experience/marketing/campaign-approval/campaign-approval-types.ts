import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";

/** Version-locked campaign package approval (Sprint 9.4). */
export type CampaignApprovalRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly peerId: string;
  readonly projectId: string;
  readonly campaignContextVersion: number;
  readonly brainOutputVersion: string;
  readonly briefingVersion: string;
  readonly campaignPackageVersion: string;
  readonly approvalMode: CampaignApprovalMode;
  readonly approvedBy: string;
  readonly approvedAt: string;
};

export type CampaignApprovalMap = Readonly<Record<string, CampaignApprovalRecord>>;

export type CampaignApprovalHistoryMap = Readonly<
  Record<string, readonly CampaignApprovalRecord[]>
>;

export type CampaignPackageVersion = {
  readonly campaignContextVersion: number;
  readonly brainOutputVersion: string;
  readonly briefingVersion: string;
  readonly campaignPackageVersion: string;
};

export type CampaignApprovalResultStatus =
  | "approved"
  | "already_approved"
  | "invalid"
  | "not_ready"
  | "failed";

export type CampaignApprovalResult = {
  readonly ok: boolean;
  readonly status: CampaignApprovalResultStatus;
  readonly projectId: string;
  readonly approval?: CampaignApprovalRecord;
  readonly publicationUnlocked: boolean;
  readonly continuationStarted: boolean;
  readonly message: string;
};
