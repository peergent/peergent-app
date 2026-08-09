"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type {
  CampaignExperienceProgress,
  CampaignProgressStepState,
} from "@/lib/office/campaign/campaign-experience-types";

function StepIcon({ state }: { state: CampaignProgressStepState }) {
  if (state === "done") {
    return (
      <span className="pg-ce-progress__icon pg-ce-progress__icon--done" aria-hidden>
        ✓
      </span>
    );
  }
  if (state === "waiting") {
    return (
      <span className="pg-ce-progress__icon pg-ce-progress__icon--waiting" aria-hidden>
        🟡
      </span>
    );
  }
  return (
    <span className="pg-ce-progress__icon pg-ce-progress__icon--upcoming" aria-hidden>
      ⬜
    </span>
  );
}

export function CeCampaignProgress({
  progress,
  nl,
}: {
  progress: CampaignExperienceProgress;
  nl: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress.percent / 100) * circumference;

  return (
    <section
      className="pg-cc6-card pg-ce-progress"
      aria-labelledby="pg-ce-progress-title"
      data-testid="pg-ce-campaign-progress"
    >
      <div className="pg-ce-progress__hero">
        <div className="pg-ce-progress__ring-wrap" aria-hidden>
          <svg className="pg-ce-progress__ring" viewBox="0 0 120 120">
            <circle
              className="pg-ce-progress__ring-track"
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
            />
            <circle
              className="pg-ce-progress__ring-fill"
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <span className="pg-ce-progress__percent">{progress.percent}%</span>
        </div>
        <div className="pg-ce-progress__headline-wrap">
          <h2 id="pg-ce-progress-title" className="pg-ce-section-title">
            {nl ? "Voortgang" : "Progress"}
          </h2>
          <p className="pg-ce-progress__headline">{progress.statusHeadline}</p>
        </div>
      </div>

      <ol className="pg-ce-progress__steps">
        {progress.steps.map((step, index) => {
          const expandable = Boolean(step.expansion);
          const expanded = expandedId === step.id;

          return (
            <li
              key={step.id}
              className={cn(
                "pg-ce-progress__step pg-mw-stagger-in",
                step.state === "waiting" && "pg-ce-progress__step--waiting",
                step.state === "done" && "pg-ce-progress__step--done"
              )}
              style={{ ["--pg-mw-stagger-i" as string]: index }}
            >
              <button
                type="button"
                className={cn(
                  "pg-ce-progress__row pg-focus-premium",
                  !expandable && "pg-ce-progress__row--static"
                )}
                aria-expanded={expandable ? expanded : undefined}
                onClick={() => {
                  if (!expandable) return;
                  setExpandedId(expanded ? null : step.id);
                }}
              >
                <StepIcon state={step.state} />
                <span className="pg-ce-progress__label">{step.label}</span>
                {expandable ? (
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className={cn(
                      "pg-ce-progress__chevron",
                      expanded && "pg-ce-progress__chevron--open"
                    )}
                  />
                ) : null}
              </button>

              {expandable && expanded && step.expansion ? (
                <div className="pg-ce-progress__detail pg-mw-fade-swap">
                  <dl className="pg-ce-progress__detail-grid">
                    <div>
                      <dt>{nl ? "Wat gebeurde" : "What happened"}</dt>
                      <dd>{step.expansion.whatHappened}</dd>
                    </div>
                    <div>
                      <dt>{nl ? "Waarom" : "Why it happened"}</dt>
                      <dd>{step.expansion.whyItHappened}</dd>
                    </div>
                    <div>
                      <dt>{nl ? "Business impact" : "Business impact"}</dt>
                      <dd>{step.expansion.businessImpact}</dd>
                    </div>
                    {step.expansion.decisionTaken ? (
                      <div>
                        <dt>{nl ? "Beslissing" : "Decision taken"}</dt>
                        <dd>{step.expansion.decisionTaken}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
