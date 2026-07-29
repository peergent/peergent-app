"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review";
import { getCampaignReviewItemHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { getV17CampaignCopy } from "@/lib/i18n/v17-campaign-copy";
import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import V17StructuredReviewContent from "./V17StructuredReviewContent";
import CampaignReviewActions from "@/features/marketing-workspace/components/CampaignReviewActions";
import type { CampaignReviewWorkspaceHandlers } from "@/features/marketing-workspace/lib/campaign-review-handlers";
import { getMarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import type { CampaignApprovalMode } from "@/lib/campaign";

export type V17CampaignReviewViewProps = {
  peerId: string;
  projectId: string;
  item: CampaignReviewItem;
  queue: readonly CampaignReviewItem[];
  campaignHref: string;
  approvalMode?: CampaignApprovalMode;
  localePreference?: string | null;
  reviewHandlers: CampaignReviewWorkspaceHandlers;
  handlersReady: boolean;
};

export default function V17CampaignReviewView({
  peerId,
  projectId,
  item,
  queue,
  campaignHref,
  approvalMode,
  localePreference,
  reviewHandlers,
  handlersReady,
}: V17CampaignReviewViewProps) {
  const locale = resolveMarketingCampaignLocale(localePreference);
  const v17Copy = getV17CampaignCopy(localePreference);
  const actionCopy = useMemo(() => getMarketingCampaignCopy(locale), [locale]);

  const queueIndex = queue.findIndex((i) => i.id === item.id);
  const prev = queueIndex > 0 ? queue[queueIndex - 1] : null;
  const next = queueIndex >= 0 && queueIndex < queue.length - 1 ? queue[queueIndex + 1] : null;
  const nextInQueueId = next?.id ?? null;
  const remainingAfterApprove =
    item.inReviewQueue && queueIndex >= 0 ? Math.max(0, queue.length - 1) : queue.length;

  if (!item.preview) {
    return (
      <div className="v17-review-page" data-testid="v17-campaign-review">
        <Link href={campaignHref} className="v17-detail-back pg-focus-premium">
          {v17Copy.backToCampaign}
        </Link>
        <p className="v17-page-support">{actionCopy.reviewNotAvailable}</p>
      </div>
    );
  }

  if (!handlersReady) {
    return (
      <div className="v17-review-page" data-testid="v17-campaign-review">
        <Link href={campaignHref} className="v17-detail-back pg-focus-premium">
          {v17Copy.backToCampaign}
        </Link>
        <p className="v17-page-support">{actionCopy.reviewActionsLoading}</p>
      </div>
    );
  }

  return (
    <div className="v17-review-page" data-testid="v17-campaign-review">
      <Link href={campaignHref} className="v17-detail-back pg-focus-premium">
        {v17Copy.backToCampaign}
      </Link>

      <header className="v17-review-header">
        <p className="v17-eyebrow">{item.artifactTypeLabel}</p>
        <h1 className="v17-page-title">{item.title}</h1>
        {queue.length > 0 && queueIndex >= 0 ? (
          <p className="v17-page-support">{v17Copy.reviewPosition(queueIndex + 1, queue.length)}</p>
        ) : null}
        <p className="v17-review-byline">{v17Copy.reviewPreparedBy}</p>
      </header>

      <nav className="v17-review-nav" aria-label="Review navigation">
        {prev ? (
          <Link
            href={getCampaignReviewItemHref(peerId, projectId, prev.id)}
            className="v17-btn v17-btn--ghost v17-btn--sm pg-focus-premium"
          >
            ← {v17Copy.reviewPrevious}
          </Link>
        ) : (
          <span className="v17-btn v17-btn--ghost v17-btn--sm v17-btn--disabled" aria-disabled>
            ← {v17Copy.reviewPrevious}
          </span>
        )}
        {next ? (
          <Link
            href={getCampaignReviewItemHref(peerId, projectId, next.id)}
            className="v17-btn v17-btn--ghost v17-btn--sm pg-focus-premium"
          >
            {v17Copy.reviewNext} →
          </Link>
        ) : (
          <span className="v17-btn v17-btn--ghost v17-btn--sm v17-btn--disabled" aria-disabled>
            {v17Copy.reviewNext} →
          </span>
        )}
      </nav>

      <div className="v17-detail-card v17-review-doc-shell">
        <V17StructuredReviewContent preview={item.preview} copy={v17Copy} />
      </div>

      <CampaignReviewActions
        peerId={peerId}
        projectId={projectId}
        item={item}
        copy={actionCopy}
        approvalMode={approvalMode}
        remainingQueueCount={remainingAfterApprove}
        nextInQueueItemId={nextInQueueId}
        reviewHandlers={reviewHandlers}
        presentation="v17"
        localePreference={localePreference}
      />
    </div>
  );
}
