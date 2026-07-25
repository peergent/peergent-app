"use client";

import { useParams } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ContentDetailTab from "@/features/marketing-workspace/details/ContentDetailTab";

export default function TeamPeerContentDetailPage() {
  const params = useParams<{ peerId: string; contentId: string }>();

  return (
    <MarketingPeerPageFrame activeTab="content">
      {({ peerId, domainInput, workspace }) => (
        <ContentDetailTab
          peerId={peerId}
          contentId={params.contentId ?? ""}
          domainInput={domainInput}
          onApprove={(draftId) => workspace.handleDraftStatus(draftId, "approved")}
          onReject={(draftId) => workspace.handleDraftStatus(draftId, "rejected")}
          onSaveContent={workspace.handleSaveApprovalContent}
          onSaveMedia={workspace.handleSaveApprovalMedia}
          onFeedback={workspace.handleApprovalFeedback}
          onApproveAndSchedule={workspace.handleApproveAndSchedule}
          onPublishNow={workspace.handlePublishNowApproval}
          onSendForReview={(draftId) => workspace.handleDraftStatus(draftId, "ready_for_review")}
          publishMessage={workspace.approvalPublishMessage}
        />
      )}
    </MarketingPeerPageFrame>
  );
}
