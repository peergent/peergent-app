"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import VisionCampaignDetailView from "@/features/office/campaign/VisionCampaignDetailView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildCampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import Link from "next/link";
import { officeHref } from "@/lib/office/links";

function CampaignDetailInner() {
  const params = useParams<{ peerId: string; campaignId: string }>();
  const campaignId = params.campaignId;

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

  const model = useMemo(
    () =>
      buildCampaignDetailViewModel({
        peerId,
        projectId: campaignId,
        domainInput,
        locale: localePreference,
      }),
    [peerId, campaignId, domainInput, localePreference]
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

  const nl = localePreference === "nl";

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
        active="work"
        presence={loading ? null : deskModel.presence}
        decisionCount={deskModel.decisions.length}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading ? (
          <PgSkeletonRows rows={4} rowHeight={104} />
        ) : model ? (
          <VisionCampaignDetailView model={model} locale={localePreference} />
        ) : (
          <div className="pg-v13-panel p-6">
            <p className="text-[15px] text-[var(--pg-v13-ink-soft)]">
              {nl ? "Deze campagne is niet gevonden in deze workspace." : "This campaign was not found in this workspace."}
            </p>
            <Link href={officeHref(peerId, "work")} className="pg-v13-btn pg-v13-btn--ghost mt-4 inline-flex no-underline">
              {nl ? "Terug naar Werk" : "Back to Work"}
            </Link>
          </div>
        )}
      </PgOfficeShell>
      {newCampaignModal}
    </>
  );
}

export default function OfficeCampaignDetailPage() {
  return (
    <Suspense fallback={null}>
      <CampaignDetailInner />
    </Suspense>
  );
}
