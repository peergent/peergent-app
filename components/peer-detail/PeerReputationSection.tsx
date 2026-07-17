"use client";

import type { ReputationSignal } from "@/lib/peer-detail";
import WorkspacePanel from "./WorkspacePanel";

type PeerReputationSectionProps = {
  signals: ReputationSignal[];
};

export default function PeerReputationSection({
  signals,
}: PeerReputationSectionProps) {
  return (
    <WorkspacePanel title="Reputation">
      <dl className="space-y-3">
        {signals.map((signal) => (
          <div
            key={signal.label}
            className="flex items-baseline justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0"
          >
            <dt className="text-sm text-slate-500">{signal.label}</dt>
            <dd className="text-sm font-medium text-emerald-400/85">
              {signal.value}
            </dd>
          </div>
        ))}
      </dl>
    </WorkspacePanel>
  );
}
