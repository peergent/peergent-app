import type { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";

export type CampaignReviewWorkspaceHandlers = Pick<
  ReturnType<typeof useMarketingWorkspace>,
  | "handleApproveCampaignReviewItem"
  | "handleRequestCampaignReviewChanges"
  | "handleRejectCampaignReviewItem"
  | "handleReviseCampaignReviewItem"
>;

export function pickCampaignReviewHandlers(
  workspace: ReturnType<typeof useMarketingWorkspace>
): CampaignReviewWorkspaceHandlers {
  return {
    handleApproveCampaignReviewItem: workspace.handleApproveCampaignReviewItem,
    handleRequestCampaignReviewChanges: workspace.handleRequestCampaignReviewChanges,
    handleRejectCampaignReviewItem: workspace.handleRejectCampaignReviewItem,
    handleReviseCampaignReviewItem: workspace.handleReviseCampaignReviewItem,
  };
}

export function assertCampaignReviewHandlers(
  handlers: CampaignReviewWorkspaceHandlers
): handlers is CampaignReviewWorkspaceHandlers {
  return (
    typeof handlers.handleApproveCampaignReviewItem === "function" &&
    typeof handlers.handleRequestCampaignReviewChanges === "function" &&
    typeof handlers.handleRejectCampaignReviewItem === "function" &&
    typeof handlers.handleReviseCampaignReviewItem === "function"
  );
}
