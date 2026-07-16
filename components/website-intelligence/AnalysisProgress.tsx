"use client";

import { Check, Loader2 } from "lucide-react";
import type { AnalysisStepDefinition } from "@/lib/website-intelligence";

type AnalysisProgressProps = {
  steps: AnalysisStepDefinition[];
  activeStepIndex: number;
  completedStepIds: string[];
  websiteUrl: string;
};

export default function AnalysisProgress({
  steps,
  activeStepIndex,
  completedStepIds,
  websiteUrl,
}: AnalysisProgressProps) {
  const progressPercent = Math.round(
    ((completedStepIds.length + (activeStepIndex >= 0 ? 0.35 : 0)) /
      steps.length) *
      100
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-[#0b1120]/95 via-[#0f1630]/95 to-violet-950/30 p-6 shadow-2xl shadow-violet-950/20 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-400">
            Analysis in progress
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Reading {websiteUrl}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Peergent is scanning the site, interpreting business signals, and
            building your AI workforce recommendation.
          </p>
        </div>

        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>{Math.min(progressPercent, 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {steps.map((step, index) => {
          const isComplete = completedStepIds.includes(step.id);
          const isActive = index === activeStepIndex && !isComplete;

          return (
            <div
              key={step.id}
              className={`rounded-2xl border p-4 transition-all duration-500 ${
                isComplete
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : isActive
                    ? "border-violet-500/30 bg-violet-500/10 shadow-lg shadow-violet-950/20"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    isComplete
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                      : isActive
                        ? "border-violet-500/30 bg-violet-500/15 text-violet-300"
                        : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  {isComplete ? (
                    <Check size={16} />
                  ) : isActive ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isComplete || isActive ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-6 ${
                      isComplete || isActive
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
