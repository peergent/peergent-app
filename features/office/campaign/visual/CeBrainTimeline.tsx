"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { CampaignBrainTimelineStep } from "@/lib/office/campaign/campaign-experience-types";

function StepIcon({ state }: { state: CampaignBrainTimelineStep["state"] }) {
  if (state === "done") {
    return (
      <span className="pg-ce-brain__check" aria-hidden>
        ✓
      </span>
    );
  }
  if (state === "active") {
    return <span className="pg-ce-brain__active-dot" aria-hidden />;
  }
  if (state === "skipped") {
    return <span className="pg-ce-brain__skipped" aria-hidden>—</span>;
  }
  return <span className="pg-ce-brain__upcoming" aria-hidden />;
}

export function CeBrainTimeline({
  steps,
  nl,
}: {
  steps: readonly CampaignBrainTimelineStep[];
  nl: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="pg-cc6-card pg-ce-brain" aria-labelledby="pg-ce-brain-title" data-testid="pg-ce-brain-timeline">
      <h2 id="pg-ce-brain-title" className="pg-ce-section-title">
        {nl ? "Voortgang" : "Progress"}
      </h2>
      <ol className="pg-ce-brain__list">
        {steps.map((step) => {
          const expandable = Boolean(step.detail);
          const expanded = expandedId === step.id;

          return (
            <li
              key={step.id}
              className={cn(
                "pg-ce-brain__item",
                step.state === "active" && "pg-ce-brain__item--active",
                step.state === "done" && "pg-ce-brain__item--done"
              )}
            >
              <button
                type="button"
                className={cn(
                  "pg-ce-brain__row pg-focus-premium",
                  !expandable && "pg-ce-brain__row--static"
                )}
                aria-expanded={expandable ? expanded : undefined}
                onClick={() => {
                  if (!expandable) return;
                  setExpandedId(expanded ? null : step.id);
                }}
              >
                <StepIcon state={step.state} />
                <span className="pg-ce-brain__label">{step.label}</span>
                {expandable ? (
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className={cn("pg-ce-brain__chevron", expanded && "pg-ce-brain__chevron--open")}
                  />
                ) : null}
              </button>
              {expandable && expanded ? (
                <p className="pg-ce-brain__detail">{step.detail}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
