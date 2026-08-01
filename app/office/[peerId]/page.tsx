"use client";

import { Suspense, useMemo, useState } from "react";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import VisionDeskView from "@/features/office/desk/VisionDeskView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildMarketingDeskBriefing } from "@/lib/office/desk/build-marketing-briefing";

/**
 * §4.1 Desk — the office's front door.
 *
 * The Marketing Peer is the reference implementation (§10). Every other Peer
 * supplies its own adapter into the same DeskViewModel; nothing in the shell
 * or the view changes.
 */

function OfficeDeskInner() {
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

  // §8.1 The presence line freezes entirely while the customer types.
  const [askFocused, setAskFocused] = useState(false);

  const model = useMemo(
    () =>
      buildMarketingDeskViewModel({
        domainInput,
        peerName,
        peerRole,
        localePreference,
      }),
    [domainInput, peerName, peerRole, localePreference]
  );

  /**
   * The briefing composes the five other destination view models. They are pure
   * functions of the same domain input, so this is arithmetic on data already
   * in memory — and it guarantees the Desk cannot say anything a destination
   * would not say about itself.
   */
  const briefing = useMemo(
    () =>
      buildMarketingDeskBriefing({
        domainInput,
        peerName,
        peerRole,
        localePreference,
        desk: model,
      }),
    [domainInput, peerName, peerRole, localePreference, model]
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
        presence={loading ? null : model.presence}
        decisionCount={model.decisions.length}
        presenceSuspended={askFocused}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading ? (
          // §4.1 Skeleton rows at final dimensions. Never a spinner.
          <PgSkeletonRows rows={3} rowHeight={92} />
        ) : (
          <VisionDeskView
            model={model}
            briefing={briefing}
            locale={localePreference}
          />
        )}
      </PgOfficeShell>
      {newCampaignModal}
    </>
  );
}

export default function OfficeDeskPage() {
  return (
    <Suspense fallback={null}>
      <OfficeDeskInner />
    </Suspense>
  );
}
