import type {
  CampaignApprovalHistoryMap,
  CampaignApprovalMap,
} from "../campaign-approval/campaign-approval-types";

import {
  loadDurableCampaignExecutionState,
  patchDurableCampaignExecutionState,
} from "./durable-campaign-state-store";

/** Persist campaign approval across session reloads and browser restarts. */
export function persistCampaignApprovalDurably(
  peerId: string,
  patch: {
    campaignApprovalByProjectId?: CampaignApprovalMap;
    campaignApprovalHistoryByProjectId?: CampaignApprovalHistoryMap;
  }
): void {
  const durable = loadDurableCampaignExecutionState(peerId);
  patchDurableCampaignExecutionState(peerId, {
    campaignApprovalByProjectId: {
      ...durable.campaignApprovalByProjectId,
      ...(patch.campaignApprovalByProjectId ?? {}),
    },
    campaignApprovalHistoryByProjectId: {
      ...durable.campaignApprovalHistoryByProjectId,
      ...(patch.campaignApprovalHistoryByProjectId ?? {}),
    },
  });
}
