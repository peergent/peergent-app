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
  working: "text-emerald-400/85",
  paused: "text-amber-400/85",
  idle: "text-slate-500",
} as const;

export default function PeerWorkspaceCard({ peer, delayClass }: PeerWorkspaceCardProps) {
  const presence = peer.workStatus === "working" ? "live" : peer.workStatus === "idle" ? "idle" : "offline";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.02] shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition duration-300",
        "hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-[0_16px_48px_rgba(0,0,0,0.28)]",
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
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                {peer.roleFocus}
              </p>
              <h2 className="mt-1 text-lg font-medium tracking-tight text-white">
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
                    peer.workStatus === "working" && "bg-emerald-400/80 pg-pulse-live",
                    peer.workStatus === "paused" && "bg-amber-400/80",
                    peer.workStatus === "idle" && "bg-slate-600"
                  )}
                  aria-hidden
                />
                {peer.statusLabel}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-slate-400">
          {peer.currentTask}
        </p>

        {peer.todayMetrics.length > 0 && (
          <div className="mt-6 border-t border-white/[0.05] pt-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
              Today
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-3">
              {peer.todayMetrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs text-slate-600">{metric.label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tracking-tight text-white/90">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Link>

      <div className="flex flex-wrap gap-2 px-6 pb-6 md:px-7 md:pb-7">
        <Link
          href={peer.workspaceHref}
          className="pg-hover-lift pg-focus-premium inline-flex min-h-11 items-center gap-2 rounded-[18px] bg-white px-5 py-2.5 text-sm font-semibold text-violet-950 transition active:scale-[0.98]"
        >
          {peer.workspaceLabel}
          <ArrowRight size={15} strokeWidth={2} />
        </Link>
        <button
          type="button"
          className="pg-focus-premium inline-flex min-h-11 items-center gap-2 rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:border-white/[0.14] hover:text-white"
          aria-label={`Pause ${peer.name}`}
        >
          <Pause size={14} strokeWidth={2} />
          Pause
        </button>
      </div>
    </article>
  );
}
