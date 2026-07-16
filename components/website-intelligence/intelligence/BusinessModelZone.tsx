import ReasoningDisclosure from "@/components/website-intelligence/intelligence/ReasoningDisclosure";
import { SignalChip } from "@/components/website-intelligence/intelligence/IntelligenceChips";
import type { AssessmentViewModel } from "@/lib/website-intelligence/assessment-presenter";
import FindingList from "@/components/website-intelligence/FindingList";

type BusinessModelZoneProps = {
  zone: AssessmentViewModel["businessModel"];
};

export default function BusinessModelZone({ zone }: BusinessModelZoneProps) {
  return (
    <section className="scroll-mt-24">
      <div className="flex flex-wrap gap-2">
        {zone.pills.map((pill) => (
          <div
            key={pill.label}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition duration-200 hover:border-white/[0.1]"
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-600">{pill.label}</p>
            <p className="mt-1 text-sm font-medium text-white">{pill.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
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
