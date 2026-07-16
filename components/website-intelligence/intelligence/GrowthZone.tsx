import ReasoningDisclosure from "@/components/website-intelligence/intelligence/ReasoningDisclosure";
import { SignalChip } from "@/components/website-intelligence/intelligence/IntelligenceChips";
import type { AssessmentViewModel } from "@/lib/website-intelligence/assessment-presenter";
import FindingList from "@/components/website-intelligence/FindingList";
import { cn } from "@/lib/ui/cn";

type GrowthZoneProps = {
  zone: AssessmentViewModel["growth"];
};

const toneStyles = {
  observed: "from-emerald-500/40 to-emerald-500/10",
  likely: "from-violet-500/40 to-violet-500/10",
  unknown: "from-slate-500/30 to-slate-500/5",
};

export default function GrowthZone({ zone }: GrowthZoneProps) {
  const total = zone.segments.reduce((sum, s) => sum + Math.max(s.count, 1), 0);

  return (
    <section className="scroll-mt-24">
      <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.04]">
          {zone.segments.map((segment) => (
            <div
              key={segment.label}
              className={cn("h-full bg-gradient-to-r", toneStyles[segment.tone])}
              style={{
                width: `${(Math.max(segment.count, 1) / total) * 100}%`,
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-slate-600">
          {zone.segments.map((s) => (
            <span key={s.label}>{s.label}</span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
        <span className="text-xs text-amber-400/90">Friction</span>
        <span className="text-sm font-medium text-white">{zone.journeyFrictionNode}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {zone.insights.map((insight) => (
          <SignalChip key={insight.id} insight={insight} />
        ))}
      </div>

      <ReasoningDisclosure className="mt-5">
        <p className="mb-3 text-slate-400">
          {zone.reasoning.confidenceLabel} — {zone.reasoning.confidenceReason}
        </p>
        <FindingList findings={zone.reasoning.findings} />
      </ReasoningDisclosure>
    </section>
  );
}
