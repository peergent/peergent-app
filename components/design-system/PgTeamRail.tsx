"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { peerAccentVar } from "@/lib/design-system/foundation";

/**
 * §3 The left rail lists colleagues, not app sections. This is the most
 * consequential structural decision in the product: you open Peergent and see
 * your staff.
 *
 * With one Peer the rail is hidden entirely and the customer lands directly in
 * that Peer's office — an org layer wrapped around a single item is furniture.
 * It appears at Peer #2.
 */

export type TeamRailPeer = {
  id: string;
  name: string;
  role: string;
  /** Filled dot means working; hollow means idle. */
  working: boolean;
  /** §3 Amber count, shown only when the customer is genuinely blocking work. */
  decisionCount: number;
};

export type PgTeamRailProps = {
  peers: readonly TeamRailPeer[];
  activePeerId: string;
  hireHref?: string;
  className?: string;
};

export default function PgTeamRail({
  peers,
  activePeerId,
  hireHref = "/hire",
  className,
}: PgTeamRailProps) {
  // §3 Progressive disclosure applied to navigation itself.
  if (peers.length < 2) return null;

  return (
    <nav
      aria-label="Your team"
      className={cn(
        "flex w-[212px] shrink-0 flex-col gap-[var(--pg-space-1)]",
        "border-r border-[var(--pg-color-border-subtle)]",
        "px-[var(--pg-space-3)] py-[var(--pg-space-5)]",
        className
      )}
      data-testid="pg-team-rail"
    >
      <p className="pg-label px-[var(--pg-space-2)] pb-[var(--pg-space-2)]">Your team</p>

      {peers.map((peer) => {
        const active = peer.id === activePeerId;
        const accent = peerAccentVar(peer.role);

        return (
          <Link
            key={peer.id}
            href={`/office/${peer.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pg-focus-premium group flex items-center gap-[var(--pg-space-3)]",
              "rounded-[var(--pg-radius-sm)] px-[var(--pg-space-2)] py-[var(--pg-space-2)]",
              "transition-colors duration-[var(--pg-duration-state)]",
              active
                ? "bg-[var(--pg-color-accent-subtle)]"
                : "hover:bg-[var(--pg-color-accent-subtle)]"
            )}
            data-testid={`pg-rail-peer-${peer.id}`}
          >
            <span
              className={cn(
                "pg-presence-dot",
                peer.working && "pg-presence-dot--working"
              )}
              style={{
                color: accent,
                background: peer.working ? accent : "transparent",
                boxShadow: peer.working ? undefined : `inset 0 0 0 1.5px ${accent}`,
              }}
              aria-hidden
            />

            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-[var(--pg-type-body-sm)]",
                  active
                    ? "text-[var(--pg-color-text-primary)]"
                    : "text-[var(--pg-color-text-secondary)]"
                )}
              >
                {peer.name}
              </span>
              <span className="pg-label block truncate">{peer.role}</span>
            </span>

            {peer.decisionCount > 0 ? (
              <span
                className="pg-label tabular-nums text-[var(--pg-color-decision)]"
                aria-label={`${peer.decisionCount} waiting for you`}
              >
                {peer.decisionCount}
              </span>
            ) : null}
          </Link>
        );
      })}

      <Link
        href={hireHref}
        className={cn(
          "pg-focus-premium mt-auto flex items-center gap-[var(--pg-space-2)]",
          "rounded-[var(--pg-radius-sm)] px-[var(--pg-space-2)] py-[var(--pg-space-2)]",
          "text-[var(--pg-type-body-sm)] text-[var(--pg-color-text-tertiary)]",
          "transition-colors duration-[var(--pg-duration-state)]",
          "hover:text-[var(--pg-color-text-primary)]"
        )}
      >
        <Plus size={14} aria-hidden />
        Hire
      </Link>
    </nav>
  );
}
