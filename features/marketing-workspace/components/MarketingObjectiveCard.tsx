"use client";

import Link from "next/link";
import type { MarketingWorkspaceObjectiveViewModel } from "../view-model/marketing-workspace-types";

export type MarketingObjectiveCardProps = {
  objective: MarketingWorkspaceObjectiveViewModel;
};

export default function MarketingObjectiveCard({ objective }: MarketingObjectiveCardProps) {
  if (!objective.hasObjective || !objective.goalText) {
    return (
      <section className="mw-section mw-glass mw-objective" style={{ animationDelay: "0.08s" }}>
        <p className="mw-empty-inline">
          No quarterly focus yet.{" "}
          <Link href={objective.responsibilitiesHref} className="pg-focus-premium">
            Set responsibilities and goals →
          </Link>
        </p>
      </section>
    );
  }

  const pct = objective.progressPercent ?? 0;

  return (
    <section className="mw-section mw-glass mw-objective" style={{ animationDelay: "0.08s" }}>
      <span className="mw-objective-quote" aria-hidden>
        &ldquo;
      </span>
      <div style={{ flex: 1 }}>
        <div className="mw-objective-label">This quarter&apos;s focus</div>
        <div className="mw-objective-goal">{objective.goalText}</div>
      </div>
      {objective.progressLabel && (
        <div className="mw-objective-progress">
          <div className="mw-objective-track">
            <div className="mw-objective-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="mw-objective-pct">{objective.progressLabel}</div>
        </div>
      )}
    </section>
  );
}
