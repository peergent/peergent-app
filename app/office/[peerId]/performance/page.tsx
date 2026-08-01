"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import VisionPerformanceView from "@/features/office/performance/VisionPerformanceView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";

/**
 * §4.5 Performance.
 *
 * The presence line here is the *Performance* reading, produced by the
 * grounding gate against the current filter — not the Desk's line. It is
 * re-derived whenever the filters change, which is what makes the customer
 * feel accompanied through their own analysis.
 */

function OfficePerformanceInner() {
  const {
    peerId,
    peerName,
    peerRole,
    domainInput,
    localePreference,
    loading,
    isDemo,
    team,
    roster,
    openNewCampaign,
    newCampaignModal,
  } = useOfficePeer();
  const searchParams = useSearchParams();

  const model = useMemo(
    () =>
      buildMarketingPerformanceViewModelForOffice({
        domainInput,
        peerName,
        peerRole,
        localePreference,
        searchParams: new URLSearchParams(searchParams.toString()),
      }),
    [domainInput, peerName, peerRole, localePreference, searchParams]
  );

  // Only the decision count is borrowed from the Desk model; the presence line
  // on this destination must speak about this view.
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
    <>
      <PgOfficeShell
        peerId={peerId}
        locale={localePreference}
        isDemo={isDemo}
        peerName={peerName}
        peerRole={peerRole}
        team={team}
        roster={roster}
        active="performance"
        presence={loading ? null : model.presence}
        decisionCount={deskModel.decisions.length}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading ? (
          <PgSkeletonRows rows={3} rowHeight={120} />
        ) : (
          <VisionPerformanceView model={model} locale={localePreference} />
        )}
      </PgOfficeShell>
      {newCampaignModal}
    </>
  );
}

export default function OfficePerformancePage() {
  return (
    <Suspense fallback={null}>
      <OfficePerformanceInner />
    </Suspense>
  );
}
