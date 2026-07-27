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
import { buildCampaignReviewBuildInput } from "../lib/build-campaign-review-input";

export type CustomerCampaignReviewExperienceProps = {
  peerId: string;
  projectId: string;
  reviewItemId: string;
  domainInput: MarketingPeerDomainInput;
  campaign: MarketingCampaignDetailViewModel;
  project: MarketingProject;
  campaignsEnabled: boolean;
};

function findReviewItem(
  items: readonly CampaignReviewItem[],
  reviewItemId: string
): CampaignReviewItem | null {
  return items.find((i) => i.id === reviewItemId || i.workUnitId === reviewItemId) ?? null;
}

function reviewNavigationQueue(items: readonly CampaignReviewItem[]): CampaignReviewItem[] {
  const queue = items.filter((i) => i.preview && (i.reviewRequired || i.status === "awaiting_review"));
  if (queue.length > 0) return [...queue];
  return items.filter((i) => i.preview);
}

export default function CustomerCampaignReviewExperience({
  peerId,
  projectId,
  reviewItemId,
  domainInput,
  campaign,
  project,
  campaignsEnabled,
}: CustomerCampaignReviewExperienceProps) {
  const reviewVm = useMemo(() => {
    const input = buildCampaignReviewBuildInput({
      peerId,
      projectId,
      domainInput,
      campaignDetail: campaign,
      project,
      campaignsEnabled,
    });
    return buildCampaignReviewViewModel(input);
  }, [peerId, projectId, domainInput, campaign, project, campaignsEnabled]);

  const item = findReviewItem(reviewVm.allReviewItems, reviewItemId);
  const queue = reviewNavigationQueue(reviewVm.reviewQueue.length > 0 ? reviewVm.reviewQueue : reviewVm.allReviewItems);
  const index = queue.findIndex((i) => i.id === reviewItemId);
  const positionLabel =
    index >= 0 && queue.length > 1 ? `Review ${index + 1} of ${queue.length}` : null;

  const prev = index > 0 ? queue[index - 1] : null;
  const next = index >= 0 && index < queue.length - 1 ? queue[index + 1] : null;

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

  return (
    <section className="mw-section mw-customer-review-page" data-testid="mw-customer-review-page">
      <Link href={getProjectHref(peerId, projectId)} className="mw-detail-back pg-focus-premium">
        ← Back to campaign
      </Link>

      <header className="mw-review-page-header">
        <p className="mw-kn-helper">{item.artifactTypeLabel}</p>
        <h1 className="mw-detail-title">{item.title}</h1>
        <p className="mw-kn-helper">Prepared by Marketing Peer</p>
        {positionLabel ? (
          <p className="mw-review-progress-label" aria-live="polite">
            {positionLabel}
          </p>
        ) : null}
      </header>

      <nav
        className="mw-review-nav"
        aria-label="Review item navigation"
        style={{ display: "flex", gap: 16, marginBottom: 16 }}
      >
        {prev ? (
          <Link
            href={getCampaignReviewItemHref(peerId, projectId, prev.id)}
            className="mw-section-link pg-focus-premium"
          >
            ← Previous
          </Link>
        ) : (
          <span className="mw-kn-helper" aria-disabled>
            ← Previous
          </span>
        )}
        {next ? (
          <Link
            href={getCampaignReviewItemHref(peerId, projectId, next.id)}
            className="mw-section-link pg-focus-premium"
          >
            Next →
          </Link>
        ) : (
          <span className="mw-kn-helper" aria-disabled>
            Next →
          </span>
        )}
      </nav>

      <div className="mw-glass mw-review-doc-shell" style={{ padding: 24, marginBottom: 20 }}>
        <CustomerCampaignReviewPreview preview={item.preview} />
      </div>

      <div className="mw-review-actions mw-review-actions--disabled" aria-disabled>
        <button type="button" className="mw-btn-primary" disabled>
          Approve
        </button>
        <button type="button" className="mw-btn-secondary" disabled>
          Request changes
        </button>
        <button type="button" className="mw-btn-secondary" disabled>
          Reject
        </button>
      </div>
      <p className="mw-kn-helper mw-review-actions-note" role="status">
        Review actions will be enabled in the next step.
      </p>
    </section>
  );
}
