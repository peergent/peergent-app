"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  Inbox,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";
import PgTrendChart from "@/components/design-system/PgTrendChart";
import { CcKpiTile } from "@/features/home/command-center/visual/CcKpiTile";
import { CcRecommendationHero } from "@/features/home/command-center/visual/CcRecommendationHero";
import {
  kpiIconFor,
  peerIconSurfaceStyle,
} from "@/features/home/command-center/visual/cc-visual-utils";
import type {
  MarketingChartMetricId,
  MarketingWorkspaceBands,
  MarketingWorkspaceContentPreviewKind,
} from "@/lib/office/workspace/types";
import "@/features/home/command-center/command-center-home.css";
import "@/features/home/command-center/command-center-dna.css";
import "@/features/home/command-center/command-center-polish.css";
import "@/features/home/command-center/command-center-balance.css";
import "@/features/home/command-center/command-center-executive.css";
import "@/features/home/command-center/command-center-art.css";
import "@/features/home/command-center/command-center-reference.css";
import "@/features/home/command-center/command-center-grid.css";
import "@/features/home/command-center/command-center-final-polish.css";
import "@/features/home/command-center/command-center-executive-quality.css";
import "@/features/home/command-center/command-center-mid-modules.css";
import "@/features/home/command-center/command-center-design-freeze.css";
import "./mw-workspace.css";

const APPROVAL_ITEM_ACCENTS = [
  "var(--pg-peer-marketing)",
  "var(--pg-v13-purple-accent, #7c3aed)",
  "var(--pg-peer-support)",
] as const;

const CONTENT_KIND_LABEL: Record<MarketingWorkspaceContentPreviewKind, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  email: "Email",
  ads: "Ads",
  blog: "Blog",
  display: "Display",
};

export type MarketingWorkspaceViewProps = {
  bands: MarketingWorkspaceBands;
  locale?: string | null;
};

