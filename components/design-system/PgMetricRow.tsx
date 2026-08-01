"use client";

import { cn } from "@/lib/ui/cn";
import PgMetric, { type PgMetricProps } from "./PgMetric";

/**
 * A band of measured numbers — the business, stated in seconds.
 *
 * ## Density, and why it exists now
 *
 * `density` is not styling. It is the seam along which the Desk becomes the
 * Command Center.
 *
 * The Desk is the workspace for one Peer; the Command Center will be the
 * workspace across every Peer. If the KPI band can render both at full weight
 * (one Peer, page-leading) and compact (one Peer among many, tiled), then the
 * Command Center is a layout over units that already exist rather than a
 * second design language to keep in sync. Building the seam now costs one
 * prop; retrofitting it later costs a rewrite.
 *
 * ## Grounding
 *
 * This renders what it is given and never pads. Four metrics render as four,
 * two render as two, and an empty set renders nothing at all rather than a row
 * of dashes — an empty tile reads as a broken integration, which is a claim
 * about the customer's setup that we have no business making.
 */

export type PgMetricRowDensity = "full" | "compact";

export type PgMetricRowProps = {
  metrics: (PgMetricProps & { id: string })[];
  density?: PgMetricRowDensity;
  className?: string;
  testId?: string;
};

export default function PgMetricRow({
  metrics,
  density = "full",
  className,
  testId,
}: PgMetricRowProps) {
  if (metrics.length === 0) return null;

  const compact = density === "compact";

  return (
    <div
      className={cn(
        "grid",
        compact
          ? "grid-cols-2 gap-x-[var(--pg-space-4)] gap-y-[var(--pg-space-3)]"
          : "grid-cols-2 gap-x-[var(--pg-space-6)] gap-y-[var(--pg-space-6)] lg:grid-cols-4",
        className
      )}
      data-testid={testId}
      data-density={density}
    >
      {metrics.map(({ id, ...metric }) => (
        <PgMetric
          key={id}
          {...metric}
          // Compact tiles cannot carry a full outcome treatment without
          // breaking the grid; they step down one tier and keep the ranking.
          emphasis={
            compact && metric.emphasis === "outcome" ? "activity" : metric.emphasis
          }
          methodology={compact ? null : metric.methodology}
          testId={`metric-${id}`}
        />
      ))}
    </div>
  );
}
