"use client";

import Link from "next/link";
import type { HqExecutiveSummary } from "@/lib/hq/build-hq-view-model";
import { ArrowRightIcon } from "./hq-icons";

export type ExecutiveSummaryProps = {
  summary: HqExecutiveSummary;
};

export default function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  return (
    <section className="hq-landing__exec" aria-label="Executive summary">
      <div className="hq-landing__exec-row">
        <div className="hq-landing__exec-item">
          <div className="hq-landing__exec-val">{summary.tasksCompleted}</div>
          <div className="hq-landing__exec-lbl">Tasks completed</div>
        </div>
        <div className="hq-landing__exec-item">
          <div className="hq-landing__exec-val hq-landing__exec-val--accent">
            {summary.timeSavedLabel ?? "—"}
          </div>
          <div className="hq-landing__exec-lbl">Time saved</div>
        </div>
        <div className="hq-landing__exec-item">
          <div className="hq-landing__exec-val">{summary.revenueLabel ?? "—"}</div>
          <div className="hq-landing__exec-lbl">Revenue influenced</div>
        </div>
        <div className="hq-landing__exec-item">
          <div className="hq-landing__exec-val">{summary.pendingApprovals}</div>
          <div className="hq-landing__exec-lbl">Waiting for approval</div>
        </div>
      </div>
      <Link href="/home" className="hq-landing__exec-link pg-focus-premium">
        View full briefing
        <ArrowRightIcon />
      </Link>
    </section>
  );
}
