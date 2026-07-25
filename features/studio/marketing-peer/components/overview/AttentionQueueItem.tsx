"use client";

import Link from "next/link";
import type { MarketingApprovalQueueItem } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";

export type AttentionQueueItemProps = {
  item: MarketingApprovalQueueItem;
};

export default function AttentionQueueItem({ item }: AttentionQueueItemProps) {
  return (
    <Link
      href={item.reviewHref}
      className="mp-attention-item pg-focus-premium"
      data-testid={`attention-review-${item.deliverableId}`}
    >
      {item.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnailUrl} alt="" className="mp-attention-item__thumb" />
      ) : (
        <div className="mp-attention-item__icon" aria-hidden>
          {item.channel.charAt(0)}
        </div>
      )}
      <div className="mp-attention-item__body">
        <p className="mp-attention-item__title">{item.title}</p>
        <p className="mp-attention-item__meta">
          {item.channel} · {item.attentionReason}
        </p>
        {item.dueLabel && <p className="mp-attention-item__due">{item.dueLabel}</p>}
      </div>
      <span className="mp-attention-item__cta">Review</span>
    </Link>
  );
}
