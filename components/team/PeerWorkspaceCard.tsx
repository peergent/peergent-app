"use client";

import Link from "next/link";
import { ArrowRight, Pause } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { PeerWorkspace } from "@/lib/team/types";
import { cn } from "@/lib/ui/cn";

type PeerWorkspaceCardProps = {
  peer: PeerWorkspace;
  delayClass?: string;
};

const statusStyles = {
  working: "text-[var(--pg-status-working-fg)]",
  paused: "text-[var(--pg-status-paused-fg)]",
  idle: "text-[var(--pg-status-idle-fg)]",
} as const;

export default function PeerWorkspaceCard({ peer, delayClass }: PeerWorkspaceCardProps) {
  const presence = peer.workStatus === "working" ? "live" : peer.workStatus === "idle" ? "idle" : "offline";

  return (
    <article
      className={cn(
        "pg-card-elevated group hover:-translate-y-0.5",
        delayClass
      )}
    >
      <Link href={peer.workspaceHref} className="block p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar
              name={peer.name}
              gradient={peer.gradient}
              size="lg"
              presence={presence}
            />
            <div className="min-w-0 pt-1">
              <p className="pg-field-label normal-case tracking-[0.16em]">
                {peer.roleFocus}
              </p>
              <h2 className="mt-1 text-lg font-medium tracking-tight text-[var(--pg-text)]">
                {peer.name}
              </h2>
              <p
                className={cn(
                  "mt-2 flex items-center gap-2 text-sm font-medium",
                  statusStyles[peer.workStatus]
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    peer.workStatus === "working" && "bg-[var(--pg-status-working-fg)] pg-pulse-live",
                    peer.workStatus === "paused" && "bg-[var(--pg-status-paused-fg)]",
                    peer.workStatus === "idle" && "bg-[var(--pg-status-idle-fg)]"
                  )}
                  aria-hidden
                />
                {peer.statusLabel}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-[var(--pg-text-muted)]">
          {peer.currentTask}
        </p>

        {peer.todayMetrics.length > 0 && (
          <div className="mt-6 border-t border-[var(--pg-divider-line)] pt-5">
            <p className="pg-field-label normal-case tracking-[0.16em]">Today</p>
            <dl className="mt-3 grid grid-cols-3 gap-3">
              {peer.todayMetrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs text-[var(--pg-label-text)]">{metric.label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tracking-tight text-[var(--pg-text)]">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Link>

      <div className="flex flex-wrap gap-2 px-6 pb-6 md:px-7 md:pb-7">
        <Link href={peer.workspaceHref} className="pg-btn-contrast pg-hover-lift pg-focus-premium">
          {peer.workspaceLabel}
          <ArrowRight size={15} strokeWidth={2} />
        </Link>
        <button
          type="button"
          className="pg-btn-secondary pg-focus-premium"
          aria-label={`Pause ${peer.name}`}
        >
          <Pause size={14} strokeWidth={2} />
          Pause
        </button>
      </div>
    </article>
  );
}
