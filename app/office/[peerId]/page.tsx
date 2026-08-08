"use client";

import { Suspense, useMemo, useState } from "react";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import MarketingWorkspaceView from "@/features/office/workspace/MarketingWorkspaceView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildMarketingWorkspaceBands } from "@/lib/office/workspace/build-marketing-workspace-bands";

/**
 * §4.1 Workspace — Emma's command center (Marketing reference implementation).
 */

function OfficeWorkspaceInner() {
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

  const [askFocused, setAskFocused] = useState(false);

  const desk = useMemo(
    () =>
      buildMarketingDeskViewModel({
        domainInput,
        peerName,
        peerRole,
        localePreference,
      }),
    [domainInput, peerName, peerRole, localePreference]
  );

  const bands = useMemo(
    () =>
      buildMarketingWorkspaceBands({
        domainInput,
        peerName,
        peerRole,
        localePreference,
        isDemo,
      }),
    [domainInput, peerName, peerRole, localePreference, isDemo]
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
        active="desk"
        presence={loading ? null : desk.presence}
        decisionCount={desk.decisions.length}
        presenceSuspended={askFocused}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading ? (
          <PgSkeletonRows rows={4} rowHeight={92} />
        ) : (
          <MarketingWorkspaceView bands={bands} locale={localePreference} />
        )}
      </PgOfficeShell>
      {newCampaignModal}
    </>
  );
}

export default function OfficeDeskPage() {
  return (
    <Suspense fallback={null}>
      <OfficeWorkspaceInner />
    </Suspense>
  );
}
