"use client";

import PresenceIndicator from "@/components/ui/PresenceIndicator";
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
  const activeStep =
    activeStepIndex >= 0 && activeStepIndex < steps.length
      ? steps[activeStepIndex]
      : null;

  const completedCount = completedStepIds.length;

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center gap-3">
        <PresenceIndicator mode="thinking" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {websiteUrl.replace(/^https?:\/\//, "")}
          </p>
          {activeStep && (
            <p className="mt-1 text-xs text-violet-400/90">{activeStep.label}</p>
          )}
        </div>
      </div>

      <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(((completedCount + (activeStep ? 0.4 : 0)) / steps.length) * 100, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
