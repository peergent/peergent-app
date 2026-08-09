"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import type {
  MarketingWorkspaceActivityBand,
  MarketingWorkspaceActivityTone,
} from "@/lib/office/workspace/types";

const TONE_DOT: Record<MarketingWorkspaceActivityTone, string> = {
  success: "🟢",
  insight: "🟣",
  attention: "🟡",
  neutral: "⚪",
};

export function MwActivityFeed({
  band,
  expanded = false,
}: {
  band: MarketingWorkspaceActivityBand;
  expanded?: boolean;
}) {
  return (
    <article
      className={cn("pg-cc6-card pg-mw-activity", expanded && "pg-mw-activity--expanded")}
      data-testid="pg-mw-activity"
    >
      <h2 className="pg-mw-activity__title">{band.title}</h2>
      {band.items.length > 0 ? (
        <ol className="pg-mw-activity-feed">
          {band.items.map((item, index) => {
            const inner = (
              <>
                <div className="pg-mw-activity-feed__head">
                  <span className="pg-mw-activity-feed__dot" aria-hidden>
                    {TONE_DOT[item.tone]}
                  </span>
                  <p className="pg-mw-activity-feed__title">{item.title}</p>
                </div>
                <time className="pg-mw-activity-feed__time" dateTime={item.timestamp}>
                  {item.timeLabel}
                </time>
                <p className="pg-mw-activity-feed__subtitle">{item.subtitle}</p>
              </>
            );

            if (item.href) {
              return (
                <li
                  key={item.id}
                  className={cn(
                    "pg-mw-activity-feed__item pg-mw-stagger-in",
                    index === 0 && "pg-mw-activity-feed__item--latest"
                  )}
                  style={{ ["--pg-mw-stagger-i" as string]: index }}
                >
                  <Link href={item.href} className="pg-mw-activity-feed__link pg-focus-premium">
                    {inner}
                  </Link>
                </li>
              );
            }

            return (
              <li
                key={item.id}
                className={cn(
                  "pg-mw-activity-feed__item pg-mw-stagger-in",
                  index === 0 && "pg-mw-activity-feed__item--latest"
                )}
                style={{ ["--pg-mw-stagger-i" as string]: index }}
              >
                {inner}
              </li>
            );
          })}
        </ol>
      ) : band.emptyMessage ? (
        <p className="pg-mw-activity__empty">{band.emptyMessage}</p>
      ) : null}
    </article>
  );
}
