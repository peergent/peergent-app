"use client";

export type CampaignLifecyclePhase =
  | "draft"
  | "planning"
  | "review"
  | "scheduled"
  | "publishing"
  | "running"
  | "finished"
  | "optimizing"
  | "archived";

export type CampaignLifecycleBarProps = {
  phase: CampaignLifecyclePhase;
  locale?: string | null;
  runningLabel?: string | null;
  dateRangeLabel?: string | null;
  statusLabel?: string | null;
};

const PHASES: { id: CampaignLifecyclePhase; nl: string; en: string }[] = [
  { id: "draft", nl: "Concept", en: "Draft" },
  { id: "planning", nl: "Planning", en: "Planning" },
  { id: "review", nl: "Review", en: "Review" },
  { id: "scheduled", nl: "Ingepland", en: "Scheduled" },
  { id: "publishing", nl: "Publiceren", en: "Publishing" },
  { id: "running", nl: "Actief", en: "Running" },
  { id: "finished", nl: "Afgerond", en: "Finished" },
  { id: "optimizing", nl: "Optimaliseren", en: "Optimizing" },
];

const ORDER: CampaignLifecyclePhase[] = [
  "draft",
  "planning",
  "review",
  "scheduled",
  "publishing",
  "running",
  "finished",
  "optimizing",
];

export function resolveLifecyclePhase(input: {
  lifecycleStatus: "review" | "ready_to_schedule" | "scheduled" | "published" | "planning";
  hasPendingReview: boolean;
  isOptimizing: boolean;
}): CampaignLifecyclePhase {
  if (input.isOptimizing) return "optimizing";
  if (input.lifecycleStatus === "published") return "running";
  if (input.lifecycleStatus === "scheduled") return "scheduled";
  if (input.hasPendingReview || input.lifecycleStatus === "review") return "review";
  if (input.lifecycleStatus === "ready_to_schedule") return "review";
  return "planning";
}

export default function CampaignLifecycleBar({
  phase,
  locale,
  runningLabel,
  dateRangeLabel,
  statusLabel,
}: CampaignLifecycleBarProps) {
  const nl = locale === "nl";
  const activeIndex = ORDER.indexOf(phase);

  return (
    <section className="pg-v13-sec mb-6" data-testid="campaign-lifecycle-bar">
      <p className="pg-v13-sec-label">{nl ? "Campagnestatus" : "Campaign status"}</p>
      {(runningLabel || dateRangeLabel || statusLabel) && phase === "running" ? (
        <div className="mb-3 text-[12.5px] text-[var(--pg-v13-ink-soft)]" data-testid="campaign-lifecycle-duration">
          {runningLabel ? <span className="font-semibold text-[var(--pg-v13-ink)]">{runningLabel}</span> : null}
          {dateRangeLabel ? (
            <span>
              {runningLabel ? " · " : ""}
              {dateRangeLabel}
            </span>
          ) : null}
          {statusLabel ? (
            <p className="mt-1 pg-v13-mono text-[10px] text-[var(--pg-v13-ink-faint)]">{statusLabel}</p>
          ) : null}
        </div>
      ) : null}
      <ol className="flex flex-wrap gap-1">
        {PHASES.map((p, index) => {
          const isDone = index < activeIndex;
          const isActive = p.id === phase;
          return (
            <li
              key={p.id}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                isActive
                  ? "bg-[var(--pg-v13-blue)] text-white"
                  : isDone
                    ? "bg-[var(--pg-v13-panel)] text-[var(--pg-v13-ink)]"
                    : "text-[var(--pg-v13-ink-faint)]"
              }`}
              data-testid={`lifecycle-phase-${p.id}`}
              aria-current={isActive ? "step" : undefined}
            >
              {nl ? p.nl : p.en}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
