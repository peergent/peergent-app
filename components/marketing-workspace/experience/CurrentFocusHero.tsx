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
import ThinkingState from "@/components/ui/ThinkingState";
import type { WorkNarrative } from "@/lib/marketing-workspace/experience";
import type { PeerPresenceId, ArtifactSection } from "@/lib/marketing-workspace/experience";
import type { RecommendedAction } from "@/lib/marketing-workspace";
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

const COLOR_RING: Record<string, string> = {
  slate: "border-white/10",
  violet: "border-violet-500/30",
  fuchsia: "border-fuchsia-500/30",
  amber: "border-amber-500/30",
  emerald: "border-emerald-500/30",
  red: "border-red-500/30",
  cyan: "border-cyan-500/30",
};

type CurrentFocusHeroProps = {
  narrative: WorkNarrative;
  peerName: string;
  generating: boolean;
  generatingLabel?: string;
  onPrimaryAction: (action: RecommendedAction) => void;
  onProgressNavigate?: (section: ArtifactSection) => void;
};

const PROGRESS_TARGETS: Record<string, ArtifactSection> = {
  "Marketing understanding reviewed": "understanding",
  "Marketing strategy": "strategy",
  "Execution plan": "plan",
};

export default function CurrentFocusHero({
  narrative,
  peerName,
  generating,
  generatingLabel,
  onPrimaryAction,
  onProgressNavigate,
}: CurrentFocusHeroProps) {
  const { focus, presence, primaryRecommendation, needsFromYou, progressCompleted } =
    narrative;
  const Icon = ICONS[presence.id];

  return (
    <section
      className={cn(
        "rounded-[24px] border bg-gradient-to-br from-white/[0.04] to-transparent p-6 md:p-8",
        COLOR_RING[presence.color] ?? "border-white/[0.08]"
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-black/30",
            COLOR_RING[presence.color]
          )}
        >
          <Icon size={20} className="text-slate-300" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
            {peerName} · {presence.label}
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-snug text-white md:text-xl">
            {focus.headline}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            {focus.detail}
          </p>
          {!generating && (
            <p className="mt-1 text-xs text-slate-600">{presence.description}</p>
          )}
        </div>
      </div>

      {generating && generatingLabel && (
        <div className="mt-5">
          <ThinkingState mode="thinking" label={generatingLabel} />
        </div>
      )}

      {!generating && primaryRecommendation && (
        <div className="mt-6 rounded-[16px] border border-violet-500/20 bg-violet-500/[0.06] p-4">
          <p className="text-sm leading-relaxed text-slate-300">
            {primaryRecommendation.peerMessage}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {primaryRecommendation.why}
          </p>
          {primaryRecommendation.actionLabel && (
            <button
              type="button"
              onClick={() =>
                onPrimaryAction({
                  id: primaryRecommendation.id,
                  title: primaryRecommendation.actionLabel!,
                  description: primaryRecommendation.why,
                  priority: primaryRecommendation.priority,
                  kind: primaryRecommendation.kind,
                  planActivityReference: primaryRecommendation.planActivityReference,
                })
              }
              className="pg-focus-premium mt-4 inline-flex items-center gap-2 rounded-[12px] bg-violet-600 px-4 py-2 text-sm font-medium text-white"
            >
              {primaryRecommendation.actionLabel}
            </button>
          )}
        </div>
      )}

      {needsFromYou.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-500/80">
            What I need from you
          </p>
          <ul className="mt-2 space-y-2">
            {needsFromYou.map((need) => (
              <li
                key={need}
                className="flex items-start gap-2 rounded-[12px] border border-amber-500/15 bg-amber-500/[0.05] px-3 py-2 text-sm text-amber-100/90"
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0 opacity-70" />
                {need}
              </li>
            ))}
          </ul>
        </div>
      )}

      {progressCompleted.length > 0 && (
        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
            Completed so far
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {progressCompleted.map((item) => {
              const section =
                PROGRESS_TARGETS[item] ??
                (item.includes("draft") ? ("drafts" as ArtifactSection) : null);
              const Tag = section && onProgressNavigate ? "button" : "li";
              return (
                <Tag
                  key={item}
                  type={Tag === "button" ? "button" : undefined}
                  onClick={
                    section && onProgressNavigate
                      ? () => onProgressNavigate(section)
                      : undefined
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-xs text-emerald-300/90",
                    section && onProgressNavigate && "pg-focus-premium hover:bg-emerald-500/10"
                  )}
                >
                  <CheckCircle2 size={12} />
                  {item}
                </Tag>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
