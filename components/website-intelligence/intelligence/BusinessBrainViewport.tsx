"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import BrainCore from "@/components/website-intelligence/intelligence/BrainCore";
import type { BusinessBrainViewModel } from "@/lib/website-intelligence/assessment-presenter";
import { cn } from "@/lib/ui/cn";

type BusinessBrainViewportProps = {
  brain: BusinessBrainViewModel;
  onHireTeam: () => void;
};

export default function BusinessBrainViewport({
  brain,
  onHireTeam,
}: BusinessBrainViewportProps) {
  const [focused, setFocused] = useState(false);

  return (
    <section className="relative flex min-h-[min(720px,calc(100dvh-6rem))] flex-col justify-center py-10 md:py-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[8%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/[0.06] blur-[130px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center px-2">
        <BrainCore size="lg" className="h-[4.5rem] w-[4.5rem]" />
        <h1 className="mt-8 text-center text-[1.75rem] font-semibold tracking-tight text-white md:text-[2rem]">
          {brain.companyName}
        </h1>
        <p className="mt-2 text-center text-[11px] text-slate-600">{brain.hostname}</p>
        <div className="mt-6 flex w-full max-w-[200px] items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-violet-500/50 transition-all duration-700"
              style={{ width: `${Math.round(brain.understandingFill * 100)}%` }}
            />
          </div>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div
          className="group/narrative relative mt-14 w-full"
          onMouseEnter={() => setFocused(true)}
          onMouseLeave={() => setFocused(false)}
        >
          <div
            className="pointer-events-none absolute -top-9 left-1/2 h-9 w-px -translate-x-1/2 bg-gradient-to-b from-violet-500/25 to-transparent"
            aria-hidden
          />

          <div
            className={cn(
              "overflow-hidden rounded-[28px] border bg-gradient-to-b from-white/[0.06] to-white/[0.015] shadow-[0_28px_80px_rgba(0,0,0,0.4)] transition duration-500",
              focused
                ? "border-violet-400/25 shadow-[0_32px_88px_rgba(124,58,237,0.14)]"
                : "border-white/[0.08]"
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/[0.07] to-transparent pg-breathe" />

            <div className="relative px-8 pt-10 pb-6 md:px-10 md:pt-12">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-400/50">
                Biggest opportunity
              </p>
              <p className="mt-4 text-[1.875rem] font-medium leading-[1.12] tracking-tight text-white md:text-[2.125rem]">
                {brain.opportunity}
              </p>
            </div>

            <div className="relative border-t border-white/[0.05] px-8 py-5 md:px-10">
              <p className="text-sm leading-relaxed text-slate-500">
                {brain.opportunityReason}
              </p>
            </div>

            <div className="relative border-t border-white/[0.05] px-8 py-6 md:px-10">
              <ul className="space-y-2">
                {brain.recommendedTeam.map((member) => (
                  <li
                    key={member.name}
                    className="flex items-baseline justify-between gap-4 transition duration-300 group-hover/narrative:translate-x-0.5"
                  >
                    <span className="text-[15px] font-medium text-white/90">
                      {member.name}
                    </span>
                    <span className="text-[11px] text-slate-600">{member.role}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative border-t border-white/[0.05] p-4 md:p-5">
              <button
                type="button"
                onClick={onHireTeam}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-[18px] py-3.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98]",
                  focused
                    ? "bg-white text-violet-950 shadow-lg shadow-violet-500/10"
                    : "bg-white/[0.06] text-white/80 hover:bg-white/[0.1]"
                )}
              >
                Hire Team
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
