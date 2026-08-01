"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { activitySourcesFromMarketingSnapshots } from "@/lib/home";
import { buildV17CommandCenterViewModel } from "@/lib/customer-v17/build-v17-command-center-view-model";
import { getV17CommandCenterCopy } from "@/lib/i18n/v17-command-center-copy";
import { formatHomeRelativeTime } from "@/lib/i18n";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { v17AttentionCtas } from "@/lib/customer-v17/build-v17-cc-attention";
import { officeHref } from "@/lib/office/links";
import { DEMO_PEER_ID } from "@/lib/office/demo/demo-company";

type HomeTrendCard = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  sourceLabel: string;
  large?: boolean;
};

function HomeTrendSpark({ large = false, variant = "a" }: { large?: boolean; variant?: "a" | "b" }) {
  const w = large ? 320 : 120;
  const h = large ? 120 : 48;
  const path = large
    ? variant === "b"
      ? "M0 95 L80 100 L160 80 L240 88 L320 35"
      : "M0 95 L80 72 L160 78 L240 42 L320 28"
    : variant === "b"
      ? "M0 38 L30 40 L60 28 L90 32 L120 18"
      : "M0 38 L30 32 L60 34 L90 22 L120 18";
  const area = large ? `M${path.slice(2)} L320,120 L0,120 Z` : `M${path.slice(2)} L120,48 L0,48 Z`;
  const areaClass = variant === "b" ? "pg-v13-trend-area pg-v13-trend-area--b" : "pg-v13-trend-area";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className="h-full w-full">
      {large ? (
        <>
          <line className="pg-v13-grid-line" x1="0" y1="15" x2={w} y2="15" />
          <line className="pg-v13-grid-line" x1="0" y1="50" x2={w} y2="50" />
          <line className="pg-v13-grid-line" x1="0" y1="85" x2={w} y2="85" />
        </>
      ) : null}
      <path className={areaClass} d={area} />
      <path className={variant === "b" ? "pg-v13-trend-line pg-v13-trend-line--b" : "pg-v13-trend-line"} d={`M${path.slice(2)}`} />
    </svg>
  );
}

