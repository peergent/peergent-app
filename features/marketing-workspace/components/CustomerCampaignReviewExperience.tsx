"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  buildCampaignReviewViewModel,
  type CampaignReviewItem,
} from "@/lib/peer-experience/marketing/campaign-review";
import {
  getCampaignReviewItemHref,
  getProjectHref,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import CustomerCampaignReviewPreview from "../components/CustomerCampaignReviewPreview";
import CampaignReviewActions from "./CampaignReviewActions";
import { buildCampaignReviewBuildInput } from "../lib/build-campaign-review-input";
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
  reviewHandlers,
}: CustomerCampaignReviewExperienceProps) {
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

  const handlersReady = assertCampaignReviewHandlers(reviewHandlers);

  const item = findReviewItem(reviewVm.allReviewItems, reviewItemId);
  const queue = useMemo(
    () => reviewVm.reviewQueue.filter((i) => i.preview),
    [reviewVm.reviewQueue]
  );
  const queueIndex = queue.findIndex((i) => i.id === reviewItemId);
  const positionLabel =
    queue.length > 0 && queueIndex >= 0
      ? `Review ${queueIndex + 1} of ${queue.length}`
      : queue.length > 0
        ? `Review queue · ${queue.length} items`
        : null;

  const prev = queueIndex > 0 ? queue[queueIndex - 1] : null;
  const next = queueIndex >= 0 && queueIndex < queue.length - 1 ? queue[queueIndex + 1] : null;
  const nextInQueueId =
    queueIndex >= 0 && queueIndex < queue.length - 1 ? queue[queueIndex + 1]?.id ?? null : null;
  const remainingAfterApprove =
    item?.inReviewQueue && queueIndex >= 0 ? Math.max(0, queue.length - 1) : queue.length;

  if (!item || !item.preview) {
    return (
      <section className="mw-section">
        <Link href={getProjectHref(peerId, projectId)} className="mw-detail-back pg-focus-premium">
          ← Back to campaign
        </Link>
        <p className="mw-empty-inline" style={{ marginTop: 16 }}>
          This review item is not available yet.
        </p>
      </section>
    );
  }

  if (!handlersReady) {
    return (
      <section className="mw-section">
        <Link href={getProjectHref(peerId, projectId)} className="mw-detail-back pg-focus-premium">
          ← Back to campaign
        </Link>
        <p className="mw-empty-inline" style={{ marginTop: 16 }}>
          Review actions are still loading. Try again in a moment.
        </p>
      </section>
    );
  }

  return (
    <section className="mw-section mw-customer-review-page" data-testid="mw-customer-review-page">
      <Link href={getProjectHref(peerId, projectId)} className="mw-detail-back pg-focus-premium">
        ← Back to campaign
      </Link>

      <header className="mw-review-page-header">
        <p className="mw-review-doc-eyebrow">{item.artifactTypeLabel}</p>
        <h1 className="mw-detail-title">{item.title}</h1>
        <p className="mw-review-doc-byline">Prepared by Marketing Peer</p>
      </header>

      <nav className="mw-review-nav" aria-label="Review item navigation">
        {prev ? (
          <Link
            href={getCampaignReviewItemHref(peerId, projectId, prev.id)}
            className="mw-review-nav-btn pg-focus-premium"
          >
            ← Previous
          </Link>
        ) : (
          <span className="mw-review-nav-btn mw-review-nav-btn--disabled" aria-disabled>
            ← Previous
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
            Next →
          </Link>
        ) : (
          <span className="mw-review-nav-btn mw-review-nav-btn--disabled" aria-disabled>
            Next →
          </span>
        )}
      </nav>

      <div className="mw-glass mw-review-doc-shell">
        <CustomerCampaignReviewPreview preview={item.preview} />
      </div>

      <CampaignReviewActions
        peerId={peerId}
        projectId={projectId}
        item={item}
        approvalMode={project.campaignSetup?.approvalMode}
        remainingQueueCount={remainingAfterApprove}
        nextInQueueItemId={nextInQueueId}
        reviewHandlers={reviewHandlers}
      />
    </section>
  );
}
