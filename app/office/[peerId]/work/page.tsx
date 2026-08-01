"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PgCampaignWorkspaceModal, PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import VisionWorkView from "@/features/office/work/VisionWorkView";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { officeHref } from "@/lib/office/links";
import { firstPublishedDraftForProject } from "@/lib/office/content/demo-preview-stats";
import type { WorkGroupId, WorkItem } from "@/lib/office/work/types";

const WORK_FILTERS: { id: WorkGroupId | "all"; labelNl: string; labelEn: string }[] = [
  { id: "blocked_on_you", labelNl: "Wacht op jou", labelEn: "Waiting on you" },
  { id: "moving", labelNl: "Loopt", labelEn: "In progress" },
  { id: "queued", labelNl: "Ingepland", labelEn: "Scheduled" },
  { id: "blocked_elsewhere", labelNl: "Geblokkeerd", labelEn: "Blocked" },
  { id: "finished", labelNl: "Recent afgerond", labelEn: "Recently finished" },
];

function OfficeWorkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceParam = searchParams.get("workspace") ?? searchParams.get("campaign");
  const filterParam = searchParams.get("filter") as WorkGroupId | "all" | null;

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

  const [modalItem, setModalItem] = useState<WorkItem | null>(null);
  const nl = localePreference === "nl";

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

  const filteredModel = useMemo(() => {
    if (!filterParam || filterParam === "all") return model;
    return {
      ...model,
      groups: model.groups.filter((g) => g.id === filterParam),
    };
  }, [model, filterParam]);

  const openWorkspace = useCallback(
    (item: WorkItem) => {
      setModalItem(item);
      const params = new URLSearchParams(searchParams.toString());
      params.set("workspace", item.id);
      router.replace(`/office/${peerId}/work?${params.toString()}`, { scroll: false });
    },
    [peerId, router, searchParams]
  );

  const openContentPreview = useCallback(
    (item: WorkItem) => {
      const draftId = firstPublishedDraftForProject(
        item.id,
        domainInput.drafts,
        domainInput.workUnits
      );
      const params = new URLSearchParams();
      if (draftId) params.set("preview", draftId);
      params.set("campaign", item.id);
      router.push(`${officeHref(peerId, "content")}?${params.toString()}`);
    },
    [domainInput.drafts, domainInput.workUnits, peerId, router]
  );

  const closeWorkspace = useCallback(() => {
    setModalItem(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("workspace");
    params.delete("campaign");
    const q = params.toString();
    router.replace(q ? `/office/${peerId}/work?${q}` : `/office/${peerId}/work`, { scroll: false });
  }, [peerId, router, searchParams]);

  const activeItem = useMemo(() => {
    if (modalItem) return modalItem;
    if (!workspaceParam) return null;
    for (const group of model.groups) {
      const found = group.items.find((item) => item.id === workspaceParam);
      if (found) return found;
    }
    return null;
  }, [modalItem, workspaceParam, model.groups]);

  const filterHref = (filter: WorkGroupId | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("workspace");
    params.delete("campaign");
    if (filter === "all") params.delete("filter");
    else params.set("filter", filter);
    const q = params.toString();
    return q ? `/office/${peerId}/work?${q}` : `/office/${peerId}/work`;
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
        active="work"
        presence={loading ? null : deskModel.presence}
        decisionCount={deskModel.decisions.length}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading ? (
          <PgSkeletonRows rows={4} rowHeight={104} />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {WORK_FILTERS.map((filter) => (
                <Link
                  key={filter.id}
                  href={filterHref(filter.id)}
                  className={
                    filterParam === filter.id
                      ? "pg-v13-chip pg-v13-chip--active no-underline"
                      : "pg-v13-chip no-underline"
                  }
                >
                  {nl ? filter.labelNl : filter.labelEn}
                </Link>
              ))}
            </div>
            <VisionWorkView
              model={filteredModel}
              locale={localePreference}
              onOpenCampaign={openWorkspace}
              onOpenPreview={openContentPreview}
            />
          </>
        )}
      </PgOfficeShell>

      {activeItem ? (
        <PgCampaignWorkspaceModal
          open
          onClose={closeWorkspace}
          locale={localePreference}
          campaignName={activeItem.name}
          statusLabel={activeItem.stageLabel}
          peerId={peerId}
          projectId={activeItem.id}
        />
      ) : null}
      {newCampaignModal}
    </>
  );
}

export default function OfficeWorkPage() {
  return (
    <Suspense fallback={null}>
      <OfficeWorkContent />
    </Suspense>
  );
}