function TrendCard({ card }: { card: HomeTrendCard }) {
  const variant = card.id === "time" ? "b" : "a";

  return (
    <div className={card.large ? "pg-v13-trend-card" : "pg-v13-trend-card pg-v13-trend-card--sm"}>
      <div className="pg-v13-trend-head">
        <div className="pg-v13-trend-lbl">{card.label}</div>
        <div className="pg-v13-trend-valrow">
          <span className="pg-v13-trend-val">{card.value}</span>
          {card.delta ? <span className="pg-v13-trend-delta">{card.delta}</span> : null}
        </div>
        <div className="pg-v13-trend-cap">{card.sourceLabel}</div>
      </div>
      <div className={card.large ? "pg-v13-trend-chart" : "pg-v13-trend-chart pg-v13-trend-chart--mini"}>
        <HomeTrendSpark large={card.large} variant={variant} />
        <div className="pg-v13-trend-x">
          {["Week 1", "Week 2", "Week 3", "Week 4"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function IedereenView({
  homeState,
  isDemo = false,
}: {
  homeState: HandoffHomeState;
  isDemo?: boolean;
}) {
  const { handoff, viewModel, copy, marketingSnapshots, canonicalPeers } = homeState;
  const localePreference = customerLocalePreferenceFromEnv();
  const v17Copy = getV17CommandCenterCopy(localePreference);

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

  const nl = localePreference === "nl";
  const waitingTitle =
    model.attention.total > 0 ? (
      <>
        {v17Copy.waitingForYou} — <span className="pg-v13-n">{model.attention.total}</span>
      </>
    ) : (
      v17Copy.waitingForYou
    );

  const attentionCards = [model.attention.primary, model.attention.secondary].filter(Boolean);

  const demoStatBoxes = isDemo
    ? [
        { label: nl ? "Goedgekeurde opdrachten" : "Approved assignments", value: "4" },
        { label: nl ? "Campagnes actief" : "Active campaigns", value: "6" },
      ]
    : model.weeklyImpact.metrics.slice(0, 2).map((m) => ({
        label: m.label,
        value: String(m.value),
      }));

  const demoTrends: HomeTrendCard[] | null = isDemo
    ? [
        {
          id: "revenue",
          label: nl ? "Beïnvloede omzet" : "Influenced revenue",
          value: "€41.200",
          delta: "▲ 18,4%",
          sourceLabel: nl ? "HubSpot · vs vorige 30 dagen" : "HubSpot · vs previous 30 days",
          large: true,
        },
        {
          id: "time",
          label: nl ? "Tijd bespaard" : "Time saved",
          value: "6,5u",
          delta: "▲ 12%",
          sourceLabel: nl ? "Peergent · vs vorige 30 dagen" : "Peergent · vs previous 30 days",
          large: true,
        },
      ]
    : null;

  const demoCompleted = isDemo
    ? [
        { id: "c1", peerLabel: "Marketing", summary: "3 LinkedIn-posts, e-mailconcept", serviceKey: "marketing" as const },
        { id: "c2", peerLabel: "Support", summary: "14 tickets opgelost", serviceKey: "support" as const },
        { id: "c3", peerLabel: "Sales", summary: "2 opvolgmails, 1 afspraak", serviceKey: "sales" as const },
      ]
    : null;

  const demoPerformance = isDemo
    ? [
        { id: "p1", label: "Marketing", tasksThisWeek: 40, performancePct: 94 },
        { id: "p2", label: "Sales", tasksThisWeek: 12, performancePct: 76 },
        { id: "p3", label: "Support", tasksThisWeek: 41, performancePct: 98 },
      ]
    : null;

  const completedRows = demoCompleted ?? model.completedToday;
  const performanceRows = demoPerformance ?? model.performance;

  const attentionHref = (href: string) => {
    if (!isDemo) return href;
    if (href.includes("/team/")) return officeHref(DEMO_PEER_ID, "work");
    return href;
  };

  return (
    <div data-testid="iedereen-view">
      <p className="pg-v13-eyebrow">{v17Copy.eyebrow}</p>
      <h1 className="pg-v13-title">
        {nl ? "Alles onder controle. Je team is aan het werk." : v17Copy.title}
      </h1>
      <p className="pg-v13-sub">
        {nl ? (
          <>
            Drie collega&apos;s actief — <em>Sales wacht op jou.</em>
          </>
        ) : (
          v17Copy.supporting
        )}
      </p>

      {attentionCards.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label pg-v13-sec-label--attn">{waitingTitle}</p>
          {attentionCards.map((card) => {
            if (!card) return null;
            const ctas = v17AttentionCtas(card, {
              reviewCta: v17Copy.reviewLabel,
              viewCta: v17Copy.viewLabel,
              approveCta: v17Copy.approveLabel,
            });
            return (
              <div key={card.id} className="pg-v13-decision mb-2">
                <div>
                  <b>{card.title}</b>
                  <span>{card.contextLine}</span>
                </div>
                <Link
                  href={attentionHref(ctas.primary.href)}
                  className="pg-v13-btn pg-v13-btn--sm no-underline"
                >
                  {ctas.primary.label}
                </Link>
              </div>
            );
          })}
        </section>
      ) : null}

      {completedRows.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Vandaag afgerond" : v17Copy.completedToday}</p>
          {completedRows.map((row) => (
            <div key={row.id} className="pg-v13-done-row">
              <span
                className="pg-v13-dot2"
                style={{
                  background:
                    row.serviceKey === "marketing"
                      ? "var(--pg-v13-marketing)"
                      : row.serviceKey === "support"
                        ? "var(--pg-v13-support)"
                        : "var(--pg-v13-sales)",
                }}
              />
              <strong>{row.peerLabel}</strong> — {row.summary}
            </div>
          ))}
        </section>
      ) : null}

      {performanceRows.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Je team" : v17Copy.performanceTitle}</p>
          <div className="pg-v13-row-list">
            {performanceRows.map((row) => (
              <div key={row.id} className="pg-v13-row-item">
                <span className="font-semibold text-[var(--pg-v13-ink)]">{row.label}</span>
                <span className="flex items-center gap-2">
                  <span className="pg-v13-row-src">
                    {row.tasksThisWeek} {nl ? "taken" : "tasks"}
                  </span>
                  <span className="pg-v13-row-val tabular-nums text-[var(--pg-v13-ink)]">
                    {row.performancePct != null ? `${row.performancePct}%` : "—"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {demoStatBoxes.length > 0 || demoTrends ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">
            {nl ? (
              <>
                Trends — 30 dagen <span className="pg-v13-n">· 41 taken afgerond deze week</span>
              </>
            ) : (
              v17Copy.weeklyImpact
            )}
          </p>
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
            <defs>
              <linearGradient id="pgV13GradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--pg-v13-blue)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--pg-v13-blue)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="pgV13GradB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--pg-v13-indigo)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--pg-v13-indigo)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          {demoStatBoxes.length > 0 ? (
            <div className="pg-v13-stat-row pg-v13-stat-row--two">
              {demoStatBoxes.map((box) => (
                <div key={box.label} className="pg-v13-stat-box">
                  <div className="pg-v13-stat-lbl">{box.label}</div>
                  <div className="pg-v13-stat-val">{box.value}</div>
                </div>
              ))}
            </div>
          ) : null}
          {demoTrends ? (
            <div className="pg-v13-trend-grid pg-v13-trend-grid--two">
              {demoTrends.map((card) => (
                <TrendCard key={card.id} card={card} />
              ))}
            </div>
          ) : model.weeklyImpact.showSection && model.weeklyImpact.metrics.length > 2 ? (
            <div className="pg-v13-trend-grid">
              {model.weeklyImpact.metrics.slice(2, 4).map((metric) => (
                <div key={metric.id} className="pg-v13-trend-card pg-v13-trend-card--sm">
                  <div className="pg-v13-trend-head">
                    <div className="pg-v13-trend-lbl">{metric.label}</div>
                    <div className="pg-v13-trend-valrow">
                      <span className="pg-v13-trend-val">{metric.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