export default function MarketingWorkspaceView({
  bands,
  locale,
}: MarketingWorkspaceViewProps) {
  const nl = locale === "nl";
  const defaultMetricId =
    bands.performance?.defaultMetricId ?? ("revenue" as MarketingChartMetricId);
  const [chartMetricId, setChartMetricId] = useState<MarketingChartMetricId>(defaultMetricId);

  const activeChart = useMemo(() => {
    if (!bands.performance) return null;
    return (
      bands.performance.metrics.find((m) => m.id === chartMetricId) ??
      bands.performance.metrics[0] ??
      null
    );
  }, [bands.performance, chartMetricId]);

  return (
    <div
      className="pg-cc6 pg-cc7 pg-cc8 pg-cc10 pg-cc12 pg-cc13 pg-cc14 pg-cc15 pg-cc16 pg-cc17 pg-cc18 pg-cc19 pg-cc20 pg-cc21 pg-mw-workspace"
      data-testid="marketing-workspace-view"
    >
      {/* Band A — Marketing Overview */}
      <section className="pg-mw-band pg-mw-overview" aria-labelledby="pg-mw-overview">
        <p id="pg-mw-overview" className="pg-mw-overview__summary">
          {bands.overview.summary}
        </p>
      </section>

      {/* Band B — Marketing KPIs */}
      {bands.kpis.items.length > 0 ? (
        <section
          className="pg-mw-band pg-cc15-row pg-cc15-row--kpi"
          aria-label={nl ? "Marketing KPI's" : "Marketing KPIs"}
        >
          {bands.kpis.items.map((kpi, index) => (
            <CcKpiTile
              key={kpi.id}
              id={kpi.id}
              label={kpi.label}
              value={kpi.value}
              trend={kpi.methodology}
              icon={kpiIconFor(kpi.id)}
              href={kpi.href ?? null}
              hero={kpi.hero ?? index === 0}
              accent={kpi.accent ?? "var(--pg-peer-marketing)"}
            />
          ))}
        </section>
      ) : null}

      {/* Band C — Performance Overview */}
      {bands.performance && activeChart ? (
        <section className="pg-mw-band" aria-labelledby="pg-mw-performance-title">
          <article
            className="pg-cc6-card pg-cc6-chart-panel pg-cc8-hero--chart"
            data-testid="pg-mw-performance"
          >
            <header className="pg-cc6-chart-head">
              <div className="pg-cc6-chart-head__copy">
                <p className="pg-ds-label">{bands.performance.periodLabel}</p>
                <h2 id="pg-mw-performance-title" className="pg-cc6-panel-title">
                  {nl ? "Performance overzicht" : "Performance overview"}
                </h2>
              </div>
              <div className="pg-cc6-chart-head__metric">
                {activeChart.delta ? (
                  <span
                    className={cn(
                      "pg-cc6-chart-head__delta",
                      activeChart.deltaPositive
                        ? "pg-cc6-chart-head__delta--up"
                        : "pg-cc6-chart-head__delta--down"
                    )}
                  >
                    {activeChart.delta}
                  </span>
                ) : null}
                <span className="pg-cc6-chart-head__value pg-cc7-grad-text">
                  {activeChart.heroValue}
                </span>
              </div>
            </header>

            {bands.performance.metrics.length > 1 ? (
              <div className="pg-mw-metric-tabs" role="tablist" aria-label={nl ? "Metric" : "Metric"}>
                {bands.performance.metrics.map((metric) => (
                  <button
                    key={metric.id}
                    type="button"
                    role="tab"
                    aria-selected={metric.id === chartMetricId}
                    className={cn(
                      "pg-mw-metric-tab pg-focus-premium",
                      metric.id === chartMetricId && "pg-mw-metric-tab--active"
                    )}
                    onClick={() => setChartMetricId(metric.id)}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            ) : null}

            {activeChart.points.length >= 2 ? (
              <div className="pg-cc6-chart-wrap">
                <svg width="0" height="0" aria-hidden className="pg-cc6-chart-defs">
                  <defs>
                    <linearGradient id="pg-mw-chart-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--pg-peer-marketing)" />
                      <stop offset="100%" stopColor="var(--pg-v13-purple-accent, #7c3aed)" />
                    </linearGradient>
                    <linearGradient id="pg-mw-chart-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--pg-peer-marketing)" stopOpacity="0.2" />
                      <stop
                        offset="100%"
                        stopColor="var(--pg-v13-purple-accent, #7c3aed)"
                        stopOpacity="0.02"
                      />
                    </linearGradient>
                  </defs>
                </svg>
                <PgTrendChart
                  points={activeChart.points}
                  label={activeChart.chartLabel}
                  height={148}
                  colorVar="url(#pg-mw-chart-grad)"
                  areaFillVar="url(#pg-mw-chart-area-grad)"
                  animate
                  variant="hero"
                  valueFormat={activeChart.valueFormat === "currency" ? "currency" : "number"}
                  className="pg-cc6-chart"
                />
              </div>
            ) : null}

            {activeChart.insight ? (
              <p className="pg-cc6-chart-insight">
                <Sparkles size={14} aria-hidden className="pg-cc6-chart-insight__icon" />
                {activeChart.insight}
              </p>
            ) : null}
          </article>
        </section>
      ) : null}

      {/* Band D — Emma Insights (business intelligence, not briefing) */}
      {bands.insights ? (
        <section className="pg-mw-band" aria-labelledby="pg-mw-insights-title">
          <article className="pg-cc6-card pg-mw-insights" data-testid="pg-mw-insights">
            <h2 id="pg-mw-insights-title" className="pg-cc6-panel-title">
              {bands.insights.title}
            </h2>
            <ul className="pg-mw-insights__list">
              {bands.insights.items.map((item) => (
                <li
                  key={item.id}
                  className={cn("pg-mw-insights__item", `pg-mw-insights__item--${item.tone}`)}
                >
                  <span className="pg-mw-insights__dot" aria-hidden />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      {/* Band E — Active Campaigns */}
      {bands.campaigns ? (
        <section className="pg-mw-band" aria-labelledby="pg-mw-campaigns-title">
          <header className="pg-mw-section-head">
            <h2 id="pg-mw-campaigns-title" className="pg-cc6-panel-title">
              {bands.campaigns.title}
            </h2>
            <Link href={bands.campaigns.viewAllHref} className="pg-mw-section-link pg-focus-premium">
              {nl ? "Alle campagnes" : "All campaigns"}
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </header>
          <div className="pg-mw-campaign-grid" data-testid="pg-mw-campaigns">
            {bands.campaigns.items.map((campaign) => (
              <Link
                key={campaign.id}
                href={campaign.href}
                className="pg-cc6-card pg-mw-campaign-card pg-ds-card--interactive pg-focus-premium"
              >
                <div className="pg-mw-campaign-card__head">
                  <h3 className="pg-mw-campaign-card__title">{campaign.name}</h3>
                  {campaign.isLive ? (
                    <span className="pg-mw-campaign-card__live">LIVE</span>
                  ) : campaign.needsApproval ? (
                    <span className="pg-mw-campaign-card__pending">
                      {nl ? "Goedkeuring" : "Approval"}
                    </span>
                  ) : (
                    <span className="pg-mw-campaign-card__status">{campaign.statusLabel}</span>
                  )}
                </div>
                {campaign.progressLabel ? (
                  <p className="pg-mw-campaign-card__progress">{campaign.progressLabel}</p>
                ) : null}
                <div className="pg-mw-campaign-card__meta">
                  {campaign.channelLabel ? (
                    <span className="pg-mw-campaign-card__channel">{campaign.channelLabel}</span>
                  ) : null}
                  {campaign.budgetLabel ? (
                    <span className="pg-mw-campaign-card__budget">{campaign.budgetLabel}</span>
                  ) : null}
                </div>
                {campaign.impactLabel ? (
                  <p className="pg-mw-campaign-card__impact">{campaign.impactLabel}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Band F — Content Preview */}
      {bands.content ? (
        <section className="pg-mw-band" aria-labelledby="pg-mw-content-title">
          <header className="pg-mw-section-head">
            <h2 id="pg-mw-content-title" className="pg-cc6-panel-title">
              {bands.content.title}
            </h2>
            <Link href={bands.content.viewAllHref} className="pg-mw-section-link pg-focus-premium">
              {nl ? "Alle content" : "All content"}
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </header>
          <div className="pg-mw-content-grid" data-testid="pg-mw-content">
            {bands.content.items.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "pg-cc6-card pg-mw-content-card",
                  `pg-mw-content-card--${item.kind}`
                )}
              >
                <div className="pg-mw-content-card__head">
                  <span className="pg-mw-content-card__kind">
                    {CONTENT_KIND_LABEL[item.kind]}
                  </span>
                  <span className="pg-mw-content-card__status">{item.statusLabel}</span>
                </div>
                <h3 className="pg-mw-content-card__title">{item.title}</h3>
                <p className="pg-mw-content-card__preview">{item.preview}</p>
                {item.href ? (
                  <Link href={item.href} className="pg-mw-content-card__link pg-focus-premium">
                    {nl ? "Openen" : "Open"}
                    <ChevronRight size={12} aria-hidden />
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Band G — Approval Center */}
      {bands.approvals ? (
        <section className="pg-mw-band" aria-labelledby="pg-mw-approvals-title">
          <article
            className="pg-cc6-card pg-cc18-module pg-cc18-module--approvals"
            data-testid="pg-mw-approvals"
          >
            <header className="pg-cc18-module__head">
              <h2 id="pg-mw-approvals-title" className="pg-cc18-module__title">
                {nl ? "Goedkeuringscentrum" : "Approval center"}
              </h2>
              <Link
                href={bands.approvals.overflowHref}
                className="pg-cc18-module__bell pg-focus-premium"
                aria-label={
                  nl
                    ? `${bands.approvals.totalCount} openstaande goedkeuringen`
                    : `${bands.approvals.totalCount} pending approvals`
                }
              >
                <Bell size={15} strokeWidth={2} aria-hidden />
                <span className="pg-cc18-module__bell-badge">{bands.approvals.totalCount}</span>
              </Link>
            </header>
            <div className="pg-cc18-module__body">
              <div className="pg-cc18-approvals-grid">
                {bands.approvals.items.map((item, index) => {
                  const accent = APPROVAL_ITEM_ACCENTS[index % APPROVAL_ITEM_ACCENTS.length];
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="pg-cc18-approval-item pg-focus-premium"
                      data-testid={`pg-mw-approval-${item.id}`}
                    >
                      <span
                        className="pg-cc6-kpi__icon pg-cc18-approval-item__icon"
                        style={{ color: accent, ...peerIconSurfaceStyle(accent) }}
                        aria-hidden
                      >
                        <Inbox size={15} strokeWidth={2} />
                      </span>
                      <h3 className="pg-cc18-approval-item__title">{item.title}</h3>
                      <p className="pg-cc18-approval-item__copy">{item.unblocks}</p>
                      {item.ageLabel ? (
                        <p className="pg-cc18-approval-item__age">{item.ageLabel}</p>
                      ) : null}
                      <span className="pg-cc18-approval-item__cta">
                        {item.primaryLabel}
                        <ChevronRight size={12} strokeWidth={2} aria-hidden />
                      </span>
                    </Link>
                  );
                })}
              </div>
              {bands.approvals.overflowLabel ? (
                <div className="pg-mw-card-foot">
                  <Link
                    href={bands.approvals.overflowHref}
                    className="pg-mw-card-foot__link pg-focus-premium"
                  >
                    {bands.approvals.overflowLabel}
                    <ArrowUpRight size={14} aria-hidden />
                  </Link>
                </div>
              ) : null}
            </div>
          </article>
        </section>
      ) : null}

      {/* Band H — Recommendations */}
      {bands.recommendation ? (
        <section className="pg-mw-band pg-cc15-row pg-cc15-row--rec" aria-label={nl ? "Aanbeveling" : "Recommendation"}>
          <CcRecommendationHero
            recommendation={{
              peerLabel: "Marketing",
              recommendation: bands.recommendation.headline,
              impact: bands.recommendation.impact,
              primaryLabel: bands.recommendation.primaryLabel,
              href: bands.recommendation.href,
              accentVar: "var(--pg-peer-marketing)",
              impactMetrics: bands.recommendation.impactMetrics,
            }}
            href={bands.recommendation.href}
            nl={nl}
          />
        </section>
      ) : null}

      {/* Band I — Live Activity */}
      {bands.activity ? (
        <section className="pg-mw-band" aria-labelledby="pg-mw-activity-title">
          <article className="pg-cc6-card pg-mw-terminal" data-testid="pg-mw-activity">
            <h2 id="pg-mw-activity-title" className="pg-cc6-panel-title">
              {bands.activity.title}
            </h2>
            <ol className="pg-mw-terminal__log">
              {bands.activity.items.map((item, index) => (
                <li
                  key={item.id}
                  className={cn(
                    "pg-mw-terminal__line",
                    index === 0 && "pg-mw-terminal__line--latest"
                  )}
                >
                  <time className="pg-mw-terminal__time" dateTime={item.timestamp}>
                    {item.timeLabel}
                  </time>
                  {item.href ? (
                    <Link href={item.href} className="pg-mw-terminal__msg pg-focus-premium">
                      {item.message}
                    </Link>
                  ) : (
                    <span className="pg-mw-terminal__msg">{item.message}</span>
                  )}
                </li>
              ))}
            </ol>
          </article>
        </section>
      ) : null}

      {/* Band J — Recent Results */}
      {bands.results ? (
        <section className="pg-mw-band" aria-labelledby="pg-mw-results-title">
          <article className="pg-cc6-card" data-testid="pg-mw-results">
            <h2 id="pg-mw-results-title" className="pg-cc6-panel-title">
              {bands.results.title}
            </h2>
            <ul className="pg-mw-results">
              {bands.results.items.map((item) => {
                const inner = (
                  <>
                    <span className="pg-mw-results__label">
                      <span className="pg-mw-results__dot" aria-hidden />
                      {item.label}
                    </span>
                    <span className="pg-mw-results__impact">{item.impactLabel ?? "—"}</span>
                    <ChevronRight size={14} className="pg-mw-results__arrow" aria-hidden />
                  </>
                );

                if (item.href) {
                  return (
                    <li key={item.id}>
                      <Link href={item.href} className="pg-mw-results__row pg-focus-premium">
                        {inner}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.id} className="pg-mw-results__row">
                    {inner}
                  </li>
                );
              })}
            </ul>
          </article>
        </section>
      ) : null}
    </div>
  );
}
