"use client";

import Link from "next/link";
import type { V17WaitingViewModel } from "@/lib/customer-v17/build-v17-waiting-view-model";
import { v17PeerAccentClass } from "@/lib/customer-v17/peer-accent";

export default function V17WaitingView({ model }: { model: V17WaitingViewModel }) {
  const copy = model.copy;

  return (
    <div className="v17-section-page" data-testid="v17-waiting-view">
      <h2 className="v17-section-page-title">
        {copy.todayWaitingHeading(model.attentionCount)}
      </h2>

      {model.items.length === 0 ? (
        <>
          <p className="v17-brief-focus" style={{ fontSize: 16, fontStyle: "normal" }}>
            {model.emptyHeadline}
          </p>
          <p className="v17-page-support">{model.emptyBody}</p>
        </>
      ) : (
        <div className="v17-waiting-list">
          {model.items.map((item) => (
            <article
              key={item.id}
              className={`v17-decision v17-decision--compact ${v17PeerAccentClass(item.serviceKey)}`}
            >
              <div className="v17-decision-text">
                <p className="v17-decision-title">{item.title}</p>
                <p className="v17-decision-sub">{item.contextLine}</p>
              </div>
              <Link
                href={item.primaryHref}
                className="v17-btn v17-btn--primary v17-btn--sm pg-focus-premium"
              >
                {item.primaryLabel}
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
