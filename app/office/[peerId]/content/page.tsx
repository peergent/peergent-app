"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PgContentPreviewModal, PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import OfficeDeliverableReviewModal from "@/features/office/deliverable/OfficeDeliverableReviewModal";
import VisionContentView from "@/features/office/content/VisionContentView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { previewStatsForContent } from "@/lib/office/content/demo-preview-stats";
import {
  getDemoCampaignSnapshot,
  setDemoDraftStatus,
} from "@/lib/office/demo/demo-campaign-store";
import { buildDeliverableReviewModel } from "@/lib/office/deliverable/build-deliverable-review";
import type { ContentItem } from "@/lib/office/content/types";

function OfficeContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [localPreviewId, setLocalPreviewId] = useState<string | null>(null);
  const activePreviewId = localPreviewId ?? previewId;

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
    workspace,
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
    if (!activePreviewId) return null;
    for (const group of model.groups) {
      const found = group.items.find((item) => item.id === activePreviewId);
      if (found) return found;
    }
    return null;
  }, [model.groups, activePreviewId]);

  const reviewModel = useMemo(() => {
    if (!activePreviewId) return null;
    const draft = domainInput.drafts.find((d) => d.id === activePreviewId);
    if (draft?.status !== "ready_for_review") return null;
    return buildDeliverableReviewModel({
      draftId: activePreviewId,
      domainInput,
      locale: localePreference,
      approvalHistory: isDemo ? getDemoCampaignSnapshot().approvalHistory : undefined,
    });
  }, [activePreviewId, domainInput, isDemo, localePreference]);

  const nl = localePreference === "nl";

  const previewStats = previewItem
    ? previewStatsForContent({
        isDemo,
        channelId: previewItem.channelId,
        locale: localePreference === "nl" ? "nl" : "en",
      })
    : [];

  const closePreview = useCallback(() => {
    setLocalPreviewId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preview");
    const q = params.toString();
    router.replace(q ? `/office/${peerId}/content?${q}` : `/office/${peerId}/content`, {
      scroll: false,
    });
  }, [peerId, router, searchParams]);

  const openPreview = useCallback(
    (item: ContentItem) => {
      setLocalPreviewId(item.id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("preview", item.id);
      router.push(`/office/${peerId}/content?${params.toString()}`, { scroll: false });
    },
    [peerId, router, searchParams]
  );

  const handleApprove = useCallback(
    (draftId: string) => {
      if (isDemo) {
        setDemoDraftStatus(peerId, draftId, "approved", {
          action: "approved",
          by: nl ? "Jij" : "You",
        });
      } else {
        workspace.handleDraftStatus(draftId, "approved");
      }
      closePreview();
    },
    [closePreview, isDemo, nl, peerId, workspace]
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

      {reviewModel ? (
        <OfficeDeliverableReviewModal
          open
          onClose={closePreview}
          locale={localePreference}
          model={reviewModel}
          onApprove={handleApprove}
          onRequestChanges={(draftId, notes) => {
            if (isDemo) {
              setDemoDraftStatus(peerId, draftId, "ready_for_review", {
                action: "changes_requested",
                by: nl ? "Jij" : "You",
                notes,
              });
            } else {
              workspace.handleDraftStatus(draftId, "rejected");
            }
            closePreview();
          }}
          onReject={(draftId, notes) => {
            if (isDemo) {
              setDemoDraftStatus(peerId, draftId, "rejected", {
                action: "rejected",
                by: nl ? "Jij" : "You",
                notes,
              });
            } else {
              workspace.handleDraftStatus(draftId, "rejected");
            }
            closePreview();
          }}
          detailHref={`/office/${peerId}/content/${reviewModel.draftId}`}
        />
      ) : previewItem ? (
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
