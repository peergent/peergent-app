"use client";

import Link from "next/link";
import type { HomeCopy } from "@/lib/i18n";
import { formatHomeRelativeTime } from "@/lib/i18n";
import type { HomeMovementItem } from "@/lib/home";
import { cn } from "@/lib/ui/cn";

type PgRecentMovementProps = {
  title: string;
  items: HomeMovementItem[];
  emptyMessage: string;
  copy: HomeCopy;
  className?: string;
};

export default function PgRecentMovement({
  title,
  items,
  emptyMessage,
  copy,
  className,
}: PgRecentMovementProps) {
  return (
    <section aria-label={title} className={cn(className)}>
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="pg-focus-premium block rounded-[var(--pg-radius-md)] px-2 py-2 transition hover:bg-[var(--pg-color-accent-muted)]/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-[var(--pg-color-text-primary)]">{item.title}</p>
                  <span className="shrink-0 text-xs text-[var(--pg-color-text-tertiary)]">
                    {formatHomeRelativeTime(item.timestamp, copy)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--pg-color-text-secondary)]">
                  {item.description} · {item.peerName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
