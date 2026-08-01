"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export type PgTimelineItem = {
  id: string;
  label: ReactNode;
  meta?: string | null;
  href?: string | null;
  icon?: "check" | "dot";
};

export type PgTimelineProps = {
  items: PgTimelineItem[];
  className?: string;
  testId?: string;
};

export default function PgTimeline({ items, className, testId }: PgTimelineProps) {
  if (items.length === 0) return null;

  return (
    <ul className={cn("pg-timeline", className)} data-testid={testId}>
      {items.map((item) => (
        <li key={item.id} className="pg-timeline__item">
          {item.icon === "check" ? (
            <Check
              size={11}
              aria-hidden
              className="absolute top-[3px] left-0 rounded-full bg-[var(--pg-office-canvas)] text-[var(--pg-state-positive)]"
            />
          ) : (
            <span
              aria-hidden
              className="absolute top-[5px] left-[2px] h-[7px] w-[7px] rounded-full bg-[var(--pg-office-line-strong)]"
            />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="pg-focus-premium text-[13px] leading-snug text-[var(--pg-color-text-secondary)] hover:text-[var(--pg-color-text-primary)]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[13px] leading-snug text-[var(--pg-color-text-secondary)]">
              {item.label}
            </span>
          )}
          {item.meta ? (
            <span className="mt-1 block text-[11px] text-[var(--pg-color-text-tertiary)]">
              {item.meta}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
