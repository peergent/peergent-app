"use client";

import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ContentTab from "@/features/marketing-workspace/tabs/ContentTab";

export default function TeamPeerContentPage() {
  return (
    <MarketingPeerPageFrame activeTab="content">
      {({ domainInput, workspace }) => (
        <ContentTab
          domainInput={domainInput}
          onExecuteDelegation={workspace.handleExecuteDelegation}
          delegationBusy={Boolean(workspace.activeDelegation)}
        />
      )}
    </MarketingPeerPageFrame>
  );
}
