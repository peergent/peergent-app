"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import { channelMonogram } from "@/lib/design-system/office-channels";
import PgStateBadge, { type PgState } from "./PgStateBadge";

export type PgContentPreviewCardProps = {
  title: string;
  preview?: string | null;
  channelId?: string | null;
  channelLabel?: string | null;
  status: { state: PgState; label: string };
  meta?: string | null;
  performance?: Array<{ label: string; value: string }> | null;
  href?: string | null;
  featured?: boolean;
  onReview?: () => void;
  reviewLabel?: string;
  testId?: string;
};

export default function PgContentPreviewCard({
  title,
  preview,
  channelId,
  channelLabel,
  status,
  meta,
  performance,
  href,
  featured = false,
  onReview,
  reviewLabel,
  testId,
}: PgContentPreviewCardProps) {
  const mono = channelMonogram(channelId ?? null, channelLabel ?? null);

  const inner = (
    <>
      <div
        className={cn(
          "pg-content-preview__channel",
          featured && "min-h-[96px] text-[14px]"
        )}
        aria-hidden
      >
        {mono}
      </div>
      <div className="p-[var(--pg-space-4)]">
        <div className="flex flex-wrap items-center gap-2">
          {channelLabel ? (
            <span className="pg-micro uppercase tracking-[0.08em]">{channelLabel}</span>
          ) : null}
          <PgStateBadge state={status.state} label={status.label} className="ml-auto" />
        </div>
        <p className={cn("pg-voice mt-[var(--pg-space-2)]", featured && "text-[17px]")}>{title}</p>
        {preview ? (
          <p className="pg-body pg-body--sm mt-[var(--pg-space-2)] line-clamp-3">{preview}</p>
        ) : null}
        {meta ? <p className="pg-micro mt-[var(--pg-space-3)]">{meta}</p> : null}
        {performance && performance.length > 0 ? (
          <div className="mt-[var(--pg-space-3)] flex flex-wrap gap-[var(--pg-space-4)]">
            {performance.map((stat) => (
              <span key={stat.label} className="flex flex-col">
                <span className="pg-micro">{stat.label}</span>
                <span className="text-[var(--pg-type-body-sm)] tabular-nums">{stat.value}</span>
              </span>
            ))}
          </div>
        ) : null}
        {onReview && reviewLabel ? (
          <button
            type="button"
            onClick={onReview}
            className="pg-focus-premium mt-[var(--pg-space-3)] text-[13px] font-medium text-[var(--pg-color-decision)]"
          >
            {reviewLabel}
          </button>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="pg-content-preview pg-focus-premium block" data-testid={testId}>
        {inner}
      </Link>
    );
  }

  return (
    <article className="pg-content-preview" data-testid={testId}>
      {inner}
    </article>
  );
}
