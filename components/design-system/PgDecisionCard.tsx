"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";

/**
 * §5 Decision card — requests a human judgement.
 *
 * Amber left edge, exactly one primary action, and it states what approving
 * *unblocks* so the decision is informed rather than obedient (§4.1).
 *
 * §11.5 Decisions are never rows in a table.
 *
 * Canonical export name: PgApprovalCard (see PgApprovalCard.tsx).
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
  testId = "pg-approval-card",
}: PgDecisionCardProps) {
  const titleId = `${testId}-title`;
  const actionClasses = cn(
    "pg-focus-premium inline-flex min-h-9 shrink-0 items-center justify-center",
    "rounded-[var(--pg-radius-sm)] bg-[var(--pg-action-primary)] px-4",
    "text-sm font-medium text-[var(--pg-color-text-inverse)]",
    "transition hover:bg-[var(--pg-color-accent-hover)]"
  );

  return (
    <article
      className={cn(
        "pg-ds-card pg-ds-card--attention flex flex-wrap items-start gap-[var(--pg-space-4)] p-[var(--pg-card-padding)] sm:flex-nowrap",
        className
      )}
      role="group"
      aria-labelledby={titleId}
      data-testid={testId}
    >
      <div className="min-w-0 flex-1">
        <p id={titleId} className="pg-ds-voice not-italic font-medium">
          {title}
        </p>
        <p className="mt-1 text-[14px] leading-relaxed text-[var(--pg-text-soft)]">{unblocks}</p>
        {ageLabel ? (
          <p className="pg-ds-label mt-2 normal-case tracking-normal">{ageLabel}</p>
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
    </article>
  );
}
