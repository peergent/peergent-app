"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";

/**
 * A Peer's account of one part of her job.
 *
 * This is the Desk's storytelling unit and the component the other
 * destinations inherit. Three deliberate choices:
 *
 * 1. **No container.** A hairline above the eyebrow groups the panel; there is
 *    no box, no fill and no shadow. Five of these read as one briefing rather
 *    than as five cards.
 * 2. **Her sentence leads, the numbers follow.** The headline is a reading, not
 *    a label — the customer learns what it *means* before what it *is*.
 * 3. **Absence is a first-class state.** A panel with nothing to report renders
 *    `future` instead: what will appear here and what unlocks it. "No data" is
 *    never shown, because it teaches the customer nothing.
 */

export type PgSignalTone = "neutral" | "attention" | "positive" | "quiet";

export type PgSignalStat = {
  id: string;
  label: string;
  value: string;
  hint: string | null;
  tone: PgSignalTone;
  /** Only set when the underlying value carries a real comparison. */
  direction?: "up" | "down" | "flat" | null;
};

export type PgSignalFuture = {
  promise: string;
  unlocks: string;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export type PgSignalPanelProps = {
  eyebrow: string;
  headline: string;
  stats?: PgSignalStat[];
  future?: PgSignalFuture | null;
  futureHeading: string;
  href: string;
  openLabel: string;
  /** Accent used for the rule and the eyebrow. Identity, never state. */
  accentVar?: string;
  className?: string;
  testId?: string;
};

const TONE_COLOR: Record<PgSignalTone, string> = {
  neutral: "var(--pg-color-text-primary)",
  attention: "var(--pg-color-decision)",
  positive: "var(--pg-color-success)",
  quiet: "var(--pg-color-text-tertiary)",
};

function Stat({ stat }: { stat: PgSignalStat }) {
  const Icon =
    stat.direction === "up" ? ArrowUp : stat.direction === "down" ? ArrowDown : null;

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-baseline gap-1">
        <span
          className="text-[21px] leading-none font-semibold tabular-nums tracking-[-0.02em]"
          style={{ color: TONE_COLOR[stat.tone] }}
        >
          {stat.value}
        </span>
        {Icon ? (
          <Icon
            size={12}
            aria-hidden
            className="translate-y-[-1px]"
            style={{ color: TONE_COLOR[stat.tone] }}
          />
        ) : null}
      </span>
      <span className="truncate text-[11.5px] text-[var(--pg-color-text-tertiary)]">
        {stat.label}
      </span>
      {stat.hint ? (
        <span className="truncate text-[11px] text-[var(--pg-color-text-tertiary)] opacity-70">
          {stat.hint}
        </span>
      ) : null}
    </div>
  );
}

export default function PgSignalPanel({
  eyebrow,
  headline,
  stats = [],
  future = null,
  futureHeading,
  href,
  openLabel,
  accentVar = "var(--pg-color-accent)",
  className,
  testId,
}: PgSignalPanelProps) {
  return (
    <section
      className={cn("group/panel flex min-w-0 flex-col", className)}
      aria-label={eyebrow}
      data-testid={testId}
    >
      {/* The rule is the grouping device, and the only place identity colour
          appears in the grid: it picks up her accent when the panel is aimed
          at, so the whole column reads as one target without a card. */}
      <span
        aria-hidden
        className={cn(
          "h-px w-full bg-[var(--pg-office-line)]",
          "transition-colors duration-[var(--pg-duration-state)]",
          "group-hover/panel:bg-[var(--pg-panel-accent)]"
        )}
        style={{ ["--pg-panel-accent" as string]: accentVar }}
      />

      <Link
        href={href}
        className="pg-focus-premium flex min-w-0 flex-1 flex-col pt-[var(--pg-space-4)]"
        aria-label={openLabel}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-medium tracking-[0.09em] text-[var(--pg-color-text-tertiary)] uppercase">
            {eyebrow}
          </span>
          <ArrowUpRight
            size={12}
            aria-hidden
            className={cn(
              "text-[var(--pg-color-text-tertiary)] opacity-0",
              "transition-opacity duration-[var(--pg-duration-state)]",
              "group-hover/panel:opacity-100"
            )}
          />
        </span>

        <p
          className={cn(
            "mt-[var(--pg-space-2)] text-[14px] leading-[1.45]",
            "text-[var(--pg-color-text-secondary)]"
          )}
        >
          {headline}
        </p>

        {stats.length > 0 ? (
          <div className="mt-[var(--pg-space-4)] flex flex-wrap gap-x-[var(--pg-space-5)] gap-y-[var(--pg-space-3)]">
            {stats.map((stat) => (
              <Stat key={stat.id} stat={stat} />
            ))}
          </div>
        ) : null}
      </Link>

      {/* Not an empty state: a description of what this part of her job will
          report once it can report anything. */}
      {future ? (
        <div className="mt-[var(--pg-space-4)] flex flex-col gap-1.5">
          <span className="text-[10px] font-medium tracking-[0.09em] text-[var(--pg-color-text-tertiary)] uppercase">
            {futureHeading}
          </span>
          <p className="text-[13px] leading-snug text-[var(--pg-color-text-secondary)]">
            {future.promise}
          </p>
          <p className="text-[12px] leading-snug text-[var(--pg-color-text-tertiary)]">
            {future.unlocks}
          </p>
          {future.ctaLabel && future.ctaHref ? (
            <Link
              href={future.ctaHref}
              className="pg-focus-premium mt-0.5 self-start text-[12.5px] text-[var(--pg-color-accent)]"
            >
              {future.ctaLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
