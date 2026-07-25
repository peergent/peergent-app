"use client";

import { PgActivityRow } from "@/components/design-system";
import { cn } from "@/lib/ui/cn";
import type { ActivityTimelineProps } from "./types";

/**
 * Recent activity timeline — ordered movement items from the home view model.
 */
export default function ActivityTimeline({
  items,
  title = "Recent Activity",
  viewAllHref,
  viewAllLabel = "View all",
  emptyMessage,
  formatRelativeTime,
  className,
}: ActivityTimelineProps) {
  return (
    <section className={cn("activity-timeline", className)} aria-label={title}>
      <div className="activity-timeline-header">
        <h2 className="activity-timeline-title">{title}</h2>
        {viewAllHref && items.length > 0 && (
          <a href={viewAllHref} className="activity-timeline-view-all pg-focus-premium">
            {viewAllLabel}
          </a>
        )}
      </div>

      {items.length === 0 ? (
        emptyMessage && <p className="activity-timeline-empty">{emptyMessage}</p>
      ) : (
        <div className="activity-timeline-scroll">
          <ul className="activity-timeline-list">
            {items.map((item, index) => (
              <li key={item.id}>
                <PgActivityRow
                  item={item}
                  emphasis={index === 0}
                  isLast={index === items.length - 1}
                  timeLabel={formatRelativeTime?.(item.timestamp)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
