"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";

/**
 * A chart that has no data yet, drawn honestly.
 *
 * §12 forbids fabricated analytics, and a placeholder series is a fabricated
 * analytic — a shape the eye reads as a trend. So this frame draws the *chart*
 * and nothing else: plot area, gridlines, an axis. There is no line, no bars
 * and no silhouette to misread.
 *
 * What fills the space instead is the reason: which measurement will appear
 * here and what has to be connected for it to exist. The customer should be
 * able to see the future value of the page without being shown invented proof
 * that it already works.
 *
 * Once a real series exists it is passed as `children` and rendered inside the
 * same frame, so the page does not change shape when data arrives.
 */

export type PgChartFrameProps = {
  title: string;
  /** What this chart will measure, in plain language. */
  promise: string;
  /** The specific thing that has to happen first. */
  unlocks?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  /** A real series. When present, the explanation is not shown. */
  children?: ReactNode;
  height?: number;
  className?: string;
  testId?: string;
};

export default function PgChartFrame({
  title,
  promise,
  unlocks = null,
  ctaLabel = null,
  ctaHref = null,
  children,
  height = 108,
  className,
  testId,
}: PgChartFrameProps) {
  const hasSeries = Boolean(children);

  return (
    <figure
      className={cn("m-0 flex min-w-0 flex-col gap-[var(--pg-space-3)]", className)}
      data-testid={testId}
    >
      <figcaption className="text-[11.5px] font-medium text-[var(--pg-color-text-secondary)]">
        {title}
      </figcaption>

      {/* The plot area, drawn and left empty. Gridlines and an axis make it
          unmistakably a chart; the absence of any series makes it
          unmistakably empty. */}
      <div
        className="relative w-full"
        style={{ height }}
        role={hasSeries ? undefined : "presentation"}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `repeating-linear-gradient(
              to top,
              var(--pg-office-line) 0px,
              var(--pg-office-line) 1px,
              transparent 1px,
              transparent ${Math.round(height / 4)}px
            )`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-px"
          style={{ background: "var(--pg-office-line-strong)" }}
        />
        <div
          aria-hidden
          className="absolute right-0 bottom-0 left-0 h-px"
          style={{ background: "var(--pg-office-line-strong)" }}
        />
        {hasSeries ? <div className="relative h-full w-full">{children}</div> : null}
      </div>

      {/* The explanation is a caption, not an overlay: nothing is written
          inside the plot area, so nothing can be mistaken for a reading. */}
      {hasSeries ? null : (
        <div className="flex flex-col gap-1">
          <p className="max-w-[46ch] text-[13px] leading-snug text-[var(--pg-color-text-secondary)]">
            {promise}
          </p>
          {unlocks ? (
            <p className="max-w-[46ch] text-[12px] leading-snug text-[var(--pg-color-text-tertiary)]">
              {unlocks}
            </p>
          ) : null}
          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className="pg-focus-premium mt-0.5 self-start text-[12.5px] text-[var(--pg-color-accent)]"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      )}
    </figure>
  );
}
