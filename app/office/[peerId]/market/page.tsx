"use client";

import { Suspense, useMemo } from "react";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import MarketView from "@/features/office/market/MarketView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingMarketViewModel } from "@/lib/office/market/build-marketing-market";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";

/**
 * §4.7 Market — monthly, and about the world rather than about you.
 */

function OfficeMarketInner() {
  const {
    peerId,
    peerName,
    peerRole,
    domainInput,
    localePreference,
    loading,
    isDemo,
    team,
  } = useOfficePeer();

  const model = useMemo(
    () =>
      buildMarketingMarketViewModel({
        domainInput,
        peerName,
        peerRole,
        localePreference,
      }),
    [domainInput, peerName, peerRole, localePreference]
  );

  const deskModel = useMemo(
    () =>
      buildMarketingDeskViewModel({
        domainInput,
        peerName,
        peerRole,
        localePreference,
      }),
    [domainInput, peerName, peerRole, localePreference]
  );

  return (
    <PgOfficeShell
      peerId={peerId}
      locale={localePreference}
      isDemo={isDemo}
      peerName={peerName}
      peerRole={peerRole}
      team={team}
      active="market"
      presence={loading ? null : model.presence}
      decisionCount={deskModel.decisions.length}
      onBrief={() => undefined}
      onSearch={() => undefined}
    >
      {loading ? (
        <PgSkeletonRows rows={3} rowHeight={132} />
      ) : (
        <MarketView model={model} />
      )}
    </PgOfficeShell>
  );
}

export default function OfficeMarketPage() {
  return (
    <Suspense fallback={null}>
      <OfficeMarketInner />
    </Suspense>
  );
}
