"use client";

import type { CampaignWorkflowStep } from "@/lib/office/campaign/workflow-types";

const CHECK = (
  <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden className="shrink-0">
    <path
      d="M20 6L9 17l-5-5"
      fill="none"
      stroke="var(--pg-v13-success)"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ACTIVE = (
  <span
    className="mt-0.5 inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--pg-v13-blue)]"
    aria-hidden
  />
);

const SKIPPED = (
  <span
    className="mt-0.5 inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-[var(--pg-v13-ink-faint)] text-[9px] text-[var(--pg-v13-ink-faint)]"
    aria-hidden
  >
    —
  </span>
);

const UPCOMING = (
  <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden className="shrink-0">
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="var(--pg-v13-ink-faint)" strokeWidth={2} />
  </svg>
);

export type CampaignWorkflowTimelineProps = {
  steps: readonly CampaignWorkflowStep[];
  locale?: string | null;
  onStepClick?: (step: CampaignWorkflowStep) => void;
  compact?: boolean;
};

export default function CampaignWorkflowTimeline({
  steps,
  locale,
  onStepClick,
  compact = false,
}: CampaignWorkflowTimelineProps) {
  const nl = locale === "nl";

  return (
    <section className="pg-v13-sec" data-testid="campaign-workflow-timeline">
      <p className="pg-v13-sec-label">{nl ? "Workflow" : "Workflow"}</p>
      <ol className="pg-v13-workflow-list m-0 list-none p-0">
        {steps.map((step) => {
          const icon =
            step.state === "done"
              ? CHECK
              : step.state === "active"
                ? ACTIVE
                : step.state === "skipped"
                  ? SKIPPED
                  : UPCOMING;
          const clickable = step.hasEvidence && onStepClick;

          return (
            <li key={step.id}>
              <button
                type="button"
                className={
                  clickable
                    ? "pg-v13-workflow-step pg-v13-workflow-step--clickable w-full"
                    : `pg-v13-workflow-step pg-v13-workflow-step--${step.state} w-full`
                }
                disabled={!clickable}
                onClick={() => clickable && onStepClick(step)}
                aria-current={step.state === "active" ? "step" : undefined}
              >
                <span className="pg-v13-workflow-icon">{icon}</span>
                <span className="min-w-0 flex-1 text-left">
                  <span
                    className={
                      step.state === "active"
                        ? "block text-[13.5px] font-bold text-[var(--pg-v13-ink)]"
                        : step.state === "done"
                          ? "block text-[13.5px] text-[var(--pg-v13-ink)]"
                          : step.state === "skipped"
                            ? "block text-[13.5px] text-[var(--pg-v13-ink-soft)]"
                            : "block text-[13.5px] text-[var(--pg-v13-ink-faint)]"
                    }
                  >
                    {step.label}
                  </span>
                  {step.statusHint && !compact ? (
                    <span
                      className={
                        step.state === "skipped"
                          ? "mt-0.5 block text-[11.5px] text-[var(--pg-v13-ink-faint)]"
                          : "mt-0.5 block text-[11.5px] text-[var(--pg-v13-blue)]"
                      }
                    >
                      {step.statusHint}
                    </span>
                  ) : null}
                  {clickable && !compact && step.state !== "skipped" ? (
                    <span className="mt-0.5 block text-[11.5px] text-[var(--pg-v13-blue)]">
                      {nl ? "Bekijk bewijs →" : "View evidence →"}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
