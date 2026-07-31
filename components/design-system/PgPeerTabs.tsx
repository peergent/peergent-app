"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import {
  OFFICE_DESTINATION_LIST,
  type OfficeDestinationId,
} from "@/lib/office/destinations";

/**
 * §3 Six destinations inside one office, ordered Office → Records → Agreement.
 *
 * Rendered as a segmented control rather than underlined text: an underline
 * alone gives the navigation no physical presence, which is what made the
 * chrome read as flat. The active segment is a raised plane the eye can land on.
 *
 * §3 One badge exists in the entire product: the decision count on Desk.
 */

export type PgPeerTabsProps = {
  peerId: string;
  active: OfficeDestinationId;
  decisionCount?: number;
  className?: string;
};

export default function PgPeerTabs({
  peerId,
  active,
  decisionCount = 0,
  className,
}: PgPeerTabsProps) {
  return (
    <nav
      aria-label="Peer sections"
      className={cn(
        "flex shrink-0 items-center px-[var(--pg-office-gutter)]",
        "border-b border-[var(--pg-office-line)]",
        className
      )}
      data-testid="pg-peer-tabs"
    >
      {/* Scrolls rather than wraps, so the row keeps one consistent height. */}
      <div className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 py-[var(--pg-space-2)]">
        {OFFICE_DESTINATION_LIST.map((destination) => {
          const isActive = destination.id === active;
          const showBadge = destination.badged && decisionCount > 0;

          return (
            <Link
              key={destination.id}
              href={destination.href(peerId)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "pg-focus-premium relative inline-flex shrink-0 items-center gap-2",
                "rounded-[var(--pg-radius-sm)] px-3 py-1.5",
                "text-[13.5px] whitespace-nowrap",
                "transition-colors duration-[var(--pg-duration-state)]",
                isActive
                  ? "border border-[var(--pg-office-line-strong)] bg-[var(--pg-office-panel)] font-medium text-[var(--pg-color-text-primary)] shadow-[var(--pg-office-lift)]"
                  : "border border-transparent text-[var(--pg-color-text-tertiary)] hover:bg-[var(--pg-office-panel)] hover:text-[var(--pg-color-text-secondary)]"
              )}
              data-testid={`pg-tab-${destination.id}`}
            >
              {destination.label}
              {showBadge ? (
                <span
                  className={cn(
                    "inline-flex min-w-[18px] items-center justify-center",
                    "rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums",
                    "bg-[var(--pg-color-decision-soft)] text-[var(--pg-color-decision)]"
                  )}
                  aria-label={`${decisionCount} waiting for you`}
                >
                  {decisionCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
