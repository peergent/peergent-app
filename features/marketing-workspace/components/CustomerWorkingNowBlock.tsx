"use client";

import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import type { WorkingNowPresentation } from "../lib/customer-campaign-presenter";

export type CustomerWorkingNowBlockProps = {
  peerName: string;
  copy: MarketingCampaignCopy;
  working: WorkingNowPresentation;
};

export default function CustomerWorkingNowBlock({
  peerName,
  copy,
  working,
}: CustomerWorkingNowBlockProps) {
  if (!working.show) return null;

  return (
    <section className="mw-working-now" aria-labelledby="mw-working-now-heading">
      <h2 id="mw-working-now-heading" className="mw-working-now-peer">
        {peerName}
      </h2>
      <ul className="mw-working-now-list">
        {working.currently ? (
          <li className="mw-working-now-line">{working.currently}</li>
        ) : null}
        {working.latestCompleted ? (
          <li className="mw-working-now-line mw-working-now-line--muted">
            <span className="mw-working-now-prefix">{copy.workingNowLatestPrefix}:</span>{" "}
            {working.latestCompleted}
          </li>
        ) : null}
        {working.next ? (
          <li className="mw-working-now-line mw-working-now-line--muted">
            <span className="mw-working-now-prefix">{copy.workingNowNextPrefix}:</span>{" "}
            {working.next}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
