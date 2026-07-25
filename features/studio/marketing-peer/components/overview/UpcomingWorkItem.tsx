"use client";

import Link from "next/link";
import type { UpcomingMarketingTask } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";

export type UpcomingWorkItemProps = {
  task: UpcomingMarketingTask;
};

export default function UpcomingWorkItem({ task }: UpcomingWorkItemProps) {
  return (
    <Link href={task.href} className="mp-upcoming-item pg-focus-premium">
      <div className="mp-upcoming-item__time">{task.timeLabel}</div>
      <div className="mp-upcoming-item__body">
        <p className="mp-upcoming-item__title">{task.title}</p>
        <p className="mp-upcoming-item__meta">
          {task.channelLabel} · {task.originLabel} · {task.approvalPolicyLabel}
        </p>
        {task.blockerReason && (
          <p className="mp-upcoming-item__blocker">{task.blockerReason}</p>
        )}
        <p className="mp-upcoming-item__status">{task.statusLabel}</p>
      </div>
    </Link>
  );
}
