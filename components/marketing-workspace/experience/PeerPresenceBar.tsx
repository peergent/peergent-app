"use client";

import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Loader2,
  PauseCircle,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react";
import type { PeerPresence, PeerPresenceId } from "@/lib/marketing-workspace/experience";
import { cn } from "@/lib/ui/cn";

const ICONS: Record<PeerPresenceId, typeof Brain> = {
  idle: PauseCircle,
  learning: BookOpen,
  thinking: Brain,
  strategizing: Target,
  planning: Sparkles,
  creating: PenLine,
  waiting_for_approval: Clock,
  reviewing: Loader2,
  completed: CheckCircle2,
  blocked: AlertCircle,
};

const COLOR_STYLES: Record<PeerPresence["color"], string> = {
  slate: "border-white/10 bg-white/[0.04] text-slate-400",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  fuchsia: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  red: "border-red-500/25 bg-red-500/10 text-red-300",
  cyan: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
};

type PeerPresenceBarProps = {
  presence: PeerPresence;
  peerName: string;
};

export default function PeerPresenceBar({ presence, peerName }: PeerPresenceBarProps) {
  const Icon = ICONS[presence.id];
  const updated = formatRelativeTime(presence.lastUpdated);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[16px] border px-4 py-3",
        COLOR_STYLES[presence.color]
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current/20 bg-black/20">
          <Icon size={16} aria-hidden />
        </span>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">
            {peerName} · work status
          </p>
          <p className="text-sm font-semibold">{presence.label}</p>
        </div>
      </div>
      <p className="min-w-0 flex-1 text-sm leading-relaxed opacity-90">{presence.description}</p>
      {updated && (
        <time className="text-[11px] opacity-60" dateTime={presence.lastUpdated}>
          Updated {updated}
        </time>
      )}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
