"use client";

import PgNeedsYouRow from "./PgNeedsYou";
import type { InboxItem } from "@/lib/inbox";
import { cn } from "@/lib/ui/cn";

type PgInboxItemProps = {
  item: InboxItem;
  className?: string;
};

/** Unified attention queue row — deep-links to Studio or Company context. */
export default function PgInboxItem({ item, className }: PgInboxItemProps) {
  return <PgNeedsYouRow item={item} className={className} />;
}

type PgInboxListProps = {
  items: InboxItem[];
  className?: string;
};

export function PgInboxList({ items, className }: PgInboxListProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-[var(--pg-radius-lg)] border border-[var(--pg-color-border-subtle)] px-4",
        className
      )}
    >
      {items.map((item) => (
        <PgInboxItem key={item.id} item={item} />
      ))}
    </div>
  );
}
