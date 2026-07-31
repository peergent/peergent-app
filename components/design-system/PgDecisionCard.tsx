"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import PgCard from "./PgCard";

/**
 * §5 Decision card — requests a human judgement.
 *
 * Amber left edge, exactly one primary action, and it states what approving
 * *unblocks* so the decision is informed rather than obedient (§4.1).
 *
 * §11.5 Decisions are never rows in a table.
 */

export type PgDecisionCardProps = {
  title: string;
  /** What approving unblocks. Required — this is the card's reason to exist. */
  unblocks: string;
  primaryLabel: string;
  href?: string;
  onAction?: () => void;
  /** Mono age label, e.g. "2 days". */
  ageLabel?: string | null;
  className?: string;
  testId?: string;
};

export default function PgDecisionCard({
  title,
  unblocks,
  primaryLabel,
  href,
  onAction,
  ageLabel,
  className,
  testId,
}: PgDecisionCardProps) {
  const actionClasses = cn(
    "pg-focus-premium inline-flex min-h-9 shrink-0 items-center justify-center",
    "rounded-[var(--pg-radius-sm)] bg-[var(--pg-color-accent)] px-4",
    "text-sm font-medium text-[var(--pg-color-text-inverse)]",
    "transition hover:bg-[var(--pg-color-accent-hover)]"
  );

  return (
    <PgCard
      decision
      className={cn(
        "flex flex-wrap items-start gap-[var(--pg-space-4)] sm:flex-nowrap",
        className
      )}
      data-testid={testId}
    >
      <div className="min-w-0 flex-1">
        <p className="pg-voice">{title}</p>
        <p className="pg-body pg-body--sm mt-[var(--pg-space-1)]">{unblocks}</p>
        {ageLabel ? (
          <p className="mt-[var(--pg-space-2)] text-[11.5px] text-[var(--pg-color-text-tertiary)]">
            {ageLabel}
          </p>
        ) : null}
      </div>

      {href ? (
        <Link href={href} className={actionClasses}>
          {primaryLabel}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={actionClasses}>
          {primaryLabel}
        </button>
      )}
    </PgCard>
  );
}
