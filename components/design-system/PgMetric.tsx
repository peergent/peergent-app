"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/ui/cn";

/**
 * A measured number, at the weight its meaning deserves.
 *
 * ## Why this exists
 *
 * The Office rendered every figure at 21px in a row of identical tiles, so
 * "revenue influenced" and "drafts written" looked like the same kind of fact.
 * They are not. One is a business outcome; the other is production activity.
 * Marketing is not about publishing content — it is about improving the
 * business — so the outcome must outrank the activity *visually*, not just
 * semantically.
 *
 * `emphasis` is that ranking, and it is the whole point of the component:
 *
 *   hero       the single number a page leads with. One per page, at most.
 *   outcome    what happened to the business. Leads a row of several.
 *   activity   what the Peer produced. Secondary by construction.
 *   support    context for either. Smallest.
 *
 * `hero` exists for the rare case where a page has a genuine headline figure
 * — Performance's revenue-influenced number, for instance — and the ordinary
 * `outcome` tier, sized to sit four-across in a row, is not large enough to
 * carry that alone. Reach for it sparingly: a page with two "hero" numbers has
 * neither.
 *
 * ## Grounding
 *
 * `delta` is the only thing that may be coloured green, and only when a real
 * prior period exists to compare against — a count is not an improvement. When
 * there is no comparison the number renders neutral, which is the honest
 * outcome rather than a missing feature.
 *
 * `methodology` is always available and never competes: how a number was
 * produced is what separates a measurement from a claim.
 */

export type PgMetricEmphasis = "hero" | "outcome" | "activity" | "support";

export type PgMetricDirection = "up" | "down" | "flat";

export type PgMetricProps = {
  label: string;
  /** Pre-formatted by the view model, including any unit or currency. */
  value: string;
  /**
   * A real period-over-period comparison. Null when none exists — which is
   * most of the time, and must stay visibly normal.
   */
  delta?: {
    direction: PgMetricDirection;
    label: string;
    /**
     * Whether "up" is good. Spend and cost-per-acquisition rise badly; reach
     * rises well. Without this the palette would congratulate a rising CPA.
     */
    upIsGood?: boolean;
  } | null;
  /** How this number was produced. Shown quietly, never omitted. */
  methodology?: string | null;
  emphasis?: PgMetricEmphasis;
  className?: string;
  testId?: string;
};

const VALUE_CLASS: Record<PgMetricEmphasis, string> = {
  hero: "pg-display tabular-nums",
  outcome: "pg-metric",
  activity: "text-[22px] leading-[1.15] font-semibold tracking-[-0.018em] tabular-nums",
  support: "text-[var(--pg-type-body)] leading-[1.3] font-semibold tabular-nums",
};

/** Hero and outcome read as headings; smaller tiers stay label-sized. */
const LABEL_CLASS: Record<PgMetricEmphasis, string> = {
  hero: "pg-meta uppercase tracking-[0.08em] text-[var(--pg-color-text-secondary)]",
  outcome: "pg-micro uppercase tracking-[0.08em]",
  activity: "pg-micro uppercase tracking-[0.08em]",
  support: "pg-micro uppercase tracking-[0.08em]",
};

/** The delta grows with its number, or a hero figure's proof-point vanishes. */
const DELTA_CLASS: Record<PgMetricEmphasis, string> = {
  hero: "text-[var(--pg-type-meta)]",
  outcome: "text-[var(--pg-type-micro)]",
  activity: "text-[var(--pg-type-micro)]",
  support: "text-[var(--pg-type-micro)]",
};

const DIRECTION_ICON = { up: ArrowUp, down: ArrowDown, flat: ArrowRight } as const;

export default function PgMetric({
  label,
  value,
  delta = null,
  methodology = null,
  emphasis = "activity",
  className,
  testId,
}: PgMetricProps) {
  const Icon = delta ? DIRECTION_ICON[delta.direction] : null;

  // Green is a claim about the business, not about the arrow's direction.
  const upIsGood = delta?.upIsGood ?? true;
  const deltaColor = !delta
    ? null
    : delta.direction === "flat"
      ? "var(--pg-color-text-tertiary)"
      : (delta.direction === "up") === upIsGood
        ? "var(--pg-state-positive)"
        : "var(--pg-state-attention)";

  return (
    <div
      className={cn("flex min-w-0 flex-col gap-1", className)}
      data-testid={testId}
      data-emphasis={emphasis}
    >
      <span className={cn(LABEL_CLASS[emphasis], "truncate")}>{label}</span>

      <span className="flex items-baseline gap-2">
        <span
          className={cn(VALUE_CLASS[emphasis], "text-[var(--pg-color-text-primary)]")}
        >
          {value}
        </span>

        {delta && Icon ? (
          <span
            className={cn(
              "flex shrink-0 items-center gap-0.5 tabular-nums",
              DELTA_CLASS[emphasis]
            )}
            style={{ color: deltaColor ?? undefined }}
          >
            <Icon size={emphasis === "hero" ? 13 : 11} aria-hidden strokeWidth={2.5} />
            {delta.label}
          </span>
        ) : null}
      </span>

      {methodology ? (
        <span className="pg-micro leading-snug">{methodology}</span>
      ) : null}
    </div>
  );
}
