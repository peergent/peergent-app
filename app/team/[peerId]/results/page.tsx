"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import V17ResultsView from "@/features/customer-v17/peer/V17ResultsView";
import { buildV17ResultsViewModel } from "@/lib/customer-v17/build-v17-results-view-model";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";

function ResultsPageInner() {
  const searchParams = useSearchParams();
  return (
    <MarketingPeerPageFrame activeTab="results">
      {({ domainInput, workspace }) => {
        if (!workspace.peer) return null;
        const model = buildV17ResultsViewModel({
          domainInput,
          localePreference: customerLocalePreferenceFromEnv(),
          searchParams,
        });
        return <V17ResultsView model={model} />;
      }}
    </MarketingPeerPageFrame>
  );
}

export default function TeamPeerResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsPageInner />
    </Suspense>
  );
}
