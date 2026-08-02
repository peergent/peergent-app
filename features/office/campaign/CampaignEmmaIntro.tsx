"use client";

import { useEffect, useState } from "react";

export type CampaignEmmaIntroProps = {
  openingLine: string;
  planSteps: readonly string[];
  locale?: string | null;
  onPlanRevealComplete?: () => void;
  children?: React.ReactNode;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function CampaignEmmaIntro({
  openingLine,
  planSteps,
  locale,
  onPlanRevealComplete,
  children,
}: CampaignEmmaIntroProps) {
  const nl = locale === "nl";
  const reduced = prefersReducedMotion();
  const [showOpening, setShowOpening] = useState(reduced);
  const [showPlanLabel, setShowPlanLabel] = useState(reduced);
  const [visibleCount, setVisibleCount] = useState(reduced ? planSteps.length : 0);
  const [showActions, setShowActions] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      onPlanRevealComplete?.();
      return;
    }

    const timers: number[] = [];
    timers.push(window.setTimeout(() => setShowOpening(true), 80));
    timers.push(window.setTimeout(() => setShowPlanLabel(true), 280));

    planSteps.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleCount(index + 1);
          if (index === planSteps.length - 1) {
            timers.push(
              window.setTimeout(() => {
                setShowActions(true);
                onPlanRevealComplete?.();
              }, 120)
            );
          }
        }, 400 + index * 120)
      );
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [onPlanRevealComplete, planSteps, reduced]);

  return (
    <section className="pg-v13-sec mb-6" data-testid="campaign-emma-intro">
      <p className="pg-v13-sec-label">Emma</p>
      <p
        className={`text-[14px] leading-relaxed text-[var(--pg-v13-ink-soft)] transition-all duration-300 ${
          showOpening ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
        data-testid="emma-opening-line"
      >
        {openingLine}
      </p>

      {planSteps.length > 0 ? (
        <div className="mt-4">
          <p
            className={`pg-v13-mono mb-2 text-[10px] uppercase text-[var(--pg-v13-ink-faint)] transition-all duration-300 ${
              showPlanLabel ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
            data-testid="emma-plan-label"
          >
            {nl ? "Dit ga ik doen:" : "Here's what I'll do:"}
          </p>
          <ol className="m-0 list-decimal space-y-1 pl-5" data-testid="emma-plan-steps">
            {planSteps.map((step, index) => (
              <li
                key={step}
                data-testid={`emma-plan-step-${index}`}
                className={`text-[13px] text-[var(--pg-v13-ink-soft)] transition-all duration-300 ${
                  index < visibleCount ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                }`}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {showActions && children ? (
        <div
          className="mt-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1"
          data-testid="emma-post-plan-actions"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
