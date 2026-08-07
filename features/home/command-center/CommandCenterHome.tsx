"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  Inbox,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import PgTrendChart from "@/components/design-system/PgTrendChart";
import { activitySourcesFromMarketingSnapshots } from "@/lib/home";
import { buildCommandCenterBands } from "@/lib/home/build-command-center-bands";
import {
  CUSTOMER_PEER_RAIL_ORDER,
  customerPeerRoleBucket,
} from "@/lib/customer-v17/select-canonical-customer-peers";
import { formatHomeRelativeTime } from "@/lib/i18n";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { officeHref, toOfficeHref } from "@/lib/office/links";
import { DEMO_PEER_ID } from "@/lib/office/demo/demo-company";
import { CcKpiTile } from "./visual/CcKpiTile";
import { CcWorkforceBriefing } from "./visual/CcWorkforceBriefing";
import { CcRecommendationHero } from "./visual/CcRecommendationHero";
import {
  CC_NAV_ITEMS,
  kpiIconFor,
  navAccent,
  peerIconSurfaceStyle,
} from "./visual/cc-visual-utils";
import "./command-center-home.css";
import "./command-center-dna.css";
import "./command-center-polish.css";
import "./command-center-balance.css";
import "./command-center-executive.css";
import "./command-center-art.css";
import "./command-center-reference.css";
import "./command-center-grid.css";
import "./command-center-final-polish.css";
import "./command-center-executive-quality.css";
import "./command-center-mid-modules.css";
import "./command-center-design-freeze.css";

/** Presentation-only accents for approval row items (index order). */
const APPROVAL_ITEM_ACCENTS = [
  "var(--pg-peer-marketing)",
  "var(--pg-v13-purple-accent, #7c3aed)",
  "var(--pg-peer-support)",
] as const;

