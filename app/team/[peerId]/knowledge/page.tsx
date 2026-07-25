"use client";

import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import KnowledgeTab from "@/features/marketing-workspace/tabs/KnowledgeTab";

export default function TeamPeerKnowledgePage() {
  return (
    <MarketingPeerPageFrame activeTab="knowledge">
      {({ domainInput }) => <KnowledgeTab domainInput={domainInput} />}
    </MarketingPeerPageFrame>
  );
}
