"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HomeNeedsYouItem } from "@/lib/home";
import { cn } from "@/lib/ui/cn";

type PgNeedsYouRowProps = {
  item: HomeNeedsYouItem;
  className?: string;
};

export default function PgNeedsYouRow({ item, className }: PgNeedsYouRowProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        "pg-focus-premium group flex min-h-[56px] items-center justify-between gap-3",
        "border-b border-[var(--pg-color-border-subtle)] py-3 last:border-b-0",
        "transition hover:bg-[var(--pg-color-accent-muted)]/40",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.priority === "urgent" && (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[var(--pg-color-status-waiting)]"
              aria-hidden
            />
          )}
          <p className="text-sm font-medium text-[var(--pg-color-text-primary)]">{item.title}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--pg-color-text-secondary)]">
          {item.subtitle}
          {item.context ? ` · ${item.context}` : ""}
        </p>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-[var(--pg-color-text-tertiary)] transition group-hover:text-[var(--pg-color-accent)]"
        aria-hidden
      />
    </Link>
  );
}

type PgNeedsYouSectionProps = {
  title: string;
  items: HomeNeedsYouItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
};

export function PgNeedsYouSection({
  title,
  items,
  viewAllHref,
  viewAllLabel,
  className,
}: PgNeedsYouSectionProps) {
  if (items.length === 0) return null;

  return (
    <section aria-label={title} className={cn(className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">
          {title}
        </h2>
        {viewAllHref && viewAllLabel && items.length > 3 && (
          <Link
            href={viewAllHref}
            className="pg-focus-premium text-xs font-medium text-[var(--pg-color-accent)]"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="rounded-[var(--pg-radius-lg)] border border-[var(--pg-color-border-subtle)] px-4">
        {items.map((item) => (
          <PgNeedsYouRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
