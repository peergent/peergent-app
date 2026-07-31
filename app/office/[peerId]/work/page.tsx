"use client";

import { Suspense, useMemo } from "react";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import WorkView from "@/features/office/work/WorkView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";

/**
 * §4.2 Work — the weekly review.
 *
 * The presence line is shell-level and speaks about *this* view, so the Desk
 * model is reused purely for the shared presence and decision count rather
 * than re-deriving either here.
 */

function OfficeWorkInner() {
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

  const model = useMemo(
    () =>
      buildMarketingWorkViewModel({
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
      active="work"
      presence={loading ? null : deskModel.presence}
      decisionCount={deskModel.decisions.length}
      onBrief={() => undefined}
      onSearch={() => undefined}
    >
      {loading ? (
        // §4.2 Skeleton cards preserving group headers, so structure is
        // legible before content.
        <PgSkeletonRows rows={4} rowHeight={104} />
      ) : (
        <WorkView model={model} />
      )}
    </PgOfficeShell>
  );
}

export default function OfficeWorkPage() {
  return (
    <Suspense fallback={null}>
      <OfficeWorkInner />
    </Suspense>
  );
}
