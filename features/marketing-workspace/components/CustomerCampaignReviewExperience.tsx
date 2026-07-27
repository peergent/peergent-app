"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  buildCampaignReviewViewModel,
  type CampaignReviewItem,
} from "@/lib/peer-experience/marketing/campaign-review";
import {
  buildCampaignCollaborationViewModel,
  findArtifactCollaboration,
} from "@/lib/peer-experience/marketing/campaign-collaboration";
import {
  getMarketingCampaignCopy,
  resolveMarketingCampaignLocale,
} from "@/lib/i18n/marketing-campaign-copy";
import {
  getCampaignReviewItemHref,
  getProjectHref,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import CustomerCampaignReviewPreview from "../components/CustomerCampaignReviewPreview";
import CampaignReviewActions from "./CampaignReviewActions";
import CampaignCollaborationPanel from "./CampaignCollaborationPanel";
import { buildCampaignReviewBuildInput } from "../lib/build-campaign-review-input";
import { buildCampaignCollaborationBuildInput } from "../lib/build-campaign-collaboration-input";
import {
  assertCampaignReviewHandlers,
  type CampaignReviewWorkspaceHandlers,
} from "../lib/campaign-review-handlers";

export type CustomerCampaignReviewExperienceProps = {
  peerId: string;
  projectId: string;
  reviewItemId: string;
  domainInput: MarketingPeerDomainInput;
  campaign: MarketingCampaignDetailViewModel;
  project: MarketingProject;
  campaignsEnabled: boolean;
  campaignContinuationRunning?: boolean;
  localePreference?: string | null;
  reviewHandlers: CampaignReviewWorkspaceHandlers;
};

function findReviewItem(
  items: readonly CampaignReviewItem[],
  reviewItemId: string
): CampaignReviewItem | null {
  return items.find((i) => i.id === reviewItemId || i.workUnitId === reviewItemId) ?? null;
}

export default function CustomerCampaignReviewExperience({
  peerId,
  projectId,
  reviewItemId,
  domainInput,
  campaign,
  project,
  campaignsEnabled,
  campaignContinuationRunning = false,
  localePreference,
  reviewHandlers,
}: CustomerCampaignReviewExperienceProps) {
  const locale = resolveMarketingCampaignLocale(localePreference);
  const copy = useMemo(() => getMarketingCampaignCopy(locale), [locale]);

  const reviewVm = useMemo(() => {
    const input = buildCampaignReviewBuildInput({
      peerId,
      projectId,
      domainInput,
      campaignDetail: campaign,
      project,
      campaignsEnabled,
      continuationRunning: campaignContinuationRunning,
      activeWorkUnitId: domainInput.activeWorkUnitId,
    });
    return buildCampaignReviewViewModel(input);
  }, [
    peerId,
    projectId,
    domainInput,
    campaign,
    project,
    campaignsEnabled,
    campaignContinuationRunning,
  ]);

  const collaborationArtifact = useMemo(() => {
    const item = findReviewItem(reviewVm.allReviewItems, reviewItemId);
    if (!item) return null;
    const collabVm = buildCampaignCollaborationViewModel(
      buildCampaignCollaborationBuildInput({
        reviewBuildInput: buildCampaignReviewBuildInput({
          peerId,
          projectId,
          domainInput,
          campaignDetail: campaign,
          project,
          campaignsEnabled,
          continuationRunning: campaignContinuationRunning,
          activeWorkUnitId: domainInput.activeWorkUnitId,
        }),
        reviewVm,
      })
    );
    return findArtifactCollaboration(collabVm, item.workUnitId);
  }, [
    reviewVm,
    reviewItemId,
    peerId,
    projectId,
    domainInput,
    campaign,
    project,
    campaignsEnabled,
    campaignContinuationRunning,
  ]);

  const handlersReady = assertCampaignReviewHandlers(reviewHandlers);

  const item = findReviewItem(reviewVm.allReviewItems, reviewItemId);
  const queue = useMemo(
    () => reviewVm.reviewQueue.filter((i) => i.preview),
    [reviewVm.reviewQueue]
  );
  const queueIndex = queue.findIndex((i) => i.id === reviewItemId);
  const positionLabel =
    queue.length > 0 && queueIndex >= 0
      ? copy.reviewPosition(queueIndex + 1, queue.length)
      : queue.length > 0
        ? copy.reviewQueueSummary(queue.length)
        : null;

  const prev = queueIndex > 0 ? queue[queueIndex - 1] : null;
  const next = queueIndex >= 0 && queueIndex < queue.length - 1 ? queue[queueIndex + 1] : null;
  const nextInQueueId =
    queueIndex >= 0 && queueIndex < queue.length - 1 ? queue[queueIndex + 1]?.id ?? null : null;
  const remainingAfterApprove =
    item?.inReviewQueue && queueIndex >= 0 ? Math.max(0, queue.length - 1) : queue.length;

  const campaignHref = getProjectHref(peerId, projectId);

  if (!item || !item.preview) {
    return (
      <section className="mw-section">
        <Link href={campaignHref} className="mw-detail-back pg-focus-premium">
          ← {copy.reviewBackToCampaign}
        </Link>
        <p className="mw-empty-inline" style={{ marginTop: 16 }}>
          {copy.reviewNotAvailable}
        </p>
      </section>
    );
  }

  if (!handlersReady) {
    return (
      <section className="mw-section">
        <Link href={campaignHref} className="mw-detail-back pg-focus-premium">
          ← {copy.reviewBackToCampaign}
        </Link>
        <p className="mw-empty-inline" style={{ marginTop: 16 }}>
          {copy.reviewActionsLoading}
        </p>
      </section>
    );
  }

  return (
    <section className="mw-section mw-customer-review-page" data-testid="mw-customer-review-page">
      <Link href={campaignHref} className="mw-detail-back pg-focus-premium">
        ← {copy.reviewBackToCampaign}
      </Link>

      <header className="mw-review-page-header">
        <p className="mw-review-doc-eyebrow">{item.artifactTypeLabel}</p>
        <h1 className="mw-detail-title">{item.title}</h1>
        <p className="mw-review-doc-byline">{copy.reviewPreparedBy}</p>
      </header>

      <nav className="mw-review-nav" aria-label="Review item navigation">
        {prev ? (
          <Link
            href={getCampaignReviewItemHref(peerId, projectId, prev.id)}
            className="mw-review-nav-btn pg-focus-premium"
          >
            ← {copy.reviewPrevious}
          </Link>
        ) : (
          <span className="mw-review-nav-btn mw-review-nav-btn--disabled" aria-disabled>
            ← {copy.reviewPrevious}
          </span>
        )}
        {positionLabel ? (
          <p className="mw-review-nav-position" aria-live="polite">
            {positionLabel}
          </p>
        ) : (
          <span className="mw-review-nav-position" aria-hidden />
        )}
        {next ? (
          <Link
            href={getCampaignReviewItemHref(peerId, projectId, next.id)}
            className="mw-review-nav-btn pg-focus-premium"
          >
            {copy.reviewNext} →
          </Link>
        ) : (
          <span className="mw-review-nav-btn mw-review-nav-btn--disabled" aria-disabled>
            {copy.reviewNext} →
          </span>
        )}
      </nav>

      <div className="mw-glass mw-review-doc-shell">
        <CustomerCampaignReviewPreview preview={item.preview} />
      </div>

      {collaborationArtifact ? (
        <div className="mw-review-history-disclosure">
          <CampaignCollaborationPanel
            artifact={collaborationArtifact}
            mode="customer"
            copy={copy}
            variant="disclosure"
          />
        </div>
      ) : null}

      <CampaignReviewActions
        peerId={peerId}
        projectId={projectId}
        item={item}
        copy={copy}
        approvalMode={project.campaignSetup?.approvalMode}
        remainingQueueCount={remainingAfterApprove}
        nextInQueueItemId={nextInQueueId}
        reviewHandlers={reviewHandlers}
      />
    </section>
  );
}
