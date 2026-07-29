"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ReviewTab from "@/features/marketing-workspace/tabs/ReviewTab";
import V17WaitingView from "@/features/customer-v17/peer/V17WaitingView";
import { buildV17WaitingViewModel } from "@/lib/customer-v17/build-v17-waiting-view-model";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { parseReviewSearchParams } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";

function WaitingPageInner() {
  const searchParams = useSearchParams();
  const { deliverableId } = parseReviewSearchParams(searchParams);

  return (
    <MarketingPeerPageFrame activeTab="waiting_for_me">
      {({ peerId, domainInput, workspace }) => {
        if (!workspace.peer) return null;

        if (deliverableId) {
          return (
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
          );
        }

        const model = buildV17WaitingViewModel({
          peer: workspace.peer,
          domainInput,
          localePreference: customerLocalePreferenceFromEnv(),
        });
        return <V17WaitingView model={model} />;
      }}
    </MarketingPeerPageFrame>
  );
}

export default function TeamPeerWaitingPage() {
  return (
    <Suspense fallback={null}>
      <WaitingPageInner />
    </Suspense>
  );
}
