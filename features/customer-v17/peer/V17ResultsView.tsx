"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, Eye, Rocket, UserPlus } from "lucide-react";
import type {
  V17ResultsKpi,
  V17ResultsKpiIcon,
  V17ResultsViewModel,
} from "@/lib/customer-v17/build-v17-results-view-model";
import { V17CcBlock } from "@/features/customer-v17/components/V17LineItem";

function kpiIcon(icon: V17ResultsKpiIcon): ReactNode {
  const props = { size: 15, "aria-hidden": true } as const;
  switch (icon) {
    case "completed":
      return <CheckCircle2 {...props} />;
    case "running":
      return <Rocket {...props} />;
    case "reach":
      return <Eye {...props} />;
    case "leads":
    default:
      return <UserPlus {...props} />;
  }
}

function KpiBody({ kpi, notConnected }: { kpi: V17ResultsKpi; notConnected: string }) {
  return (
    <>
      <div className="v17-kpi-top">
        <span className="v17-kpi-icon">{kpiIcon(kpi.icon)}</span>
        <p className="v17-stat-lbl">{kpi.label}</p>
      </div>

      {kpi.value != null ? (
        <>
          <p className="v17-stat-val">{kpi.value}</p>
          {kpi.trend ? (
            <p className={`v17-kpi-trend v17-kpi-trend--${kpi.trend.direction}`}>
              {kpi.trend.label}
            </p>
          ) : null}
        </>
      ) : (
        <p className="v17-kpi-na">{notConnected}</p>
      )}

      <p className="v17-kpi-why">{kpi.unavailable?.message ?? kpi.explanation}</p>
    </>
  );
}

function KpiCard({ kpi, notConnected }: { kpi: V17ResultsKpi; notConnected: string }) {
  const body = <KpiBody kpi={kpi} notConnected={notConnected} />;
  const testId = `v17-results-kpi-${kpi.id}`;

  // An unavailable card owns its own CTA link, so it must not also be a link.
  if (kpi.unavailable) {
    return (
      <div className="v17-stat-card v17-kpi-card" data-testid={testId}>
        {body}
        <Link
          href={kpi.unavailable.ctaHref}
          className="v17-kpi-cta pg-focus-premium"
          data-testid={`${testId}-cta`}
        >
          {kpi.unavailable.ctaLabel}
        </Link>
      </div>
    );
  }

  if (kpi.href) {
    return (
      <Link
        href={kpi.href}
        className="v17-stat-card v17-kpi-card pg-focus-premium"
        aria-label={`${kpi.label}: ${kpi.value}`}
        data-testid={testId}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="v17-stat-card v17-kpi-card" data-testid={testId}>
      {body}
    </div>
  );
}

export default function V17ResultsView({ model }: { model: V17ResultsViewModel }) {
  const { copy } = model;

  return (
    <div className="v17-section-page v17-results-page" data-testid="v17-results-view">
      <header className="v17-results-head">
        <div className="v17-results-head-text">
          <h1 className="v17-page-title">{model.title}</h1>
          <p className="v17-page-support">{model.subtitle}</p>
        </div>
        <nav className="v17-range" aria-label={model.rangeAriaLabel}>
          {model.ranges.map((range) => (
            <Link
              key={range.id}
              href={range.href}
              className={`v17-range-opt pg-focus-premium${
                range.active ? " v17-range-opt--active" : ""
              }`}
              aria-current={range.active ? "true" : undefined}
              data-testid={`v17-results-range-${range.id}`}
            >
              {range.label}
            </Link>
          ))}
        </nav>
      </header>

      {model.onboarding ? (
        <div className="v17-detail-card v17-results-onboarding" data-testid="v17-results-onboarding">
          <h2 className="v17-detail-card-title">{model.onboarding.headline}</h2>
          <p className="v17-page-support">{model.onboarding.body}</p>
          <Link
            href={model.onboarding.ctaHref}
            className="v17-btn v17-btn--primary pg-focus-premium"
          >
            {model.onboarding.ctaLabel}
          </Link>
        </div>
      ) : (
        <>
          {model.attention.length > 0 ? (
            <V17CcBlock title={copy.attentionTitle} attention>
              <div className="v17-results-list">
                {model.attention.map((item) => (
                  <article
                    key={item.id}
                    className="v17-decision v17-decision--compact"
                    data-testid={`v17-results-attention-${item.id}`}
                  >
                    <div className="v17-decision-main">
                      <div className="v17-decision-text">
                        <p className="v17-decision-title">{item.title}</p>
                        <p className="v17-decision-sub">{item.whyItMatters}</p>
                      </div>
                    </div>
                    <div className="v17-decision-actions">
                      <Link
                        href={item.href}
                        className="v17-btn v17-btn--primary v17-btn--sm pg-focus-premium"
                      >
                        {item.primaryActionLabel}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </V17CcBlock>
          ) : null}

          <V17CcBlock title={copy.executiveSummary}>
            <div className="v17-stat-grid--grounded">
              {model.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} notConnected={copy.notConnected} />
              ))}
            </div>
          </V17CcBlock>

          <V17CcBlock title={copy.latestDeliverables}>
            {model.deliverables.length > 0 ? (
              <ul className="v17-results-list">
                {model.deliverables.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href ?? "#"}
                      className="v17-deliverable-row pg-focus-premium"
                      data-testid={`v17-results-deliverable-${item.id}`}
                    >
                      <span className="v17-results-row-main">
                        <span className="v17-results-row-title">{item.title}</span>
                        <span className="v17-results-row-meta">
                          {item.platform ? <span>{item.platform}</span> : null}
                          {item.createdLabel ? <span>{item.createdLabel}</span> : null}
                        </span>
                      </span>
                      <span
                        className={`v17-status-tag v17-status-tag--lg v17-tone-${item.statusTone}`}
                      >
                        {item.statusLabel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="v17-empty-inline">{copy.emptyDeliverables}</p>
            )}
          </V17CcBlock>

          <V17CcBlock title={copy.peerActivity}>
            {model.activity.length > 0 ? (
              <ol className="v17-timeline">
                {model.activity.map((entry) => (
                  <li
                    key={entry.id}
                    className="v17-timeline-item"
                    data-testid={`v17-results-activity-${entry.id}`}
                  >
                    <span className="v17-timeline-dot" aria-hidden />
                    <span className="v17-timeline-label">{entry.label}</span>
                    {entry.timeLabel ? (
                      <span className="v17-timeline-time">{entry.timeLabel}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="v17-empty-inline">{copy.emptyActivity}</p>
            )}
          </V17CcBlock>

          {/* Primary content area — the Peer's own read on the work. */}
          <div className="v17-results-insights">
            <V17CcBlock title={copy.insightsTitle}>
              {model.insights.length > 0 ? (
                <div className="v17-insight-grid">
                  {model.insights.map((insight) => (
                    <article
                      key={insight.id}
                      className="v17-insight-card v17-insight-card--primary"
                      data-testid={`v17-results-insight-${insight.id}`}
                    >
                      <p className="v17-insight-body">{insight.observation}</p>
                      {insight.recommendation ? (
                        <p className="v17-insight-rec">
                          <span className="v17-insight-rec-label">
                            {copy.recommendationLabel}
                          </span>
                          {insight.recommendation}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="v17-empty-inline">{copy.emptyInsights}</p>
              )}
            </V17CcBlock>
          </div>
        </>
      )}
    </div>
  );
}
