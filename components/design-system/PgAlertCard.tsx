"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";

export type PgAlertCardProps = {
  title: string;
  context: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
  className?: string;
  testId?: string;
};

/** P4 — urgent non-decision signal. Use sparingly. */
export default function PgAlertCard({
  title,
  context,
  actionLabel,
  href,
  onAction,
  className,
  testId = "pg-alert-card",
}: PgAlertCardProps) {
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
      aria-labelledby={`${testId}-title`}
      data-testid={testId}
    >
      <div className="min-w-0 flex-1">
        <p id={`${testId}-title`} className="text-[15px] font-semibold text-[var(--pg-text)]">
          {title}
        </p>
        <p className="mt-1 text-[14px] leading-relaxed text-[var(--pg-text-soft)]">{context}</p>
      </div>
      {href ? (
        <Link href={href} className={actionClasses}>
          {actionLabel}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={actionClasses}>
          {actionLabel}
        </button>
      )}
    </article>
  );
}
