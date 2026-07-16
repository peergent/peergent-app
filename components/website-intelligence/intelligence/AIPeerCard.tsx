"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { PeerViewModel } from "@/lib/website-intelligence/assessment-presenter";

type AIPeerCardProps = {
  peer: PeerViewModel;
  onDeploy: () => void;
  variant?: "primary" | "compact";
};

export default function AIPeerCard({
  peer,
  onDeploy,
  variant = "compact",
}: AIPeerCardProps) {
  const isPrimary = variant === "primary";

  if (isPrimary) {
    return (
      <article className="group relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#0c1324] to-[#070b18] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition duration-300 hover:border-violet-500/25">
        <div
          className={cn(
            "mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
            peer.employee.gradient
          )}
        >
          <Sparkles size={24} className="text-white" />
        </div>
        <p className="text-2xl font-semibold tracking-tight text-white">
          {peer.employee.name}
        </p>
        <p className="mt-1 text-sm font-medium text-violet-400/90">{peer.deployLabel}</p>
        <button
          type="button"
          onClick={onDeploy}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 active:scale-[0.98]"
        >
          Deploy
          <ArrowRight size={16} />
        </button>
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={onDeploy}
      className="group w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br",
              peer.employee.gradient
            )}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{peer.employee.name}</p>
            <p className="text-[11px] text-slate-500">{peer.deployLabel}</p>
          </div>
        </div>
        <ArrowRight
          size={14}
          className="text-slate-600 transition group-hover:text-violet-400 group-hover:translate-x-0.5"
        />
      </div>
    </button>
  );
}
