"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PgContentPreviewModal, PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import VisionContentView from "@/features/office/content/VisionContentView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { previewStatsForContent } from "@/lib/office/content/demo-preview-stats";
import type { ContentItem } from "@/lib/office/content/types";

function OfficeContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");

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

  const previewItem: ContentItem | null = useMemo(() => {
    if (!previewId) return null;
    for (const group of model.groups) {
      const found = group.items.find((item) => item.id === previewId);
      if (found) return found;
    }
    return null;
  }, [model.groups, previewId]);

  const previewStats = previewItem
    ? previewStatsForContent({
        isDemo,
        channelId: previewItem.channelId,
        locale: localePreference === "nl" ? "nl" : "en",
      })
    : [];

  const closePreview = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preview");
    const q = params.toString();
    router.replace(q ? `/office/${peerId}/content?${q}` : `/office/${peerId}/content`, {
      scroll: false,
    });
  };

  const openPreview = (item: ContentItem) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preview", item.id);
    router.push(`/office/${peerId}/content?${params.toString()}`, { scroll: false });
  };

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
        presence={loading ? null : model.presence}
        decisionCount={deskModel.decisions.length}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading ? (
          <PgSkeletonRows rows={4} rowHeight={148} />
        ) : (
          <VisionContentView
            model={model}
            locale={localePreference}
            peerId={peerId}
            onOpenPreview={openPreview}
          />
        )}
      </PgOfficeShell>
      {newCampaignModal}

      {previewItem ? (
        <PgContentPreviewModal
          open
          onClose={closePreview}
          locale={localePreference}
          title={previewItem.title}
          channelLabel={previewItem.channelLabel ?? "Content"}
          campaignTitle={previewItem.campaignTitle}
          previewText={previewItem.preview}
          stats={previewStats}
          detailHref={`/office/${peerId}/content/${previewItem.id}`}
        />
      ) : null}
    </>
  );
}

export default function OfficeContentPage() {
  return (
    <Suspense fallback={null}>
      <OfficeContentInner />
    </Suspense>
  );
}
