"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import PgTrendChart from "@/components/design-system/PgTrendChart";
import { CcRecommendationHero } from "@/features/home/command-center/visual/CcRecommendationHero";
import type { CampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { buildCampaignExperienceModel } from "@/lib/office/campaign/build-campaign-experience";
import type { CampaignExperienceChartMetric } from "@/lib/office/campaign/campaign-experience-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { CeCampaignProgress } from "./visual/CeCampaignProgress";
import { CeCreativeAssetGrid } from "./visual/CeCreativeAsset";
import "@/features/home/command-center/command-center-home.css";
import "@/features/home/command-center/command-center-dna.css";
import "@/features/home/command-center/command-center-polish.css";
import "@/features/home/command-center/command-center-grid.css";
import "@/features/home/command-center/command-center-design-freeze.css";
import "@/features/office/workspace/mw-workspace.css";
import "./campaign-experience.css";

export type CampaignExperienceViewProps = {
  model: CampaignDetailViewModel;
  locale?: string | null;
  updatedAtLabel?: string | null;
  domainInput?: MarketingPeerDomainInput;
  isDemo?: boolean;
  onOpenOptimization?: () => void;
};

function renderBriefSections(
  brief: ReturnType<typeof buildCampaignExperienceModel>["brief"],
  nl: boolean
) {
  const labels = nl
    ? {
        executiveSummary: "Executive summary",
        researchFindings: "Research findings",
        audienceInsight: "Audience insight",
        strategicDecision: "Strategic decision",
        creativeDirection: "Creative direction",
        expectedBusinessImpact: "Expected business impact",
        nextRecommendation: "Next recommendation",
      }
    : {
        executiveSummary: "Executive summary",
        researchFindings: "Research findings",
        audienceInsight: "Audience insight",
        strategicDecision: "Strategic decision",
        creativeDirection: "Creative direction",
        expectedBusinessImpact: "Expected business impact",
        nextRecommendation: "Next recommendation",
      };

  return (
    <>
      <p className="pg-ce-brief__narrative">{brief.narrative}</p>
      <dl className="pg-ce-brief__sections">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
          <div key={key} className="pg-ce-brief__section">
            <dt>{labels[key]}</dt>
            <dd>{brief.sections[key]}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export default function CampaignExperienceView({
  model,
  locale,
  updatedAtLabel,
  domainInput,
  isDemo,
  onOpenOptimization,
}: CampaignExperienceViewProps) {
  const nl = locale === "nl";
  const experience = useMemo(
    () =>
      buildCampaignExperienceModel(model, {
        locale,
        updatedAtLabel,
        domainInput,
        isDemo,
      }),
    [model, locale, updatedAtLabel, domainInput, isDemo]
  );

  const defaultMetricId = experience.performance?.defaultMetricId ?? "revenue";
  const [chartMetricId, setChartMetricId] = useState<string>(defaultMetricId);

  const activeChart = useMemo(() => {
    if (!experience.performance) return null;
    return (
      experience.performance.metrics.find((m) => m.id === chartMetricId) ??
      experience.performance.metrics[0] ??
      null
    );
  }, [experience.performance, chartMetricId]);

  const recommendationHref =
    experience.recommendation?.href ??
    (onOpenOptimization ? `${model.detailHref}?view=results` : "#");

  return (
    <div
      className="pg-cc6 pg-cc15 pg-cc21 pg-ce-experience"
      data-testid="campaign-experience-view"
      data-campaign-id={model.projectId}
    >
      <Link href={experience.backHref} className="pg-ce-back pg-focus-premium">
        {nl ? "← Terug naar Workspace" : "← Back to Workspace"}
      </Link>

      {/* Section A — Campaign header */}
      <header className="pg-ce-header" data-testid="pg-ce-header">
        <div className="pg-ce-header__main">
          <div className="pg-ce-header__title-row">
            <h1 className="pg-ce-header__title">{experience.header.title}</h1>
            {experience.header.isLive ? (
              <span className="pg-ce-header__live">
                <span className="pg-ce-header__live-dot" aria-hidden />
                LIVE
              </span>
            ) : (
              <span className="pg-ce-header__status">{experience.header.statusLabel}</span>
            )}
          </div>
          <dl className="pg-ce-header__meta">
            <div>
              <dt>{nl ? "Kanaal" : "Channel"}</dt>
              <dd>{experience.header.channelLabel}</dd>
            </div>
            <div>
              <dt>{nl ? "Doel" : "Objective"}</dt>
              <dd>{experience.header.objective}</dd>
            </div>
            <div>
              <dt>{nl ? "Eigenaar" : "Owner"}</dt>
              <dd>{experience.header.ownerLabel}</dd>
            </div>
            <div>
              <dt>{nl ? "Aangemaakt" : "Created"}</dt>
              <dd>{experience.header.createdLabel}</dd>
            </div>
            <div>
              <dt>{nl ? "Laatst bijgewerkt" : "Last updated"}</dt>
              <dd>{experience.header.updatedLabel}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Section B — Executive Campaign Brief */}
      <section className="pg-ce-row" aria-labelledby="pg-ce-brief-title">
        <article className="pg-cc6-card pg-ce-brief" data-testid="pg-ce-executive-brief">
          <p className="pg-ds-label">{nl ? "Campagne briefing" : "Campaign brief"}</p>
          <h2 id="pg-ce-brief-title" className="pg-ce-section-title">
            {nl ? "Executive overzicht" : "Executive overview"}
          </h2>
          <div className="pg-ce-brief__content">
            {renderBriefSections(experience.brief, nl)}
          </div>
        </article>
      </section>

      {/* Section C — Campaign Performance */}
      {experience.performance && activeChart ? (
        <section className="pg-ce-row" aria-labelledby="pg-ce-performance-title">
          <article
            className="pg-cc6-card pg-cc6-chart-panel pg-ce-chart"
            data-testid="pg-ce-performance"
          >
            <header className="pg-cc6-chart-head">
              <div className="pg-cc6-chart-head__copy">
                <p className="pg-ds-label">{experience.performance.periodLabel}</p>
                <h2 id="pg-ce-performance-title" className="pg-cc6-panel-title">
                  {experience.performance.title}
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
                <span
                  className={cn(
                    "pg-cc6-chart-head__value",
                    (activeChart.id === "revenue" || activeChart.id === "leads") &&
                      "pg-cc7-grad-text"
                  )}
                >
                  {activeChart.heroValue}
                </span>
              </div>
            </header>

            {experience.performance.metrics.length > 1 ? (
              <div className="pg-mw-metric-tabs" role="tablist">
                {experience.performance.metrics.map((metric: CampaignExperienceChartMetric) => (
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
                    <linearGradient id="pg-ce-chart-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--pg-peer-marketing)" />
                      <stop offset="100%" stopColor="var(--pg-v13-purple-accent, #7c3aed)" />
                    </linearGradient>
                    <linearGradient id="pg-ce-chart-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
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
                  colorVar="url(#pg-ce-chart-grad)"
                  areaFillVar="url(#pg-ce-chart-area-grad)"
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

      {/* Section D — Creative Assets */}
      {experience.assets.length > 0 ? (
        <section className="pg-ce-row" aria-labelledby="pg-ce-assets-title">
          <header className="pg-mw-section-head">
            <h2 id="pg-ce-assets-title" className="pg-ce-section-title">
              {nl ? "Creative Strategy" : "Creative Strategy"}
            </h2>
          </header>
          <CeCreativeAssetGrid assets={experience.assets} />
        </section>
      ) : null}

      {/* Section E — Campaign Progress */}
      <section className="pg-ce-row">
        <CeCampaignProgress progress={experience.progress} nl={nl} />
      </section>

      {/* Section F — Recommendations */}
      {experience.recommendation ? (
        <section className="pg-ce-row pg-ce-row--rec" aria-label={nl ? "Aanbeveling" : "Recommendation"}>
          <CcRecommendationHero
            recommendation={{
              peerLabel: nl ? "Aanbeveling" : "Recommendation",
              recommendation: experience.recommendation.headline,
              impact: experience.recommendation.impact,
              primaryLabel: experience.recommendation.primaryLabel,
              href: experience.recommendation.href ?? "#",
              accentVar: "var(--pg-peer-marketing)",
              impactMetrics: experience.recommendation.impactMetrics,
            }}
            href={recommendationHref}
            nl={nl}
          />
        </section>
      ) : null}

      {/* Section G — Activity */}
      {experience.activity.length > 0 ? (
        <section className="pg-ce-row" aria-labelledby="pg-ce-activity-title">
          <article className="pg-cc6-card pg-ce-activity" data-testid="pg-ce-activity">
            <h2 id="pg-ce-activity-title" className="pg-ce-section-title">
              {nl ? "Activiteit" : "Activity"}
            </h2>
            <ol className="pg-mw-terminal__log">
              {experience.activity.map((item, index) => (
                <li
                  key={item.id}
                  className={cn(
                    "pg-mw-terminal__line",
                    index === 0 && "pg-mw-terminal__line--latest"
                  )}
                >
                  <time className="pg-mw-terminal__time" dateTime={item.timestamp}>
                    {index === 0 ? <span className="pg-mw-terminal__fresh-dot" aria-hidden /> : null}
                    {item.timeLabel}
                  </time>
                  <span className="pg-mw-terminal__msg">{item.message}</span>
                </li>
              ))}
            </ol>
          </article>
        </section>
      ) : null}
    </div>
  );
}
