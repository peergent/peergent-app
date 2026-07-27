"use client";

import Link from "next/link";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review";
import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { getCampaignReviewItemHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import {
  deliverableBadgeKey,
  deliverableBadgeLabel,
} from "../lib/customer-campaign-presenter";

export type CustomerPreparedRowProps = {
  peerId: string;
  projectId: string;
  item: CampaignReviewItem;
  copy: MarketingCampaignCopy;
};

export default function CustomerPreparedRow({
  peerId,
  projectId,
  item,
  copy,
}: CustomerPreparedRowProps) {
  const badgeKey = deliverableBadgeKey(item);
  const badge = deliverableBadgeLabel(badgeKey, copy);

  return (
    <div className="mw-prepared-row pg-hover-lift" data-testid="mw-prepared-row">
      <div className="mw-prepared-row-body">
        <p className="mw-prepared-row-title">{item.title}</p>
        <span className={`mw-deliverable-badge mw-deliverable-badge--${badgeKey}`}>
          {badge}
        </span>
      </div>
      <Link
        href={getCampaignReviewItemHref(peerId, projectId, item.id)}
        className="mw-section-link mw-prepared-row-view pg-focus-premium"
      >
        {copy.viewDeliverable}
      </Link>
    </div>
  );
}
