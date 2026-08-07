"use client";

import { cn } from "@/lib/ui/cn";
import PgTimeline, { type PgTimelineItem } from "./PgTimeline";

export type PgTimelineCardProps = {
  triggerLabel: string;
  items: readonly PgTimelineItem[];
  defaultOpen?: boolean;
  className?: string;
  testId?: string;
};

/** P4 — process depth disclosure. Closed by default. */
export default function PgTimelineCard({
  triggerLabel,
  items,
  defaultOpen = false,
  className,
  testId = "pg-timeline-card",
}: PgTimelineCardProps) {
  if (items.length === 0) return null;

  return (
    <details
      className={cn("pg-ds-timeline-disclosure", className)}
      data-testid={testId}
      open={defaultOpen}
    >
      <summary>{triggerLabel}</summary>
      <div className="mt-3 rounded-[var(--pg-radius-md)] border border-[var(--pg-border-soft)] bg-[var(--pg-office-inset,var(--pg-v13-panel))] p-[var(--pg-card-padding)]">
        <PgTimeline items={[...items]} testId={`${testId}-timeline`} />
      </div>
    </details>
  );
}
