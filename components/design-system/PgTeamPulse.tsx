"use client";

import Link from "next/link";
import type { HomeTeamPulseItem } from "@/lib/home";
import { cn } from "@/lib/ui/cn";

const STATUS_DOT: Record<HomeTeamPulseItem["statusKind"], string> = {
  waiting: "bg-[var(--pg-color-status-waiting)]",
  working: "bg-[var(--pg-color-status-working)] pg-pulse-live",
  idle: "bg-[var(--pg-color-status-idle)]",
  blocked: "bg-[var(--pg-color-status-blocked)]",
  paused: "bg-[var(--pg-color-status-idle)]",
};

type PgTeamPulseSectionProps = {
  title: string;
  items: HomeTeamPulseItem[];
  footerHref?: string;
  footerLabel?: string;
  className?: string;
};

export default function PgTeamPulseSection({
  title,
  items,
  footerHref,
  footerLabel,
  className,
}: PgTeamPulseSectionProps) {
  if (items.length === 0) return null;

  return (
    <section aria-label={title} className={cn(className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">
          {title}
        </h2>
        {footerHref && footerLabel && (
          <Link
            href={footerHref}
            className="pg-focus-premium text-xs font-medium text-[var(--pg-color-accent)]"
          >
            {footerLabel}
          </Link>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.peerId}>
            <Link
              href={item.href}
              className={cn(
                "pg-focus-premium flex min-h-[52px] items-start gap-3 rounded-[var(--pg-radius-md)]",
                "px-2 py-2 transition hover:bg-[var(--pg-color-accent-muted)]/30"
              )}
            >
              <span
                className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", STATUS_DOT[item.statusKind])}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--pg-color-text-primary)]">
                    {item.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">
                    {item.statusLabel}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-[var(--pg-color-text-secondary)]">
                  {item.detail}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
