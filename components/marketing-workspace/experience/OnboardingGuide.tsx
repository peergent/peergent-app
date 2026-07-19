"use client";

import { Check } from "lucide-react";
import type { OnboardingStep } from "@/lib/marketing-workspace/experience";
import { cn } from "@/lib/ui/cn";

type OnboardingGuideProps = {
  steps: OnboardingStep[];
  peerName: string;
};

export default function OnboardingGuide({ steps, peerName }: OnboardingGuideProps) {
  const current = steps.find((s) => s.isCurrent);
  if (!current) return null;

  return (
    <div className="rounded-[20px] border border-violet-500/20 bg-violet-500/[0.04] p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-violet-400/80">
        Getting started with {peerName}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{current.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">{current.description}</p>

      <ol className="mt-4 space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-2.5 rounded-[12px] px-2 py-1.5 text-sm",
              step.isCurrent && "bg-white/[0.04]",
              !step.isCurrent && !step.isComplete && "opacity-50"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                step.isComplete
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : step.isCurrent
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                    : "border-white/10 text-slate-600"
              )}
            >
              {step.isComplete ? <Check size={10} /> : step.stepNumber}
            </span>
            <span className={step.isComplete ? "text-slate-500 line-through" : "text-slate-300"}>
              {step.title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
