"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { PeerWorkCardProps } from "./types";

function roleAccent(role: string): string {
  switch (role.toLowerCase()) {
    case "marketing":
      return "var(--pg-color-dept-marketing)";
    case "sales":
      return "var(--pg-color-dept-sales)";
    case "operations":
      return "var(--pg-color-dept-operations)";
    case "finance":
      return "var(--pg-color-dept-finance)";
    case "support":
      return "var(--pg-color-dept-support)";
    default:
      return "var(--pg-color-accent)";
  }
}

/**
 * Single peer card in the Currently Working grid.
 */
export default function PeerWorkCard({
  item,
  openWorkspaceLabel = "Open workspace",
  className,
}: PeerWorkCardProps) {
  const accent = roleAccent(item.role);

  return (
    <Link
      href={item.href}
      className={cn("peer-work-card pg-focus-premium", className)}
      style={{ "--peer-accent": accent } as CSSProperties}
    >
      <div className="peer-work-card-top">
        <div className="peer-work-card-identity">
          <div className="peer-work-card-avatar" aria-hidden>
            <Bot size={14} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="peer-work-card-name">{item.name}</p>
            <p className="peer-work-card-role">{item.role}</p>
          </div>
        </div>
        <span
          className={cn(
            "peer-work-status-dot",
            item.statusKind === "working" && "peer-work-status-working",
            item.statusKind === "waiting" && "peer-work-status-waiting",
            (item.statusKind === "idle" || item.statusKind === "paused") && "peer-work-status-idle",
            item.statusKind === "blocked" && "peer-work-status-blocked"
          )}
          aria-hidden
        />
      </div>

      <div className="peer-work-card-status-row">
        <span className="peer-work-card-status-label">{item.statusLabel}</span>
      </div>

      <p className="peer-work-card-detail">{item.detail}</p>

      <div className="peer-work-card-footer">
        <span className="peer-work-card-cta">
          {openWorkspaceLabel}
          <ArrowRight size={9} aria-hidden />
        </span>
      </div>
    </Link>
  );
}
