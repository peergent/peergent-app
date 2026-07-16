import ReasoningDisclosure from "@/components/website-intelligence/intelligence/ReasoningDisclosure";
import { SignalChip } from "@/components/website-intelligence/intelligence/IntelligenceChips";
import SignalDots from "@/components/website-intelligence/intelligence/SignalDots";
import type { AssessmentViewModel, SignalState } from "@/lib/website-intelligence/assessment-presenter";
import FindingList from "@/components/website-intelligence/FindingList";

type ExecutionZoneProps = {
  zone: AssessmentViewModel["execution"];
};

function areaStrength(state: SignalState): 1 | 2 | 3 {
  if (state === "strong") return 3;
  if (state === "opportunity") return 2;
  return 1;
}

export default function ExecutionZone({ zone }: ExecutionZoneProps) {
  return (
    <section className="scroll-mt-24">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {zone.areas.map((area) => (
          <div
            key={area.id}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition duration-200 hover:border-white/[0.1] hover:bg-white/[0.03]"
          >
            <SignalDots strength={areaStrength(area.state)} state={area.state} />
            <p className="mt-3 text-xs font-medium text-slate-300">{area.name}</p>
          </div>
        ))}
      </div>

      {zone.topInsight && (
        <div className="mt-4">
          <SignalChip insight={zone.topInsight} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {zone.insights.slice(1).map((insight) => (
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
