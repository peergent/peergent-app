"use client";

import type { CreativeBriefInspectorView } from "@/lib/dev/creative-brief-inspector-view";

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

type CreativeBriefInspectorSectionProps = {
  view: CreativeBriefInspectorView | null;
};

export default function CreativeBriefInspectorSection({
  view,
}: CreativeBriefInspectorSectionProps) {
  if (!view) {
    return (
      <section className="rounded-xl border border-white/10 bg-[#070b18] p-4">
        <h2 className="text-sm font-medium text-slate-200">Creative Brief</h2>
        <p className="mt-2 text-sm text-slate-400">
          Creative brief assembly runs after a permitted marketing decision is available.
        </p>
      </section>
    );
  }

  if (!view.available) {
    return (
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <h2 className="text-sm font-medium text-red-100">Creative Brief</h2>
        <p className="mt-2 text-sm text-red-100">
          {view.failure?.message ?? "Brief could not be assembled."}
        </p>
        {view.failure?.code ? (
          <p className="mt-1 text-xs text-red-200/80">Code: {view.failure.code}</p>
        ) : null}
        <StringList label="Review warnings" values={view.reviewWarnings} />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#070b18]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-medium text-slate-200">Creative Brief</h2>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
          {view.status}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {view.reviewWarnings.length > 0 ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <StringList label="Review warnings" values={view.reviewWarnings} />
          </div>
        ) : null}
        <p className="text-sm font-medium text-white">{view.title}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase text-slate-500">Campaign goal</p>
            <p className="text-sm text-slate-200">{view.campaignGoal || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Audience</p>
            <p className="text-sm text-slate-200">{view.audience.segmentLabel || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Channel</p>
            <p className="text-sm text-slate-200">{view.channel || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Content type</p>
            <p className="text-sm text-slate-200">{view.contentType || "—"}</p>
          </div>
        </div>
        <StringList label="Tone directive" values={[view.tone.directive].filter(Boolean)} />
        <StringList label="CTA guidance" values={[view.cta.primary, view.cta.secondary].filter(Boolean)} />
        <StringList
          label="Primary message"
          values={[view.messagingPriorities.primaryMessage].filter(Boolean)}
        />
        <StringList label="Forbidden claims" values={view.forbiddenClaims} />
        <StringList label="Forbidden words" values={view.forbiddenWords} />
        <StringList label="Assembly trace" values={view.assemblyTrace} />
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
