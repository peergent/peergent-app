"use client";

import type { ReactNode } from "react";
import type { CurrentWorkModel, WorkConfidence } from "@/lib/peer-detail";
import { cn } from "@/lib/ui/cn";
import WorkspacePanel from "./WorkspacePanel";

type CurrentWorkCardProps = {
  model: CurrentWorkModel;
  reducedMotion?: boolean;
};

const confidenceStyles: Record<WorkConfidence, string> = {
  High: "text-emerald-400/90",
  Medium: "text-amber-400/85",
  Low: "text-slate-400",
  Ready: "text-slate-400",
};

function WorkField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export default function CurrentWorkCard({
  model,
  reducedMotion = false,
}: CurrentWorkCardProps) {
  return (
    <WorkspacePanel
      title="Current work"
      className={cn(
        "border-violet-500/12 bg-gradient-to-br from-white/[0.02] to-violet-950/[0.06]",
        model.isActive && !reducedMotion && "pg-workspace-live"
      )}
    >
      {model.isActive ? (
        <div className="space-y-6">
          <WorkField label="Current objective">
            <p className="text-xl font-medium tracking-tight text-white md:text-[1.35rem]">
              {model.objective}
            </p>
          </WorkField>

          <div className="grid gap-5 sm:grid-cols-2">
            <WorkField label="Reasoning">
              <p className="text-sm leading-relaxed text-slate-400">
                {model.reasoning}
              </p>
            </WorkField>

            <div className="space-y-5">
              <WorkField label="Confidence">
                <p
                  className={cn(
                    "text-sm font-medium",
                    confidenceStyles[model.confidence]
                  )}
                >
                  {model.confidence}
                </p>
              </WorkField>

              <WorkField label="Waiting for">
                <p className="text-sm text-slate-300">{model.waitingFor}</p>
              </WorkField>
            </div>
          </div>

          {model.estimatedCompletion && (
            <WorkField label="Estimated completion">
              <p className="text-sm text-slate-400">
                {model.estimatedCompletion}
              </p>
            </WorkField>
          )}
        </div>
      ) : (
        <div className="space-y-5 py-2">
          <WorkField label="Current objective">
            <p className="text-lg font-medium text-slate-300">
              {model.objective}
            </p>
          </WorkField>
          <WorkField label="Reasoning">
            <p className="text-sm leading-relaxed text-slate-500">
              {model.reasoning}
            </p>
          </WorkField>
          <WorkField label="Waiting for">
            <p className="text-sm text-slate-400">{model.waitingFor}</p>
          </WorkField>
        </div>
      )}
    </WorkspacePanel>
  );
}
