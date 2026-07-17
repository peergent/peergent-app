"use client";

import Link from "next/link";
import { MessageSquare, MoreHorizontal, Pause, Play } from "lucide-react";
import PeerRoleIcon from "@/components/peer/PeerRoleIcon";
import Avatar from "@/components/ui/Avatar";
import type { PeerWorkspaceHeaderModel } from "@/lib/peer-detail";
import { cn } from "@/lib/ui/cn";

type PeerWorkspaceHeaderProps = {
  model: PeerWorkspaceHeaderModel;
  peerRole: string;
  paused: boolean;
  onPauseToggle: () => void;
  onMoreActions: () => void;
  reducedMotion?: boolean;
};

const workStateStyles = {
  working: {
    text: "text-emerald-400/90",
    dot: "bg-emerald-400",
    pulse: true,
  },
  paused: {
    text: "text-amber-400/90",
    dot: "bg-amber-400",
    pulse: false,
  },
  idle: {
    text: "text-slate-400",
    dot: "bg-slate-500",
    pulse: false,
  },
} as const;

export default function PeerWorkspaceHeader({
  model,
  peerRole,
  paused,
  onPauseToggle,
  onMoreActions,
  reducedMotion = false,
}: PeerWorkspaceHeaderProps) {
  const stateStyle = workStateStyles[model.workState];
  const presence =
    model.workState === "working"
      ? "live"
      : model.workState === "idle"
        ? "idle"
        : "offline";

  return (
    <header className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] md:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <Avatar
            icon={<PeerRoleIcon role={peerRole} size={26} />}
            gradient={model.gradient}
            size="xl"
            presence={presence}
          />

          <div className="min-w-0 pt-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
              {model.department}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">
              {model.peerName}
            </h1>
            <p className="mt-1 text-sm text-violet-400/85">{model.role}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium",
                  stateStyle.text
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    stateStyle.dot,
                    stateStyle.pulse && !reducedMotion && "pg-pulse-live"
                  )}
                  aria-hidden
                />
                <span>{model.statusLabel}</span>
              </span>
            </div>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              {model.roleDescription}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={onPauseToggle}
            className="pg-focus-premium inline-flex min-h-10 items-center gap-2 rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/[0.14] hover:text-white"
            aria-pressed={paused}
          >
            {paused ? (
              <>
                <Play size={15} strokeWidth={2} aria-hidden />
                Resume
              </>
            ) : (
              <>
                <Pause size={15} strokeWidth={2} aria-hidden />
                Pause
              </>
            )}
          </button>

          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Messaging coming soon"
            className="pg-focus-premium inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-slate-600"
          >
            <MessageSquare size={15} strokeWidth={2} aria-hidden />
            Message peer
          </button>

          <button
            type="button"
            onClick={onMoreActions}
            className="pg-focus-premium inline-flex min-h-10 items-center gap-2 rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-white/[0.14] hover:text-white"
            aria-label="More actions"
          >
            <MoreHorizontal size={16} aria-hidden />
            <span className="hidden sm:inline">More actions</span>
          </button>
        </div>
      </div>

      <Link
        href="/peers"
        className="pg-focus-premium mt-5 inline-flex text-sm text-slate-500 transition hover:text-slate-300"
      >
        ← Back to AI Team
      </Link>
    </header>
  );
}
