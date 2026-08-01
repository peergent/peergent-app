"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import VisionContentDetailView from "@/features/office/content/VisionContentDetailView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildContentDetailViewModel } from "@/lib/office/content/build-content-detail";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { officeHref } from "@/lib/office/links";

function ContentDetailInner() {
  const params = useParams<{ peerId: string; contentId: string }>();
  const contentId = params.contentId;

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
      buildContentDetailViewModel({
        peerId,
        contentId,
        domainInput,
        locale: localePreference,
      }),
    [peerId, contentId, domainInput, localePreference]
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
        active="content"
        presence={loading ? null : deskModel.presence}
        decisionCount={deskModel.decisions.length}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading ? (
          <PgSkeletonRows rows={4} rowHeight={148} />
        ) : model ? (
          <VisionContentDetailView model={model} locale={localePreference} />
        ) : (
          <div className="pg-v13-panel p-6">
            <p className="text-[15px] text-[var(--pg-v13-ink-soft)]">
              {nl ? "Dit contentstuk is niet gevonden." : "This content item was not found."}
            </p>
            <Link href={officeHref(peerId, "content")} className="pg-v13-btn pg-v13-btn--ghost mt-4 inline-flex no-underline">
              {nl ? "Terug naar Content" : "Back to Content"}
            </Link>
          </div>
        )}
      </PgOfficeShell>
      {newCampaignModal}
    </>
  );
}

export default function OfficeContentDetailPage() {
  return (
    <Suspense fallback={null}>
      <ContentDetailInner />
    </Suspense>
  );
}
