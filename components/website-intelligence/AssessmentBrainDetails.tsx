"use client";

import { useMemo } from "react";
import { assessmentToBrainSnapshot } from "@/lib/context-engine/adapters/brain/business-brain-adapter";
import type { WebsiteIntelligenceAssessment } from "@/lib/website-intelligence";

type AssessmentBrainDetailsProps = {
  assessment: WebsiteIntelligenceAssessment;
};

function DetailSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-slate-300">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AssessmentBrainDetails({
  assessment,
}: AssessmentBrainDetailsProps) {
  const brain = useMemo(
    () => assessmentToBrainSnapshot(assessment),
    [assessment]
  );

  if (!brain.available) {
    return null;
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-4xl px-2 pb-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-violet-400/70">
            Completed assessment
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Business Brain summary
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Confidence {brain.confidenceScore ?? 0}% · Analyzed{" "}
          {brain.lastAnalyzedAt
            ? new Date(brain.lastAnalyzedAt).toLocaleString()
            : "recently"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 md:col-span-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Company summary
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {brain.companySummary}
          </p>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Industry
          </h3>
          <p className="mt-3 text-sm text-slate-300">{brain.industry}</p>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Target customers
          </h3>
          <p className="mt-3 text-sm text-slate-300">{brain.targetCustomers}</p>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 md:col-span-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Value proposition
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {brain.valueProposition}
          </p>
        </section>

        <DetailSection title="Strengths" items={brain.strengths ?? []} />
        <DetailSection title="Weaknesses" items={brain.weaknesses ?? []} />
        <DetailSection title="Opportunities" items={brain.opportunities ?? []} />
        <DetailSection title="Recommendations" items={brain.recommendations ?? []} />
      </div>
    </section>
  );
}