export default function CommandCenterHome({
  homeState,
  isDemo = false,
}: {
  homeState: HandoffHomeState;
  isDemo?: boolean;
}) {
  const { handoff, viewModel, copy, marketingSnapshots, canonicalPeers } = homeState;
  const localePreference = customerLocalePreferenceFromEnv();

  if (!handoff) return null;

  const bands = buildCommandCenterBands({
    viewModel,
    handoff,
    copy,
    activitySources: activitySourcesFromMarketingSnapshots(marketingSnapshots),
    formatRelativeTime: (iso) => formatHomeRelativeTime(iso, copy),
    localePreference,
    canonicalPeers,
    marketingSnapshots,
    isDemo,
  });

  const nl = localePreference === "nl";

  const attentionHref = (href: string, peerId?: string) => {
    if (href.startsWith("/company")) {
      return officeHref(peerId ?? DEMO_PEER_ID, "agreement");
    }
    const mapped = toOfficeHref(peerId ?? DEMO_PEER_ID, href);
    if (isDemo && href.includes("/team/")) return officeHref(DEMO_PEER_ID, "work");
    return mapped;
  };

  const activityHref = (href: string) => {
    if (href.startsWith("/team/")) return toOfficeHref(DEMO_PEER_ID, href);
    return href;
  };

  const peerForRole = (role: (typeof CUSTOMER_PEER_RAIL_ORDER)[number]) =>
    canonicalPeers.find((peer) => customerPeerRoleBucket(peer.role) === role);

  return (
    <div
      className="pg-cc6 pg-cc7 pg-cc8 pg-cc10 pg-cc12 pg-cc13 pg-cc14 pg-cc15 pg-cc16 pg-cc17 pg-cc18 pg-cc19 pg-cc20 pg-cc21"
      data-testid="command-center-home"
    >
      {/* Row 1 — Greeting */}
      <div className="pg-cc15-row pg-cc15-row--greeting">
        <div className="pg-cc6-card pg-cc6-greeting pg-cc8-hero--greeting">
          <div className="pg-cc6-greeting__copy">
            <h1 className="pg-cc6-greeting__title pg-cc7-grad-text">{bands.header.greeting}</h1>
            <p className="pg-cc6-greeting__sub">{bands.header.supporting}</p>
          </div>
          <div className="pg-cc6-greeting__status" data-testid="pg-cc-workforce-live">
            <span className="pg-cc6-live-dot" aria-hidden />
            <span className="pg-cc6-live-label">
              {nl ? "Workforce Live" : "Workforce Live"}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2 — KPIs */}
      {bands.kpis.length > 0 ? (
        <div className="pg-cc15-row pg-cc15-row--kpi" aria-label={nl ? "Kernmetrics" : "Key metrics"}>
          {bands.kpis.map((kpi, index) => (
            <CcKpiTile
              key={kpi.id}
              id={kpi.id}
              label={kpi.label}
              value={kpi.value}
              trend={kpi.methodology}
              icon={kpiIconFor(kpi.id)}
              href={kpi.href ? attentionHref(kpi.href) : null}
              hero={index === 0}
              accent={
                kpi.id.includes("revenue")
                  ? "var(--pg-peer-marketing)"
                  : kpi.id.includes("campaign")
                    ? "var(--pg-peer-sales)"
                    : "var(--pg-action-primary)"
              }
            />
          ))}
        </div>
      ) : null}

      {/* Row 3 — Executive: briefing | chart */}
      {(bands.chart || bands.workforceBriefing) && (
        <div className="pg-cc15-row pg-cc15-row--exec">
          {bands.workforceBriefing ? (
            <CcWorkforceBriefing
              briefing={bands.workforceBriefing}
              nl={nl}
              salutation={bands.header.greeting}
              pendingCount={bands.attention.length}
            />
          ) : (
            <div aria-hidden />
          )}

          {bands.chart ? (
            <article
              className="pg-cc6-card pg-cc6-chart-panel pg-cc8-hero--chart"
              data-testid="pg-cc-chart"
            >
              <header className="pg-cc6-chart-head">
                <div className="pg-cc6-chart-head__copy">
                  <p className="pg-ds-label">{bands.chart.promise}</p>
                  <h2 className="pg-cc6-panel-title">{bands.chart.title}</h2>
                </div>
                <div className="pg-cc6-chart-head__metric">
                  <span className="pg-cc6-chart-head__value pg-cc7-grad-text">
                    {bands.chart.metricValue}
                  </span>
                  {bands.chart.metricDelta ? (
                    <span
                      className={cn(
                        "pg-cc6-chart-head__delta",
                        bands.chart.metricDeltaPositive
                          ? "pg-cc6-chart-head__delta--up"
                          : "pg-cc6-chart-head__delta--down"
                      )}
                    >
                      {bands.chart.metricDelta}
                    </span>
                  ) : null}
                </div>
              </header>
              <div className="pg-cc6-chart-wrap">
                <svg width="0" height="0" aria-hidden className="pg-cc6-chart-defs">
                  <defs>
                    <linearGradient id="pg-cc6-chart-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--pg-peer-marketing)" />
                      <stop offset="100%" stopColor="var(--pg-v13-purple-accent, #7c3aed)" />
                    </linearGradient>
                    <linearGradient id="pg-cc6-chart-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--pg-peer-marketing)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--pg-v13-purple-accent, #7c3aed)" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                </svg>
                <PgTrendChart
                  points={bands.chart.points}
                  label={bands.chart.label}
                  height={132}
                  colorVar="url(#pg-cc6-chart-grad)"
                  areaFillVar="url(#pg-cc6-chart-area-grad)"
                  animate
                  variant="hero"
                  valueFormat={
                    bands.chart.title.toLowerCase().includes("revenue") ||
                    bands.chart.title.toLowerCase().includes("omzet")
                      ? "currency"
                      : "number"
                  }
                  className="pg-cc6-chart"
                />
              </div>
              {bands.chart.insight ? (
                <p className="pg-cc6-chart-insight">
                  <Sparkles size={14} aria-hidden className="pg-cc6-chart-insight__icon" />
                  {bands.chart.insight}
                </p>
              ) : null}
            </article>
          ) : (
            <article className="pg-cc6-card pg-cc6-chart-panel pg-cc6-chart-panel--empty">
              <p className="pg-ds-label">{nl ? "Laatste 7 dagen" : "Last 7 days"}</p>
              <h2 className="pg-cc6-panel-title">
                {nl ? "Bedrijfsimpact" : "Business impact"}
              </h2>
              <p className="pg-cc6-empty-copy">
                {nl
                  ? "Zodra je team meer werk afhandelt, zie je hier de trend."
                  : "Once your team completes more work, the trend appears here."}
              </p>
            </article>
          )}
        </div>
      )}

      {/* Row 4 — Approvals | Activity */}
      {(bands.attention.length > 0 || bands.activity.length > 0) ? (
        <div className="pg-cc15-row pg-cc15-row--mid">
          {bands.attention.length > 0 ? (
            <article
              className="pg-cc6-card pg-cc18-module pg-cc18-module--approvals"
              aria-labelledby="pg-cc6-attention-title"
            >
              <header className="pg-cc18-module__head">
                <h2 id="pg-cc6-attention-title" className="pg-cc18-module__title">
                  {nl ? "Wacht op jou" : "Needs your attention"}
                </h2>
                <Link
                  href={bands.attentionViewAllHref}
                  className="pg-cc18-module__bell pg-focus-premium"
                  aria-label={
                    nl
                      ? `${bands.attention.length} openstaande goedkeuringen`
                      : `${bands.attention.length} pending approvals`
                  }
                >
                  <Bell size={15} strokeWidth={2} aria-hidden />
                  <span className="pg-cc18-module__bell-badge">{bands.attention.length}</span>
                </Link>
              </header>
              <div className="pg-cc18-module__body">
                <div className="pg-cc18-approvals-grid">
                  {bands.attention.map((item, index) => {
                    const accent =
                      APPROVAL_ITEM_ACCENTS[index % APPROVAL_ITEM_ACCENTS.length];
                    return (
                      <Link
                        key={item.id}
                        href={attentionHref(item.href, item.peerId)}
                        className="pg-cc18-approval-item pg-focus-premium"
                        data-testid={`pg-cc-attention-${item.id}`}
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
              </div>
            </article>
          ) : (
            <div aria-hidden />
          )}

          {bands.activity.length > 0 ? (
            <article
              className="pg-cc6-card pg-cc18-module pg-cc18-module--activity"
              aria-labelledby="pg-cc6-activity-title"
            >
              <header className="pg-cc18-module__head">
                <h2 id="pg-cc6-activity-title" className="pg-cc18-module__title">
                  {bands.activityLabel}
                </h2>
              </header>
              <div className="pg-cc18-module__body">
                <ol className="pg-cc18-activity-stream" data-testid="pg-cc-activity-list">
                  {bands.activity.map((item, index) => {
                    const peerName = item.title.split(" — ")[0] ?? item.title;
                    const action = item.title.includes(" — ")
                      ? item.title.split(" — ").slice(1).join(" — ")
                      : item.title;
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "pg-cc18-activity-row",
                          index === 0 && "pg-cc18-activity-row--latest"
                        )}
                        style={
                          {
                            ["--pg-cc18-peer-accent" as string]: item.accentVar,
                          } as CSSProperties
                        }
                      >
                        <span className="pg-cc18-activity-dot" aria-hidden />
                        <Link href={activityHref(item.href)} className="pg-cc18-activity-copy pg-focus-premium">
                          <span className="pg-cc18-activity-peer">{peerName}</span>
                          <span className="pg-cc18-activity-action">{action}</span>
                        </Link>
                        <time className="pg-cc18-activity-time" dateTime={item.datetime}>
                          {item.timeLabel}
                        </time>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </article>
          ) : (
            <div aria-hidden />
          )}
        </div>
      ) : null}

      {/* Row 5 — Navigation */}
      <div className="pg-cc15-row pg-cc15-row--nav pg-cc8-support" aria-labelledby="pg-cc6-nav-title">
        <header className="pg-cc6-section-head">
          <div>
            <p className="pg-ds-label">{nl ? "Navigatie" : "Navigation"}</p>
            <h2 id="pg-cc6-nav-title" className="pg-cc6-section-title">
              {nl ? "Ga naar je team" : "Go to your team"}
            </h2>
          </div>
        </header>
        <div className="pg-cc6-nav-grid">
          {CC_NAV_ITEMS.map((item) => {
            const peer = peerForRole(item.role);
            const peerId = peer?.id ?? DEMO_PEER_ID;
            const href =
              item.role === "Marketing"
                ? officeHref(peerId, "work")
                : officeHref(peerId, "desk");
            const accent = navAccent(item.role);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={href}
                className="pg-cc6-card pg-cc6-nav-card pg-ds-card--interactive pg-focus-premium"
              >
                <span
                  className="pg-cc6-nav-icon"
                  style={{ color: accent, ...peerIconSurfaceStyle(accent) }}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <span className="pg-cc6-nav-label">{nl ? item.labelNl : item.label}</span>
                <ArrowUpRight size={14} className="pg-cc6-nav-arrow" aria-hidden />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Row 6 — Recommendation (closing section) */}
      {bands.recommendation ? (
        <div className="pg-cc15-row pg-cc15-row--rec pg-cc15-row--last" aria-label={nl ? "Aanbeveling" : "Recommendation"}>
          <CcRecommendationHero
            recommendation={bands.recommendation}
            href={attentionHref(bands.recommendation.href)}
            nl={nl}
          />
        </div>
      ) : null}
    </div>
  );
}
