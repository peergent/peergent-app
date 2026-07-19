"use client";

import { Check, Circle } from "lucide-react";
import WorkspacePanel from "@/components/peer-detail/WorkspacePanel";
import type { WorkSummary } from "@/lib/marketing-workspace/experience";

type WorkSummaryPanelProps = {
  summary: WorkSummary;
};

export default function WorkSummaryPanel({ summary }: WorkSummaryPanelProps) {
  const hasContent =
    summary.completedToday.length > 0 || summary.waitingOnYou.length > 0;

  return (
    <WorkspacePanel title="Work summary" compact>
      {!hasContent ? (
        <p className="text-sm text-slate-500">Your work summary will build as we collaborate.</p>
      ) : (
        <div className="space-y-4">
          {summary.completedToday.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
                Today I completed
              </p>
              <ul className="mt-2 space-y-1.5">
                {summary.completedToday.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 text-sm text-slate-400"
                  >
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-500/80" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.waitingOnYou.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
                Still waiting for you
              </p>
              <ul className="mt-2 space-y-1.5">
                {summary.waitingOnYou.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 text-sm text-slate-400"
                  >
                    <Circle size={14} className="mt-0.5 shrink-0 text-amber-500/70" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </WorkspacePanel>
  );
}
