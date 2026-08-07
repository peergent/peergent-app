"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type PgActivityCardProps = {
  title: string;
  description?: string | null;
  timeLabel?: string | null;
  datetime?: string | null;
  href?: string | null;
  accentVar?: string;
  emphasis?: boolean;
  animateEnter?: boolean;
  className?: string;
  testId?: string;
};

/** P3 — single informational activity event (prefer list wrapper). */
export default function PgActivityCard({
  title,
  description,
  timeLabel,
  datetime,
  href,
  accentVar = "var(--pg-peer-marketing)",
  emphasis = false,
  animateEnter = false,
  className,
  testId,
}: PgActivityCardProps) {
  const body = (
    <>
      <span
        className="pg-ds-activity-dot"
        style={{ ["--pg-card-accent" as string]: accentVar }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[14px] text-[var(--pg-text)]",
            emphasis ? "font-semibold" : "font-medium"
          )}
        >
          {title}
        </p>
        {description || timeLabel ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[var(--pg-text-soft)]">
            {description ? <span>{description}</span> : null}
            {timeLabel ? (
              <time dateTime={datetime ?? undefined} className="pg-ds-label normal-case">
                {timeLabel}
              </time>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  const classes = cn(
    "pg-ds-activity-row pg-focus-premium",
    href && "pg-ds-activity-row--interactive",
    animateEnter && "pg-ds-enter",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} data-testid={testId}>
        {body}
      </Link>
    );
  }

  return (
    <div className={classes} data-testid={testId}>
      {body}
    </div>
  );
}

export type PgActivityListProps = {
  children: ReactNode;
  label?: string;
  className?: string;
  testId?: string;
};

export function PgActivityList({
  children,
  label = "Recent activity",
  className,
  testId = "pg-activity-list",
}: PgActivityListProps) {
  return (
    <section
      className={cn(
        "pg-ds-card rounded-[var(--pg-radius-lg)] px-[var(--pg-card-padding-lg)] py-2",
        className
      )}
      aria-label={label}
      data-testid={testId}
    >
      {children}
    </section>
  );
}
