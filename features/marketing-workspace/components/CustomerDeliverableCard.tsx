"use client";

import Link from "next/link";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review";
import type { CampaignArtifactCollaborationViewModel } from "@/lib/peer-experience/marketing/campaign-collaboration";
import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { formatMarketingRelativeTime } from "@/lib/i18n/marketing-campaign-copy";
import { getCampaignReviewItemHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import {
  deliverableActionLabel,
  deliverableBadgeKey,
  deliverableBadgeLabel,
} from "../lib/customer-campaign-presenter";

export type CustomerDeliverableCardProps = {
  peerId: string;
  projectId: string;
  item: CampaignReviewItem;
  copy: MarketingCampaignCopy;
  collaborationArtifact?: CampaignArtifactCollaborationViewModel | null;
  compact?: boolean;
};

export default function CustomerDeliverableCard({
  peerId,
  projectId,
  item,
  copy,
  collaborationArtifact,
  compact = false,
}: CustomerDeliverableCardProps) {
  const badgeKey = deliverableBadgeKey(item);
  const badge = deliverableBadgeLabel(badgeKey, copy);
  const actionLabel = deliverableActionLabel(item, copy);
  const updatedAt =
    collaborationArtifact?.lastUpdatedAt ?? item.updatedAt ?? item.decidedAt;
  const relative =
    updatedAt != null ? formatMarketingRelativeTime(updatedAt, copy) : null;
  const version = collaborationArtifact?.currentVersion ?? item.artifactVersion;

  return (
    <article
      className={`mw-glass mw-customer-deliverable-card${compact ? " mw-customer-deliverable-card--compact" : ""}`}
      data-testid="mw-customer-deliverable-card"
    >
      <div className="mw-customer-deliverable-head">
        <p className="mw-customer-deliverable-type">{item.artifactTypeLabel}</p>
        <span className={`mw-deliverable-badge mw-deliverable-badge--${badgeKey}`}>
          {badge}
        </span>
      </div>
      <h3 className="mw-customer-deliverable-title">{item.title}</h3>
      {!compact && item.shortSummary ? (
        <p className="mw-customer-deliverable-summary">{item.shortSummary}</p>
      ) : null}
      <p className="mw-customer-deliverable-meta">
        {copy.versionLabel(version)}
        {relative ? ` · ${copy.updatedRelative(relative)}` : ""}
      </p>
      {actionLabel ? (
        <Link
          href={getCampaignReviewItemHref(peerId, projectId, item.id)}
          className="mw-btn-secondary mw-customer-deliverable-action pg-focus-premium"
        >
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}
