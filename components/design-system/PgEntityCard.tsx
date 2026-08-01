"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import PgStateBadge, { type PgState } from "./PgStateBadge";

export type PgEntityCardProps = {
  title: string;
  subtitle?: string | null;
  status?: { state: PgState; label: string } | null;
  meta?: ReactNode;
  facts?: Array<{ label: string; value: string }>;
  progress?: { label: string; pct: number } | null;
  href?: string | null;
  ctaLabel?: string | null;
  attention?: boolean;
  leading?: ReactNode;
  className?: string;
  testId?: string;
};

export default function PgEntityCard({
  title,
  subtitle,
  status,
  meta,
  facts = [],
  progress,
  href,
  ctaLabel,
  attention = false,
  leading,
  className,
  testId,
}: PgEntityCardProps) {
  const body = (
    <>
      <div className="flex items-start gap-[var(--pg-space-3)]">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-[var(--pg-space-3)] gap-y-1">
            <h3 className="pg-title min-w-0 flex-1 text-[var(--pg-color-text-primary)]">{title}</h3>
            {status ? (
              <PgStateBadge state={status.state} label={status.label} className="shrink-0" />
            ) : null}
          </div>
          {subtitle ? (
            <p className="pg-body pg-body--sm mt-[var(--pg-space-2)]">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {progress ? (
        <div className="mt-[var(--pg-space-4)]">
          <div className="mb-1 flex justify-between gap-2 text-[11px] text-[var(--pg-color-text-tertiary)]">
            <span>{progress.label}</span>
            <span className="tabular-nums">{progress.pct}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-[var(--pg-office-inset)]"
            role="progressbar"
            aria-valuenow={progress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-[width] duration-[var(--pg-duration-enter)]"
              style={{ width: `${progress.pct}%`, background: "var(--pg-state-neutral)" }}
            />
          </div>
        </div>
      ) : null}

      {facts.length > 0 ? (
        <dl className="mt-[var(--pg-space-4)] grid gap-[var(--pg-space-3)] sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="pg-micro uppercase tracking-[0.08em]">{fact.label}</dt>
              <dd className="m-0 mt-0.5 text-[var(--pg-type-body-sm)] tabular-nums text-[var(--pg-color-text-primary)]">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {meta ? <div className="mt-[var(--pg-space-3)]">{meta}</div> : null}

      {href && ctaLabel ? (
        <Link
          href={href}
          className="pg-focus-premium mt-[var(--pg-space-4)] inline-flex items-center gap-1.5 text-[13px] text-[var(--pg-color-accent)]"
        >
          {ctaLabel}
          <ArrowRight size={12} aria-hidden />
        </Link>
      ) : null}
    </>
  );

  const classNameMerged = cn(
    "pg-entity-card pg-item-enter",
    attention && "pg-entity-card--attention",
    href && !ctaLabel && "pg-raise pg-focus-premium block",
    className
  );

  if (href && !ctaLabel) {
    return (
      <Link href={href} className={classNameMerged} data-testid={testId}>
        {body}
      </Link>
    );
  }

  return (
    <article className={classNameMerged} data-testid={testId}>
      {body}
    </article>
  );
}
