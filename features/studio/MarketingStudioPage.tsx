"use client";

import { useState } from "react";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import MarketingOverviewPage from "@/features/studio/marketing-peer/pages/MarketingOverviewPage";

export default function MarketingStudioPage() {
  const [approvingId, setApprovingId] = useState<string | null>(null);

  return (
    <MarketingPeerPageFrame activeTab="overview">
      {({ domainInput, workspace }) => (
        <MarketingOverviewPage
          domainInput={domainInput}
          onDismissInsight={workspace.handleDismissInsight}
          approvingResponsibilityId={approvingId}
          onApproveResponsibilityPlan={async (responsibilityId) => {
            setApprovingId(responsibilityId);
            try {
              await workspace.handleApproveResponsibilityPlan(responsibilityId);
            } finally {
              setApprovingId(null);
            }
          }}
        />
      )}
    </MarketingPeerPageFrame>
  );
}
