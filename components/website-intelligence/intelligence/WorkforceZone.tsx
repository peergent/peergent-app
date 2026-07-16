"use client";

import { ArrowRight } from "lucide-react";
import AIPeerCard from "@/components/website-intelligence/intelligence/AIPeerCard";
import { GapChip } from "@/components/website-intelligence/intelligence/IntelligenceChips";
import type { AssessmentViewModel, PeerViewModel } from "@/lib/website-intelligence/assessment-presenter";

type WorkforceZoneProps = {
  peers: PeerViewModel[];
  decision: AssessmentViewModel["decision"];
  onDeploy: (peer: PeerViewModel) => void;
};

export default function WorkforceZone({ peers, decision, onDeploy }: WorkforceZoneProps) {
  const [primary, ...rest] = peers;

  return (
    <section className="scroll-mt-24">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {primary && (
          <AIPeerCard
            peer={primary}
            variant="primary"
            onDeploy={() => onDeploy(primary)}
          />
        )}

        <div className="flex flex-col gap-2">
          {rest.map((peer) => (
            <AIPeerCard
              key={peer.employee.name}
              peer={peer}
              onDeploy={() => onDeploy(peer)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/[0.08] bg-gradient-to-r from-white/[0.04] to-transparent p-6">
        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-600">
          Recommendation
        </p>
        <p className="mt-2 text-lg font-semibold text-white">Start with {decision.peerName}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {decision.whyChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-400"
            >
              {chip}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {primary && (
            <button
              type="button"
              onClick={() => onDeploy(primary)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              Deploy {decision.peerName}
              <ArrowRight size={14} />
            </button>
          )}
          {decision.connectChips.map((chip) => (
            <GapChip key={chip.id} label={chip.label} href={chip.href} />
          ))}
        </div>
      </div>
    </section>
  );
}
