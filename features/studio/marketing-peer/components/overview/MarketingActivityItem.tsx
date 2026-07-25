"use client";

import Link from "next/link";
import type { MarketingActivity } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";

export type MarketingActivityItemProps = {
  activity: MarketingActivity;
};

export default function MarketingActivityItem({ activity }: MarketingActivityItemProps) {
  return (
    <Link href={activity.target.href} className="mp-activity-item pg-focus-premium">
      <div className="mp-activity-item__type">{activity.typeLabel}</div>
      <div className="mp-activity-item__body">
        <p className="mp-activity-item__title">{activity.title}</p>
        {(activity.channel || activity.summary) && (
          <p className="mp-activity-item__meta">
            {[activity.channel, activity.summary].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mp-activity-item__time">{activity.timeLabel}</p>
      </div>
      <span className="mp-activity-item__cta">{activity.actionLabel}</span>
    </Link>
  );
}
