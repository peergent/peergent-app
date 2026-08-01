"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import VisionPerformanceProviderView from "@/features/office/performance/VisionPerformanceProviderView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { officeHref } from "@/lib/office/links";
import type { PerformanceProviderCardId } from "@/lib/office/performance/provider-cards";

const PROVIDER_SLUG: Record<string, PerformanceProviderCardId> = {
  linkedin: "linkedin",
  "google-ads": "google_ads",
  ga4: "ga4",
  crm: "hubspot",
};

function ProviderDetailInner() {
  const params = useParams<{ peerId: string; provider: string }>();
  const providerSlug = params.provider;
  const providerId = PROVIDER_SLUG[providerSlug];

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

  const performanceModel = useMemo(
    () =>
      buildMarketingPerformanceViewModelForOffice({
        domainInput,
        peerName,
        peerRole,
        localePreference,
      }),
    [domainInput, peerName, peerRole, localePreference]
  );

  const card = performanceModel.providerCards.find((c) => c.id === providerId);

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
        active="performance"
        presence={loading ? null : deskModel.presence}
        decisionCount={deskModel.decisions.length}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading ? (
          <PgSkeletonRows rows={3} rowHeight={120} />
        ) : card ? (
          <VisionPerformanceProviderView peerId={peerId} card={card} locale={localePreference} />
        ) : (
          <div className="pg-v13-panel p-6">
            <p className="text-[15px] text-[var(--pg-v13-ink-soft)]">
              {nl
                ? "Er zijn nog geen gegevens beschikbaar voor deze bron."
                : "No data is available for this source yet."}
            </p>
            <Link href={officeHref(peerId, "performance")} className="pg-v13-btn pg-v13-btn--ghost mt-4 inline-flex no-underline">
              {nl ? "Terug naar Resultaten" : "Back to Performance"}
            </Link>
          </div>
        )}
      </PgOfficeShell>
      {newCampaignModal}
    </>
  );
}

export default function OfficePerformanceProviderPage() {
  return (
    <Suspense fallback={null}>
      <ProviderDetailInner />
    </Suspense>
  );
}
