"use client";

import type { BrandBrainInspectorView } from "@/lib/dev/brand-brain-inspector-view";

function ModuleBadge({ state }: { state: "present" | "empty" | "missing" }) {
  if (state === "present") {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
        present
      </span>
    );
  }
  if (state === "missing") {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
        missing
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
      empty
    </span>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-200">{value || "—"}</p>
    </div>
  );
}

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

function JsonBlock({ title, items }: { title: string; items: readonly unknown[] }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-300">{title}</p>
      </div>
      {items.length > 0 ? (
        <pre className="overflow-auto text-xs leading-5 text-slate-300">
          {JSON.stringify(items, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-slate-500">(empty)</p>
      )}
    </div>
  );
}

type BrandBrainInspectorSectionProps = {
  view: BrandBrainInspectorView | null;
};

export default function BrandBrainInspectorSection({ view }: BrandBrainInspectorSectionProps) {
  if (!view) {
    return (
      <section className="rounded-xl border border-white/10 bg-[#070b18] p-4">
        <h2 className="text-sm font-medium text-slate-200">Brand Brain</h2>
        <p className="mt-2 text-sm text-slate-400">
          No <code className="text-violet-200">slices.brandBrain</code> on the current
          ContextPackage. Rebuild context to load the brand-brain layer.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#070b18]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-medium text-slate-200">Brand Brain</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              view.availability.available
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-amber-500/10 text-amber-300"
            }`}
          >
            {view.availability.available ? "available" : "unavailable"}
          </span>
          {view.availability.degraded ? (
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200">
              degraded
            </span>
          ) : null}
          <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200">
            {view.availability.completeness}% complete
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <FieldRow label="Assembled at" value={view.availability.assembledAt} />
          <FieldRow label="Organization" value={view.identity.organizationName} />
          <FieldRow
            label="Gap count"
            value={String(view.gaps.length)}
          />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Identity
            </h3>
            <ModuleBadge state={view.identity.moduleState} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <FieldRow label="Story / mission" value={view.identity.story} />
            <FieldRow label="Positioning" value={view.identity.positioning} />
            <FieldRow label="Tagline" value={view.identity.tagline} />
            <FieldRow label="Value proposition" value={view.identity.valueProposition} />
            <FieldRow label="Market category" value={view.identity.marketCategory} />
            <StringList label="Key messages" values={view.identity.keyMessages} />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Voice
            </h3>
            <ModuleBadge state={view.voice.moduleState} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <FieldRow label="Summary" value={view.voice.summary} />
            <FieldRow label="Emoji policy" value={view.voice.emojiPolicy} />
            <StringList label="Personality traits" values={view.voice.personalityTraits} />
            <StringList label="Do&apos;s" values={view.voice.dos} />
            <StringList label="Don&apos;ts" values={view.voice.donts} />
            <StringList
              label="Preferred CTA patterns"
              values={view.voice.preferredCtaPatterns}
            />
            <StringList label="Forbidden phrases" values={view.voice.forbiddenPhrases} />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Visual identity
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs text-slate-300">Colors</p>
                <ModuleBadge state={view.visualIdentity.colors.state} />
              </div>
              <JsonBlock title="Color tokens" items={view.visualIdentity.colors.items} />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs text-slate-300">Typography</p>
                <ModuleBadge state={view.visualIdentity.typography.state} />
              </div>
              <JsonBlock title="Typography tokens" items={view.visualIdentity.typography.items} />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs text-slate-300">Logo rules</p>
                <ModuleBadge state={view.visualIdentity.logoRules.state} />
              </div>
              <JsonBlock title="Logo rules" items={view.visualIdentity.logoRules.items} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Creative rules
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <FieldRow label="Hierarchy" value={view.creativeRules.hierarchyNote} />
            <FieldRow
              label="Channel constraints"
              value={view.creativeRules.channelConstraintsNote}
            />
            <FieldRow label="Safe areas" value={view.creativeRules.safeAreasNote} />
          </div>
          <div className="mt-3">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs text-slate-300">Layouts</p>
              <ModuleBadge state={view.creativeRules.layoutConstraints.state} />
            </div>
            <JsonBlock
              title="Layout constraints"
              items={view.creativeRules.layoutConstraints.items}
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Asset references
            </h3>
            <ModuleBadge state={view.assetReferences.moduleState} />
          </div>
          <JsonBlock title="References" items={view.assetReferences.items} />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Gaps
          </h3>
          {view.gaps.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {view.gaps.map((gap) => (
                <span
                  key={gap}
                  className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-xs text-amber-100"
                >
                  {gap}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No gaps recorded.</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Sources
            </h3>
            {view.sources.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-300">
                {view.sources.map((source) => (
                  <li
                    key={source.id}
                    className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <p>{source.label}</p>
                    <p className="text-xs text-slate-500">
                      {source.type} · {source.freshness}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">(empty)</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Warnings
            </h3>
            {view.warnings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-100">
                {view.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No Brand Brain warnings.</p>
            )}
          </div>
        </div>

        <details className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-300">
            Raw JSON (development only)
          </summary>
          <pre className="mt-3 max-h-80 overflow-auto text-xs leading-5 text-slate-300">
            {view.rawJson}
          </pre>
        </details>
      </div>
    </section>
  );
}
