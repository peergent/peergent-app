"use client";

import { Suspense } from "react";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import PerformanceTab from "@/features/marketing-workspace/tabs/PerformanceTab";

function PerformancePageInner() {
  return (
    <MarketingPeerPageFrame activeTab="performance">
      {({ domainInput }) => <PerformanceTab domainInput={domainInput} />}
    </MarketingPeerPageFrame>
  );
}

export default function EmmaPerformancePage() {
  return (
    <Suspense fallback={null}>
      <PerformancePageInner />
    </Suspense>
  );
}
