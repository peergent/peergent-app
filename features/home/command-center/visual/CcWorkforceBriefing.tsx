"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CommandCenterWorkforceBriefing } from "@/lib/home/build-command-center-bands";

function revenueDisplay(text: string): string {
  const match = text.match(/€[\d.,]+|[\d.,]+\s*(?:EUR|€)/i);
  if (match) return match[0].replace(/\s*EUR/i, "").trim();
  return text.replace(/^(influenced|beïnvloed|omzet beïnvloed)\s*/i, "").trim();
}

export function CcWorkforceBriefing({
  briefing,
  nl,
  salutation,
  pendingCount = 0,
}: {
  briefing: CommandCenterWorkforceBriefing;
  nl: boolean;
  salutation?: string;
  pendingCount?: number;
}) {
  const revenueItem = briefing.accomplishments.find((item) => item.id === "revenue");
  const completedItems = briefing.accomplishments.filter((item) => item.id !== "revenue");

  return (
    <aside
      className="pg-cc6-card pg-cc6-briefing pg-cc7-briefing pg-cc13-briefing pg-cc14-briefing"
      aria-labelledby="pg-cc6-briefing-title"
      data-testid="pg-cc-workforce-briefing"
    >
      <h2 id="pg-cc6-briefing-title" className="pg-cc14-briefing__title">
        {nl ? "Briefing van je workforce" : "Workforce briefing"}
      </h2>

      {salutation ? (
        <p className="pg-cc14-briefing__salutation">{salutation}</p>
      ) : null}

      <p className="pg-cc14-briefing__intro">{briefing.intro}</p>

      {completedItems.length > 0 ? (
        <ul className="pg-cc14-briefing__list">
          {completedItems.map((item) => (
            <li key={item.id} className="pg-cc14-briefing__item">
              <span className="pg-cc14-briefing__check" aria-hidden>
                ✓
              </span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {(revenueItem || pendingCount > 0) ? (
        <div className="pg-cc14-briefing__footer">
          {revenueItem ? (
            <div>
              <span className="pg-cc14-briefing__stat-label">
                {nl ? "Beïnvloede omzet" : "Revenue influenced"}
              </span>
              <span className="pg-cc14-briefing__stat-value pg-cc14-briefing__stat-value--accent">
                {revenueDisplay(revenueItem.text)}
              </span>
            </div>
          ) : (
            <div aria-hidden />
          )}
          {pendingCount > 0 ? (
            <div>
              <span className="pg-cc14-briefing__stat-label">
                {nl ? "Vandaag wachten nog" : "Pending for today"}
              </span>
              <span className="pg-cc14-briefing__stat-value pg-cc14-briefing__stat-value--pending">
                {pendingCount} {nl ? "goedkeuringen" : "approvals"}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <Link href={briefing.viewAllHref} className="pg-cc6-briefing__link pg-cc14-briefing__link pg-focus-premium">
        {briefing.viewAllLabel}
        <ArrowUpRight size={14} aria-hidden />
      </Link>
    </aside>
  );
}
