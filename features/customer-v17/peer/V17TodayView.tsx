"use client";

import Link from "next/link";
import type { V17TodayViewModel } from "@/lib/customer-v17/build-v17-today-view-model";
import { v17PeerAccentClass } from "@/lib/customer-v17/peer-accent";

export type V17TodayViewProps = {
  model: V17TodayViewModel;
};

export default function V17TodayView({ model }: V17TodayViewProps) {
  const copy = model.copy;

  return (
    <div className="v17-today" data-testid="v17-today-view">
      {model.primaryAttention ? (
        <section className="v17-today-block" id="v17-today-waiting" data-testid="v17-today-waiting">
          <h2 className="v17-today-block-title v17-today-block-title--attn">
            {copy.todayWaitingHeading(model.attentionCount)}
          </h2>
          <article className={`v17-decision v17-decision--compact ${v17PeerAccentClass(model.primaryAttention.serviceKey)}`}>
            <div className="v17-decision-text">
              <p className="v17-decision-title">{model.primaryAttention.title}</p>
              <p className="v17-decision-sub">{model.primaryAttention.contextLine}</p>
            </div>
            <Link
              href={model.primaryAttention.primaryHref}
              className="v17-btn v17-btn--primary v17-btn--sm pg-focus-premium"
            >
              {model.primaryAttention.primaryLabel}
            </Link>
          </article>
          {model.attentionCount > 1 ? (
            <Link href={model.viewAllAttentionHref} className="v17-see-all pg-focus-premium">
              {copy.viewAllAttention(model.attentionCount)}
            </Link>
          ) : null}
        </section>
      ) : null}

      {model.completedToday.length > 0 ? (
        <section className="v17-today-block" id="v17-today-done" data-testid="v17-today-done">
          <h2 className="v17-today-block-title">{copy.todayDoneHeading}</h2>
          {model.completedToday.map((item) => (
            <div key={item.id} className="v17-done-row">
              <span className="v17-done-ico" aria-hidden>
                ✓
              </span>
              {item.href ? (
                <Link href={item.href} className="v17-done-label pg-focus-premium">
                  {item.label}
                </Link>
              ) : (
                <span className="v17-done-label">{item.label}</span>
              )}
            </div>
          ))}
          <Link href={`/team/${model.peerId}/done`} className="v17-see-all pg-focus-premium">
            {copy.viewAllCompleted}
          </Link>
        </section>
      ) : null}

      {model.nextItems.length > 0 ? (
        <section className="v17-today-block" data-testid="v17-today-next">
          <h2 className="v17-today-block-title">{copy.todayNextHeading}</h2>
          {model.nextItems.map((item) => (
            <div key={item.id} className="v17-next-row">
              <span className="v17-next-dot" aria-hidden />
              {item.href ? (
                <Link href={item.href} className="pg-focus-premium">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </div>
          ))}
        </section>
      ) : null}

      {model.showCaughtUp ? (
        <section className="v17-today-block" data-testid="v17-today-caught-up">
          <p className="v17-brief-focus" style={{ fontSize: 16, fontStyle: "normal" }}>
            {model.caughtUpHeadline}
          </p>
          <p className="v17-page-support">{model.caughtUpBody}</p>
        </section>
      ) : null}
    </div>
  );
}
