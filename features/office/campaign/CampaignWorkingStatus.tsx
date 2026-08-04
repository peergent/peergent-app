"use client";

import type { StrategyRunStatus } from "@/lib/office/campaign/strategy-run-types";

export type CampaignWorkingStatusProps = {
  headline: string;
  stageLabel?: string;
  runStatus?: StrategyRunStatus;
  locale?: string | null;
};

const STAGE_IDS = [
  "gathering_context",
  "understanding",
  "running",
  "validating",
] as const;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stageLabels(locale?: string | null): Record<(typeof STAGE_IDS)[number], string> {
  const nl = locale === "nl";
  return {
    gathering_context: nl ? "Campagnecontext verzamelen" : "Gathering campaign context",
    understanding: nl ? "Bedrijf en aanbod begrijpen" : "Understanding business and offer",
    running: nl ? "Strategie ontwikkelen" : "Developing strategy",
    validating: nl ? "Strategie controleren" : "Validating strategy",
  };
}

export function resolveWorkingStageIndex(
  runStatus: StrategyRunStatus | undefined,
  stageLabel?: string
): number {
  const lower = stageLabel?.toLowerCase() ?? "";
  if (runStatus === "validating" || lower.includes("controleert") || lower.includes("validat")) {
    return 3;
  }
  if (
    runStatus === "running" ||
    lower.includes("strategie") ||
    lower.includes("strategy")
  ) {
    return 2;
  }
  if (
    runStatus === "gathering_context" ||
    runStatus === "queued" ||
    lower.includes("context")
  ) {
    return 0;
  }
  return 1;
}

export default function CampaignWorkingStatus({
  headline,
  stageLabel,
  runStatus,
  locale,
}: CampaignWorkingStatusProps) {
  const labels = stageLabels(locale);
  const reduced = prefersReducedMotion();
  const activeIndex = resolveWorkingStageIndex(runStatus, stageLabel);

  const currentStageLabel =
    stageLabel ??
    labels[
      STAGE_IDS[Math.min(Math.max(activeIndex, 0), STAGE_IDS.length - 1)] ??
        "understanding"
    ];

  return (
    <div
      className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] p-5"
      role="status"
      aria-live="polite"
      data-testid="campaign-working-status"
    >
      <p className="pg-v13-sec-label m-0">Emma</p>
      <p className="mt-2 text-[14px] font-semibold text-[var(--pg-v13-ink)]">{headline}</p>

      <div
        className="mt-3 flex items-center gap-1.5"
        aria-hidden="true"
        data-testid="campaign-working-indicator"
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`inline-block h-1.5 w-1.5 rounded-full bg-[var(--pg-v13-blue)] ${
              reduced ? "opacity-70" : "animate-[pg-v13-pulse_1.5s_ease-in-out_infinite]"
            }`}
            style={reduced ? undefined : { animationDelay: `${index * 0.22}s` }}
          />
        ))}
      </div>

      <p className="pg-v13-mono mt-4 text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
        {locale === "nl" ? "Huidige stap" : "Current stage"}
      </p>
      <p
        className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)] transition-all duration-300"
        data-testid="campaign-working-stage-label"
      >
        {currentStageLabel}
      </p>

      <ol className="mt-3 space-y-1" aria-hidden="true">
        {STAGE_IDS.map((id, index) => {
          const isCurrent = index === activeIndex;
          const isPast = index < activeIndex;
          return (
            <li
              key={id}
              className={`text-[12px] transition-colors duration-300 ${
                isCurrent
                  ? "font-semibold text-[var(--pg-v13-ink)]"
                  : isPast
                    ? "text-[var(--pg-v13-ink-faint)]"
                    : "text-[var(--pg-v13-ink-soft)] opacity-60"
              }`}
            >
              {labels[id]}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
