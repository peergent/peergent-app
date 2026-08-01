"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * What requires the customer, at the top of the page and nowhere else.
 *
 * ## Why a band rather than a card
 *
 * Attention was rendered as cards in a stack, which put "two things are
 * blocked on you" at the same visual rank as everything below it. A band is a
 * different *kind* of object: it spans the content width, sits above the
 * page's subject, and disappears entirely when nothing is waiting.
 *
 * That absence is the design. A band that is always present becomes chrome and
 * stops being read; a band that appears only when something is genuinely
 * blocked keeps its meaning for the whole life of the product.
 *
 * ## Tone
 *
 * `critical` is reserved for a real fault — something is broken and she is
 * telling you unprompted. `attention` is the ordinary "needs your go-ahead".
 * The two must not blur: if every request is red, a real failure has no way
 * left to announce itself.
 */

export type PgAttentionTone = "attention" | "critical";

export type PgAttentionBandProps = {
  /** Short label above the items: "Waiting for you — 2". */
  heading: string;
  tone?: PgAttentionTone;
  children: ReactNode;
  className?: string;
  testId?: string;
};

const TONE = {
  attention: {
    rule: "var(--pg-state-attention)",
    soft: "var(--pg-state-attention-soft)",
    line: "var(--pg-state-attention-line)",
  },
  critical: {
    rule: "var(--pg-state-critical)",
    soft: "var(--pg-state-critical-soft)",
    line: "var(--pg-state-critical-line)",
  },
} as const;

export default function PgAttentionBand({
  heading,
  tone = "attention",
  children,
  className,
  testId,
}: PgAttentionBandProps) {
  const palette = TONE[tone];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--pg-radius-lg)]",
        "border px-[var(--pg-space-5)] py-[var(--pg-space-5)]",
        className
      )}
      style={{
        borderColor: palette.line,
        // A wash rather than a fill: enough to separate the band from the
        // canvas, not enough to shout over the work it is pointing at.
        background: `linear-gradient(180deg, ${palette.soft}, transparent 70%)`,
      }}
      aria-label={heading}
      data-testid={testId}
      data-tone={tone}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: palette.rule }}
      />

      <h2
        className="pg-micro font-medium tracking-[0.09em] uppercase"
        style={{ color: palette.rule }}
      >
        {heading}
      </h2>

      <div className="mt-[var(--pg-space-4)] flex flex-col gap-[var(--pg-space-3)]">
        {children}
      </div>
    </section>
  );
}
