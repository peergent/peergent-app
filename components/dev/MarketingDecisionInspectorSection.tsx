"use client";

import type { MarketingDecisionInspectorView } from "@/lib/dev/marketing-decision-inspector-view";

function StringList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      {values.length > 0 ? (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-200">
          {values.map((entry) => (
            <li key={`${label}-${entry}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-slate-500">(empty)</p>
      )}
    </div>
  );
}

function RecommendationTable({
  title,
  items,
}: {
  title: string;
  items: MarketingDecisionInspectorView["channelRecommendations"];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-300">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">(empty)</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-200">{item.label}</span>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase text-violet-200">
                  {item.status}
                </span>
                <span className="text-xs text-slate-500">rank {item.rank}</span>
              </div>
              {item.constraints.length > 0 ? (
                <p className="mt-1 text-xs text-amber-200">
                  Constraints: {item.constraints.join("; ")}
                </p>
              ) : null}
              {item.evidenceLabels.length > 0 ? (
                <p className="mt-1 text-xs text-slate-400">
                  Evidence: {item.evidenceLabels.join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type MarketingDecisionInspectorSectionProps = {
  view: MarketingDecisionInspectorView | null;
};

export default function MarketingDecisionInspectorSection({
  view,
}: MarketingDecisionInspectorSectionProps) {
  if (!view) {
    return (
      <section className="rounded-xl border border-white/10 bg-[#070b18] p-4">
        <h2 className="text-sm font-medium text-slate-200">Marketing Decision</h2>
        <p className="mt-2 text-sm text-slate-400">
          Rebuild context to assemble a deterministic{" "}
          <code className="text-violet-200">MarketingDecisionRecord</code> from the
          ContextPackage.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#070b18]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-medium text-slate-200">Marketing Decision</h2>
        <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
          {view.status}
        </span>
      </div>
      <div className="flex flex-col gap-5 p-4">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100">
          <p className="font-medium uppercase tracking-wide">Assumed dev inputs</p>
          <StringList label="" values={view.assumptions} />
        </div>
        <StringList label="Missing from ContextPackage" values={view.missingFromContext} />
        <StringList label="Hard constraints" values={view.hardConstraints} />

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase text-slate-500">Objective</p>
            <p className="text-sm text-slate-200">{view.objective || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Approval</p>
            <p className="text-sm text-slate-200">{view.approvalPolicy.mode}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/5 p-3">
            <p className="text-xs text-slate-400">Eligibility</p>
            <p className="text-sm text-slate-200">
              execute {view.eligibility.canExecute ? "yes" : "no"} · generate{" "}
              {view.eligibility.canGenerateCreative ? "yes" : "no"}
            </p>
          </div>
          <div className="rounded-lg border border-white/5 p-3">
            <p className="text-xs text-slate-400">Readiness</p>
            <p className="text-sm text-slate-200">
              {view.readiness.understandingCompleteness}% · {view.readiness.maxConfidence}
            </p>
          </div>
          <div className="rounded-lg border border-white/5 p-3">
            <p className="text-xs text-slate-400">Budget</p>
            <p className="text-sm text-slate-200">
              max {view.budgetPolicy.maxMonthlySpend} · paid{" "}
              {view.budgetPolicy.paidChannelsAllowed ? "allowed" : "blocked"}
            </p>
          </div>
        </div>

        <RecommendationTable title="Channel recommendations" items={view.channelRecommendations} />
        <RecommendationTable
          title="Content type recommendations"
          items={view.contentTypeRecommendations}
        />

        <StringList label="CTA constraints" values={view.ctaStrategy.constraints} />
        <StringList label="Forbidden claims" values={view.forbiddenClaims} />
        <StringList label="Forbidden words" values={view.forbiddenWords} />
        <StringList label="Gaps" values={view.gaps} />
        <StringList label="Evidence" values={view.evidence} />

        <details className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-300">
            Raw JSON (development only)
          </summary>
          <pre className="mt-3 max-h-80 overflow-auto text-xs text-slate-300">{view.rawJson}</pre>
        </details>
      </div>
    </section>
  );
}
