"use client";

import type { DecisionLogEntry } from "@/lib/peer-detail";
import WorkspacePanel from "./WorkspacePanel";

type DecisionLogProps = {
  entries: DecisionLogEntry[];
};

export default function DecisionLog({ entries }: DecisionLogProps) {
  return (
    <WorkspacePanel
      title="Decision log"
      description="Recent choices and why they were made."
    >
      <ol className="space-y-0">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className="border-b border-white/[0.04] py-4 first:pt-0 last:border-0 last:pb-0"
          >
            <div className="flex gap-4">
              <time
                className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-slate-600"
                dateTime={entry.time}
              >
                {entry.time}
              </time>
              <p className="text-sm leading-relaxed text-slate-400">
                {entry.explanation}
              </p>
            </div>
            {index < entries.length - 1 && (
              <span className="sr-only">Next decision</span>
            )}
          </li>
        ))}
      </ol>
    </WorkspacePanel>
  );
}
