import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type {
  CampaignApprovalHistoryMap,
  CampaignApprovalMap,
  CampaignApprovalRecord,
  CampaignPackageVersion,
} from "./campaign-approval-types";
import { isCampaignApprovalValid } from "./campaign-approval-validation";

export type ApplyCampaignApprovalInput = {
  readonly organizationId: string;
  readonly peerId: string;
  readonly projectId: string;
  readonly approvalMode: CampaignApprovalMode;
  readonly packageVersion: CampaignPackageVersion;
  readonly approvedBy: string;
  readonly approvedAt: string;
};

export function applyCampaignApproval(
  input: ApplyCampaignApprovalInput,
  ctx: {
    approvals: CampaignApprovalMap;
    history: CampaignApprovalHistoryMap;
  },
  persist: (next: { approvals: CampaignApprovalMap; history: CampaignApprovalHistoryMap }) => void
): {
  ok: boolean;
  status: "approved" | "already_approved" | "invalid";
  approval?: CampaignApprovalRecord;
  message: string;
} {
  const existing = ctx.approvals[input.projectId];
  if (existing && isCampaignApprovalValid(existing, input.packageVersion)) {
    return {
      ok: true,
      status: "already_approved",
      approval: existing,
      message: "This campaign package is already approved.",
    };
  }

  const approval: CampaignApprovalRecord = {
    id: `campaign-approval-${input.projectId}-${Date.now()}`,
    organizationId: input.organizationId,
    peerId: input.peerId,
    projectId: input.projectId,
    campaignContextVersion: input.packageVersion.campaignContextVersion,
    brainOutputVersion: input.packageVersion.brainOutputVersion,
    briefingVersion: input.packageVersion.briefingVersion,
    campaignPackageVersion: input.packageVersion.campaignPackageVersion,
    approvalMode: input.approvalMode,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
  };

  const nextApprovals: CampaignApprovalMap = {
    ...ctx.approvals,
    [input.projectId]: approval,
  };
  const priorHistory = ctx.history[input.projectId] ?? [];
  const nextHistory: CampaignApprovalHistoryMap = {
    ...ctx.history,
    [input.projectId]: [...priorHistory, approval],
  };

  persist({ approvals: nextApprovals, history: nextHistory });

  return {
    ok: true,
    status: "approved",
    approval,
    message: "Campaign approved. Emma will continue automatically.",
  };
}
