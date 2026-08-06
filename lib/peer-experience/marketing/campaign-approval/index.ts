export type {
  CampaignApprovalHistoryMap,
  CampaignApprovalMap,
  CampaignApprovalRecord,
  CampaignApprovalResult,
  CampaignApprovalResultStatus,
  CampaignPackageVersion,
} from "./campaign-approval-types";

export {
  computeBriefingVersionFromBrainOutputs,
  computeCampaignPackageVersion,
} from "./compute-campaign-package-version";

export {
  isCampaignApprovalPending,
  isCampaignApprovalValid,
  isCampaignPublicationUnlocked,
  resolveCampaignApprovalForProject,
} from "./campaign-approval-validation";

export {
  applyCampaignApproval,
  type ApplyCampaignApprovalInput,
} from "./apply-campaign-approval";

export {
  approveCampaign,
  campaignApprovalAuditDescription,
  type CampaignApprovalHandlerDeps,
  type CampaignApprovalWorkspaceCommit,
  type CampaignApprovalWorkspaceSnapshot,
} from "./approve-campaign";
