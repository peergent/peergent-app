"use client";

import Link from "next/link";
import type { HomeWorkstreamItem } from "@/lib/home";
import { cn } from "@/lib/ui/cn";

type PgActiveWorkstreamsProps = {
  title: string;
  items: HomeWorkstreamItem[];
  emptyMessage: string;
  className?: string;
};

export default function PgActiveWorkstreams({
  title,
  items,
  emptyMessage,
  className,
}: PgActiveWorkstreamsProps) {
  return (
    <section aria-label={title} className={cn(className)}>
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--pg-color-text-secondary)]">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "pg-focus-premium block rounded-[var(--pg-radius-lg)] border border-[var(--pg-color-border-subtle)]",
                  "px-4 py-3 transition hover:border-[var(--pg-color-border)] hover:bg-[var(--pg-color-accent-muted)]/20"
                )}
              >
                <p className="text-sm font-medium text-[var(--pg-color-text-primary)]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-[var(--pg-color-text-secondary)]">
                  {item.peerName} · {item.progressLabel} · {item.statusLabel}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
