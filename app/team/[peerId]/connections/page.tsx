"use client";

import { Suspense } from "react";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ConnectionsTab from "@/features/marketing-workspace/tabs/ConnectionsTab";

function ConnectionsPageInner() {
  return (
    <MarketingPeerPageFrame activeTab="connections">
      {({ domainInput }) => <ConnectionsTab domainInput={domainInput} />}
    </MarketingPeerPageFrame>
  );
}

export default function TeamPeerConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectionsPageInner />
    </Suspense>
  );
}
