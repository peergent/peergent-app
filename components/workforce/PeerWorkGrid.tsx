"use client";

import Link from "next/link";
import { ArrowRight, Bot, Users } from "lucide-react";
import PeerWorkCard from "./PeerWorkCard";
import { cn } from "@/lib/ui/cn";
import type { PeerWorkGridProps } from "./types";

/**
 * Currently working — grid of peer workforce cards.
 */
export default function PeerWorkGrid({
  items,
  activeCount = 0,
  title = "Currently working",
  activeBadgeLabel,
  footerHref = "/team",
  footerLabel = "See all your peers",
  openWorkspaceLabel = "Open workspace",
  className,
}: PeerWorkGridProps) {
  if (items.length === 0) return null;

  const badge =
    activeBadgeLabel ??
    (activeCount === 1 ? "1 active" : activeCount > 0 ? `${activeCount} active` : "");

  return (
    <section className={cn("peer-work-grid", className)} aria-label={title}>
      <div className="peer-work-grid-header">
        <div className="peer-work-grid-heading">
          <Bot
            size={13}
            strokeWidth={1.8}
            className="shrink-0 text-[var(--pg-color-text-tertiary)] opacity-55"
            aria-hidden
          />
          <h2 className="peer-work-grid-title">{title}</h2>
          {activeCount > 0 && badge && (
            <span className="peer-work-grid-active-badge">
              <span className="peer-work-grid-active-dot" aria-hidden />
              {badge}
            </span>
          )}
        </div>

        {footerHref && (
          <Link href={footerHref} className="peer-work-grid-footer-link pg-focus-premium">
            <Users size={13} aria-hidden />
            <span>{footerLabel}</span>
            <ArrowRight size={12} aria-hidden />
          </Link>
        )}
      </div>

      <ul className="peer-work-grid-list">
        {items.map((item) => (
          <li key={item.peerId}>
            <PeerWorkCard item={item} openWorkspaceLabel={openWorkspaceLabel} />
          </li>
        ))}
      </ul>
    </section>
  );
}
