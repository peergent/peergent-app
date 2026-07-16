"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import PresenceIndicator from "@/components/ui/PresenceIndicator";
import DataLabelBadge from "@/components/dashboard/DataLabelBadge";
import { GapChip, SignalChip } from "@/components/website-intelligence/intelligence/IntelligenceChips";
import type { AssessmentViewModel } from "@/lib/website-intelligence/assessment-presenter";
import type { QualitativeConfidence } from "@/lib/website-intelligence";

type OverviewHeroProps = {
  model: AssessmentViewModel;
  onDeploy: () => void;
};

function confidenceTone(level: QualitativeConfidence) {
  if (level === "high") return "text-emerald-400";
  if (level === "moderate") return "text-violet-400";
  return "text-amber-400";
}

export default function OverviewHero({ model, onDeploy }: OverviewHeroProps) {
  const { meta, confidence, overview } = model;

  return (
    <section className="relative">
      <div className="pointer-events-none absolute -left-8 top-0 h-48 w-48 rounded-full bg-violet-600/[0.07] blur-3xl" />

      <div className="relative flex flex-wrap items-center gap-3">
        <PresenceIndicator mode="ready" />
        <span className="text-sm font-medium text-white">{meta.companyName}</span>
        <span className="text-xs text-slate-600">{meta.url.replace(/^https?:\/\//, "")}</span>
        <span
          className={`ml-auto text-xs font-medium ${confidenceTone(confidence.overall)}`}
        >
          {confidence.overall.charAt(0).toUpperCase() + confidence.overall.slice(1)}
        </span>
        <DataLabelBadge label="provisional" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.85fr] lg:gap-5">
        <article className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition duration-300 hover:border-violet-500/20 hover:shadow-[0_24px_64px_rgba(124,58,237,0.12)] md:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl transition group-hover:bg-violet-500/15" />
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-violet-400/80">
            Opportunity
          </p>
          <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl">
            {overview.opportunityHeadline}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{overview.opportunityAccent}</p>
        </article>

        <button
          type="button"
          onClick={onDeploy}
          className="group flex flex-col justify-between rounded-3xl border border-violet-500/20 bg-violet-500/[0.08] p-6 text-left shadow-[0_16px_48px_rgba(124,58,237,0.15)] transition duration-300 hover:border-violet-400/35 hover:bg-violet-500/[0.12] md:p-7"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-violet-300/80">
              Deploy
            </p>
            <p className="mt-3 text-xl font-semibold text-white">
              {overview.primaryPeer.employee.name}
            </p>
            <p className="mt-1 text-xs text-violet-300/70">
              {overview.primaryPeer.deployLabel}
            </p>
          </div>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-violet-300 transition group-hover:text-white">
            Deploy
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {overview.signalChips.map((chip) => (
          <SignalChip key={chip.id} insight={chip} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {overview.gapChips.map((chip) => (
          <GapChip key={chip.id} label={chip.label} href={chip.href} />
        ))}
      </div>
    </section>
  );
}
