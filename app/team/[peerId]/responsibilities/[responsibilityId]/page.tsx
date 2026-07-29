"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ResponsibilityDetailTab from "@/features/marketing-workspace/details/ResponsibilityDetailTab";

function ResponsibilityDetailPageInner() {
  const params = useParams<{ peerId: string; responsibilityId: string }>();
  const peerId = params.peerId ?? "";
  const responsibilityId = decodeURIComponent(params.responsibilityId ?? "");
  const [approving, setApproving] = useState(false);

  return (
    <MarketingPeerPageFrame activeTab="settings">
      {({ domainInput, workspace }) => (
        <ResponsibilityDetailTab
          peerId={peerId}
          responsibilityId={responsibilityId}
          domainInput={domainInput}
          approving={approving}
          onApprovePlan={async (id) => {
            setApproving(true);
            try {
              await workspace.handleApproveResponsibilityPlan(id);
            } finally {
              setApproving(false);
            }
          }}
        />
      )}
    </MarketingPeerPageFrame>
  );
}

export default function TeamPeerResponsibilityDetailPage() {
  return (
    <Suspense fallback={null}>
      <ResponsibilityDetailPageInner />
    </Suspense>
  );
}
