"use client";

import { Suspense } from "react";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ReviewTab from "@/features/marketing-workspace/tabs/ReviewTab";

function ReviewPageInner() {
  return (
    <MarketingPeerPageFrame activeTab="review">
      {({ peerId, domainInput, workspace }) => (
        <ReviewTab
          peerId={peerId}
          domainInput={domainInput}
          onApprove={(draftId) => workspace.handleDraftStatus(draftId, "approved")}
          onReject={(draftId) => workspace.handleDraftStatus(draftId, "rejected")}
          onSaveContent={workspace.handleSaveApprovalContent}
          onSaveMedia={workspace.handleSaveApprovalMedia}
          onFeedback={workspace.handleApprovalFeedback}
          onApproveAndSchedule={workspace.handleApproveAndSchedule}
          onPublishNow={workspace.handlePublishNowApproval}
          publishMessage={workspace.approvalPublishMessage}
        />
      )}
    </MarketingPeerPageFrame>
  );
}

export default function TeamPeerReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewPageInner />
    </Suspense>
  );
}
