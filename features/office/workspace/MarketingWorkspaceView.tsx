"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { CcKpiTile } from "@/features/home/command-center/visual/CcKpiTile";
import { CcRecommendationHero } from "@/features/home/command-center/visual/CcRecommendationHero";
import {
  kpiIconFor,
  peerIconSurfaceStyle,
} from "@/features/home/command-center/visual/cc-visual-utils";
import type { MarketingWorkspaceBands } from "@/lib/office/workspace/types";
import { MwExecutiveRow } from "./visual/MwExecutiveRow";
import { MwCampaignHeroGrid } from "./visual/MwCampaignHeroCard";
import { MwContentAssetStrip } from "./visual/MwContentAssetCard";
import { MwActivityFeed } from "./visual/MwActivityFeed";
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

export type MarketingWorkspaceViewProps = {
  bands: MarketingWorkspaceBands;
  locale?: string | null;
};

export default function MarketingWorkspaceView({
  bands,
  locale,
}: MarketingWorkspaceViewProps) {
  const nl = locale === "nl";
  const showExecRow = bands.performance && bands.businessIntelligence;
  const showMidRow = Boolean(bands.approvals || bands.activity);
  const activityExpanded = !bands.approvals;

  return (
    <div
      className="pg-cc6 pg-cc7 pg-cc8 pg-cc10 pg-cc12 pg-cc13 pg-cc14 pg-cc15 pg-cc16 pg-cc17 pg-cc18 pg-cc19 pg-cc20 pg-cc21 pg-mw-workspace"
      data-testid="marketing-workspace-view"
    >
      {/* Row A — Marketing Overview */}
      <section className="pg-mw-row pg-mw-row--overview" aria-labelledby="pg-mw-overview">
        <p id="pg-mw-overview" className="pg-mw-overview__summary">
          {bands.overview.parts.map((part, index) => (
            <span key={`${part.text}-${index}`}>
              {index > 0 ? (
                <span className="pg-mw-overview__sep" aria-hidden>
                  {" "}
                  ·{" "}
                </span>
              ) : null}
              <span
                className={cn(part.attention && "pg-mw-overview__attention")}
              >
                {part.text}
              </span>
            </span>
          ))}
        </p>
      </section>

      {/* Row B — Premium KPI cards */}
      {bands.kpis.items.length > 0 ? (
        <section
          className="pg-mw-row pg-mw-row--kpi pg-cc15-row pg-cc15-row--kpi"
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

      {/* Row C — Business Intelligence (38%) + Performance (62%) */}
      {showExecRow ? (
        <MwExecutiveRow
          performance={bands.performance!}
          businessIntelligence={bands.businessIntelligence!}
          nl={nl}
        />
      ) : null}

      {/* Row D — Live Campaigns (visual hero) */}
      {bands.campaigns ? (
        <section className="pg-mw-row pg-mw-row--campaigns" aria-labelledby="pg-mw-campaigns-title">
          <header className="pg-mw-section-head pg-mw-section-head--hero">
            <h2 id="pg-mw-campaigns-title" className="pg-mw-section-head__title">
              {bands.campaigns.title}
            </h2>
            <Link
              href={bands.campaigns.viewAllHref}
              className="pg-mw-section-link pg-focus-premium"
            >
              {nl ? "Alle campagnes" : "All campaigns"}
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </header>

          {bands.campaigns.items.length > 0 ? (
            <MwCampaignHeroGrid campaigns={bands.campaigns.items} nl={nl} />
          ) : bands.campaigns.emptyMessage ? (
            <div className="pg-cc6-card pg-mw-campaigns-empty" data-testid="pg-mw-campaigns-empty">
              <p className="pg-mw-campaigns-empty__copy">
                {bands.campaigns.emptyMessage}{" "}
                {bands.campaigns.emptyLinkHref && bands.campaigns.emptyLinkLabel ? (
                  <Link href={bands.campaigns.emptyLinkHref} className="pg-mw-section-link">
                    {bands.campaigns.emptyLinkLabel}
                  </Link>
                ) : null}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Row E — Approval Center + Recent Activity */}
      {showMidRow ? (
        <section
          className={cn(
            "pg-mw-row pg-mw-row--mid pg-cc15-row pg-cc15-row--mid",
            activityExpanded && "pg-mw-row--mid-solo"
          )}
        >
          {bands.approvals ? (
            <article
              className="pg-cc6-card pg-cc18-module pg-cc18-module--approvals"
              data-testid="pg-mw-approvals"
            >
              <header className="pg-cc18-module__head">
                <h2 className="pg-cc18-module__title">
                  {nl ? "Wacht op jou" : "Waiting for you"}
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
          ) : (
            <div aria-hidden />
          )}

          {bands.activity ? (
            <MwActivityFeed band={bands.activity} expanded={activityExpanded} />
          ) : null}
        </section>
      ) : null}

      {/* Row F — Content ready to publish */}
      {bands.content ? (
        <section className="pg-mw-row pg-mw-row--assets" aria-labelledby="pg-mw-content-title">
          <header className="pg-mw-section-head">
            <h2 id="pg-mw-content-title" className="pg-cc6-panel-title">
              {bands.content.title}
            </h2>
            <Link href={bands.content.viewAllHref} className="pg-mw-section-link pg-focus-premium">
              {nl ? "Alle content" : "All content"}
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </header>
          <MwContentAssetStrip items={bands.content.items} />
        </section>
      ) : null}

      {/* Row G — Recommendation Hero */}
      {bands.recommendation ? (
        <section
          className="pg-mw-row pg-mw-row--rec pg-cc15-row pg-cc15-row--rec pg-cc15-row--last"
          aria-label={nl ? "Aanbeveling" : "Recommendation"}
        >
          <CcRecommendationHero
            recommendation={{
              peerLabel: nl ? "Aanbeveling" : "Recommendation",
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
    </div>
  );
}
