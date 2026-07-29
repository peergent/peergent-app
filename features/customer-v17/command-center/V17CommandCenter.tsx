"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { activitySourcesFromMarketingSnapshots } from "@/lib/home";
import {
  buildV17CommandCenterViewModel,
  V17_COMMAND_CENTER_LAYOUT_SECTIONS,
  v17PerformanceCardHref,
} from "@/lib/customer-v17/build-v17-command-center-view-model";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { v17PeerAccentClass } from "@/lib/customer-v17/peer-accent";
import { formatHomeRelativeTime } from "@/lib/i18n";
import { getV17CommandCenterCopy } from "@/lib/i18n/v17-command-center-copy";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { V17CcBlock, V17LineItem } from "@/features/customer-v17/components/V17LineItem";
import { V17AttentionCard } from "@/features/customer-v17/components/V17AttentionCard";

export { V17_COMMAND_CENTER_LAYOUT_SECTIONS };

export default function V17CommandCenter({ homeState }: { homeState: HandoffHomeState }) {
  const { handoff, viewModel, copy, marketingSnapshots, canonicalPeers } = homeState;
  const localePreference = customerLocalePreferenceFromEnv();
  const v17Copy = getV17CommandCenterCopy(localePreference);
  const peerCopy = getV17PeerCopy(localePreference);

  const model = useMemo(() => {
    if (!handoff) return null;
    return buildV17CommandCenterViewModel({
      viewModel,
      handoff,
      copy,
      activitySources: activitySourcesFromMarketingSnapshots(marketingSnapshots),
      formatRelativeTime: (iso) => formatHomeRelativeTime(iso, copy),
      localePreference,
      canonicalPeers,
      marketingSnapshots,
    });
  }, [handoff, viewModel, copy, marketingSnapshots, localePreference, canonicalPeers]);

  if (!handoff || !model) return null;

  const waitingTitle =
    model.attention.total > 0
      ? `${v17Copy.waitingForYou} — ${model.attention.total}`
      : v17Copy.waitingForYou;

  return (
    <div
      className="v17-page v17-command-center"
      data-layout-sections={V17_COMMAND_CENTER_LAYOUT_SECTIONS.join(",")}
      data-testid="v17-command-center"
    >
      <header className="v17-cc-header">
        <p className="v17-eyebrow">{v17Copy.eyebrow}</p>
        <h1 className="v17-page-title">{v17Copy.title}</h1>
        <p className="v17-page-support">{v17Copy.supporting}</p>
      </header>

      <V17CcBlock title={v17Copy.workingNow}>
        {model.workingNow.length > 0 ? (
          model.workingNow.map((row) => (
            <V17LineItem
              key={row.id}
              id={row.id}
              serviceKey={row.serviceKey}
              href={row.href}
              left={
                <>
                  <strong>{row.peerLabel}</strong> — {row.description}
                </>
              }
              right={<span className="v17-line-r">{row.statusLabel}</span>}
            />
          ))
        ) : (
          <p className="v17-empty-inline">{v17Copy.workingNowEmpty}</p>
        )}
      </V17CcBlock>

      <V17CcBlock title={v17Copy.completedToday}>
        {model.completedToday.length > 0 ? (
          model.completedToday.map((row) => (
            <V17LineItem
              key={row.id}
              id={row.id}
              serviceKey={row.serviceKey}
              href={row.href}
              left={row.summary}
              right={<span className="v17-line-r">{row.peerLabel}</span>}
            />
          ))
        ) : (
          <p className="v17-empty-inline">{v17Copy.completedTodayEmpty}</p>
        )}
      </V17CcBlock>

      {model.attention.primary ? (
        <V17CcBlock title={waitingTitle} attention>
          <V17AttentionCard card={model.attention.primary} copy={peerCopy} />
          {model.attention.secondary ? (
            <V17AttentionCard card={model.attention.secondary} copy={peerCopy} />
          ) : null}
          {model.attention.total > (model.attention.secondary ? 2 : 1) ? (
            <Link href={model.attention.viewAllHref} className="v17-see-all pg-focus-premium">
              {peerCopy.viewAllAttention(model.attention.total)}
            </Link>
          ) : null}
        </V17CcBlock>
      ) : null}

      {model.performance.length > 0 ? (
        <V17CcBlock title={v17Copy.performanceTitle}>
          <div className="v17-perf-grid">
            {model.performance.map((card) => (
              <Link
                key={card.id}
                href={v17PerformanceCardHref(card)}
                className={`v17-perf-card pg-focus-premium ${v17PeerAccentClass(card.serviceKey)}`}
                data-testid={`v17-perf-${card.serviceKey}`}
              >
                <div className="v17-perf-top">
                  <span className="v17-perf-name">{card.label}</span>
                  {card.performancePct != null ? (
                    <span className="v17-ring-pct" style={{ ["--pct" as string]: card.performancePct }}>
                      <span className="v17-ring-pct-inner">{card.performancePct}%</span>
                    </span>
                  ) : (
                    <span className="v17-ring-na">{v17Copy.noScoreLabel}</span>
                  )}
                </div>
                <p className="v17-perf-tasks">
                  <b>{card.tasksThisWeek}</b> {v17Copy.tasksThisWeekLabel(card.tasksThisWeek)}
                </p>
              </Link>
            ))}
          </div>
        </V17CcBlock>
      ) : null}

      {model.weeklyImpact.showSection ? (
        <V17CcBlock title={v17Copy.weeklyImpact}>
          <div className="v17-stat-grid v17-stat-grid--grounded">
            {model.weeklyImpact.metrics.map((metric) => {
              const inner = (
                <>
                  <p className="v17-stat-lbl">{metric.label}</p>
                  <p className="v17-stat-val">{metric.value}</p>
                  {metric.trend && metric.trend.length > 1 ? (
                    <svg
                      className="v17-stat-spark"
                      viewBox="0 0 100 26"
                      preserveAspectRatio="none"
                      aria-hidden
                    >
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points={metric.trend
                          .map((v, i) => {
                            const x = (i / (metric.trend!.length - 1)) * 100;
                            const y = 26 - (v / Math.max(...metric.trend!)) * 22;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                    </svg>
                  ) : null}
                </>
              );
              return metric.href ? (
                <Link
                  key={metric.id}
                  href={metric.href}
                  className="v17-stat-card pg-focus-premium"
                  data-testid={`v17-grounded-${metric.id}`}
                >
                  {inner}
                </Link>
              ) : (
                <div key={metric.id} className="v17-stat-card" data-testid={`v17-grounded-${metric.id}`}>
                  {inner}
                </div>
              );
            })}
          </div>
        </V17CcBlock>
      ) : null}
    </div>
  );
}
