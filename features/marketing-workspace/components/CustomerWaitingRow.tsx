"use client";

import Link from "next/link";
import { FileText, Mail, Megaphone, Palette } from "lucide-react";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review";
import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { formatMarketingRelativeTime } from "@/lib/i18n/marketing-campaign-copy";
import { getCampaignReviewItemHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import {
  deliverableBadgeKey,
  deliverableBadgeLabel,
} from "../lib/customer-campaign-presenter";

/** Returns the icon element directly so no component is constructed during render. */
function renderItemIcon(item: CampaignReviewItem) {
  const iconProps = {
    size: 18,
    className: "mw-waiting-row-icon",
    "aria-hidden": true,
  } as const;

  switch (item.artifactType) {
    case "creative_direction":
      return <Palette {...iconProps} />;
    case "linkedin_post":
      return <Megaphone {...iconProps} />;
    case "email_campaign":
      return <Mail {...iconProps} />;
    case "campaign_strategy":
    default:
      return <FileText {...iconProps} />;
  }
}

export type CustomerWaitingRowProps = {
  peerId: string;
  projectId: string;
  item: CampaignReviewItem;
  copy: MarketingCampaignCopy;
  updatedAt?: string | null;
};

export default function CustomerWaitingRow({
  peerId,
  projectId,
  item,
  copy,
  updatedAt,
}: CustomerWaitingRowProps) {
  const badgeKey = deliverableBadgeKey(item);
  const badge = deliverableBadgeLabel(badgeKey, copy);
  const relative =
    updatedAt != null ? formatMarketingRelativeTime(updatedAt, copy) : null;

  return (
    <div className="mw-waiting-row pg-hover-lift" data-testid="mw-waiting-row">
      {renderItemIcon(item)}
      <div className="mw-waiting-row-body">
        <p className="mw-waiting-row-title">{item.title}</p>
        <p className="mw-waiting-row-meta">
          <span className={`mw-deliverable-badge mw-deliverable-badge--${badgeKey}`}>
            {badge}
          </span>
          {relative ? <span className="mw-waiting-row-time">{relative}</span> : null}
        </p>
      </div>
      <Link
        href={getCampaignReviewItemHref(peerId, projectId, item.id)}
        className="mw-btn-secondary mw-waiting-row-cta pg-focus-premium pg-press"
      >
        {copy.reviewDeliverable}
      </Link>
    </div>
  );
}
