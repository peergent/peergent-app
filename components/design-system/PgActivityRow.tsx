"use client";

import Link from "next/link";
import type { HomeMovementItem } from "@/lib/home";
import { cn } from "@/lib/ui/cn";

export type PgActivityRowProps = {
  item: HomeMovementItem;
  /** Most recent row — stronger visual weight. */
  emphasis?: boolean;
  isLast?: boolean;
  timeLabel?: string;
  className?: string;
};

/** Single row in the recent-activity timeline. */
export default function PgActivityRow({
  item,
  emphasis = false,
  isLast = false,
  timeLabel = "",
  className,
}: PgActivityRowProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        "activity-row pg-focus-premium",
        emphasis ? "activity-row-emphasis" : "activity-row-muted",
        !isLast && "activity-row-divider",
        className
      )}
    >
      <div className="activity-row-marker" aria-hidden>
        <span className={cn("activity-row-dot", emphasis && "activity-row-dot-emphasis")} />
      </div>
      <div className="activity-row-content min-w-0 flex-1">
        <p className="activity-row-title">{item.title}</p>
        <div className="activity-row-meta">
          <span className="activity-row-description">
            {item.description}
            {item.peerName ? ` · ${item.peerName}` : ""}
          </span>
          {timeLabel && (
            <>
              <span className="activity-row-separator" aria-hidden />
              <time className="activity-row-time" dateTime={item.timestamp}>
                {timeLabel}
              </time>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
