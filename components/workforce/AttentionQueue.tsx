"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { AttentionQueueProps } from "./types";

/**
 * Needs-attention queue — remaining items after the primary work card.
 */
export default function AttentionQueue({
  items,
  title = "Needs your attention",
  viewAllHref,
  viewAllLabel = "View all",
  className,
}: AttentionQueueProps) {
  if (items.length === 0) return null;

  return (
    <section className={cn("attention-queue", className)} aria-label={title}>
      <div className="attention-queue-header">
        <h2 className="attention-queue-title">{title}</h2>
        <span className="attention-queue-count" aria-label={`${items.length} items`}>
          {items.length}
        </span>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="attention-queue-view-all pg-focus-premium ml-auto text-[11px] font-medium text-[var(--pg-color-text-tertiary)] transition hover:text-[var(--pg-color-text-secondary)]"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>

      <ul className="attention-queue-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "attention-queue-row pg-focus-premium",
                item.priority === "urgent" && "attention-queue-row-urgent"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="attention-queue-row-title">{item.title}</span>
                <span className="attention-queue-row-subtitle">
                  {item.subtitle}
                  {item.context ? ` · ${item.context}` : ""}
                </span>
              </span>
              <ChevronRight
                size={14}
                className="shrink-0 text-[var(--pg-color-text-disabled)] opacity-60"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
