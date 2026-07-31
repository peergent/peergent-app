"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import ContentView from "@/features/office/content/ContentView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";

/**
 * §4.6 Content.
 *
 * The presence line speaks about the corpus in this filtered view, not about
 * the Desk. Only the decision count is shared, so the tab badge stays correct.
 */

function OfficeContentInner() {
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
  const searchParams = useSearchParams();

  const model = useMemo(
    () =>
      buildMarketingContentViewModel({
        domainInput,
        peerName,
        peerRole,
        localePreference,
        searchParams: new URLSearchParams(searchParams.toString()),
      }),
    [domainInput, peerName, peerRole, localePreference, searchParams]
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
      active="content"
      presence={loading ? null : model.presence}
      decisionCount={deskModel.decisions.length}
      onBrief={() => undefined}
      onSearch={() => undefined}
    >
      {loading ? (
        // Skeletons at card dimensions so the grid never reflows.
        <PgSkeletonRows rows={4} rowHeight={148} />
      ) : (
        <ContentView model={model} />
      )}
    </PgOfficeShell>
  );
}

export default function OfficeContentPage() {
  return (
    <Suspense fallback={null}>
      <OfficeContentInner />
    </Suspense>
  );
}
