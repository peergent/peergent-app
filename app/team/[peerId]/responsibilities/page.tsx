"use client";

import { useState } from "react";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ResponsibilitiesTab, {
  toggleResponsibilityEnabled,
} from "@/features/marketing-workspace/tabs/ResponsibilitiesTab";

export default function TeamPeerResponsibilitiesPage() {
  const [approvingId, setApprovingId] = useState<string | null>(null);

  return (
    <MarketingPeerPageFrame activeTab="responsibilities">
      {({ domainInput, workspace }) => (
        <ResponsibilitiesTab
          domainInput={domainInput}
          approvingId={approvingId}
          onToggleOwnership={(responsibilityId, enabled) => {
            workspace.updateResponsibilities(
              toggleResponsibilityEnabled(workspace.responsibilities, responsibilityId, enabled)
            );
          }}
          onApprovePlan={async (responsibilityId) => {
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
