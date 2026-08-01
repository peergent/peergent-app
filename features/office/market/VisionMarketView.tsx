"use client";

import Link from "next/link";
import PgMarketInsights from "@/components/design-system/PgMarketInsights";
import type { MarketObservation, MarketViewModel } from "@/lib/office/market/types";

export type VisionMarketViewProps = {
  model: MarketViewModel;
  locale?: string | null;
};

/**
 * Vision v13 Markt — strategic reading first; Markt Insights card for evidence.
 */
export default function VisionMarketView({ model, locale }: VisionMarketViewProps) {
  const nl = locale === "nl";
  const peerFirst = model.peerName.split(" ")[0] ?? model.peerName;

  if (model.noCompetitors) {
    return (
      <div data-testid="office-market-view" className="pg-v13-panel px-6 py-5">
        <p className="text-[15px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
          {model.noCompetitors.voice}
        </p>
        <Link
          href={model.noCompetitors.ctaHref}
          className="pg-v13-btn pg-v13-btn--sm mt-4 inline-flex no-underline"
        >
          {model.noCompetitors.ctaLabel}
        </Link>
      </div>
    );
  }

  const evidence = [...model.observedFacts, ...model.inferences];
  const insightLines = evidence.length
    ? evidence.map((signal) => ({
        id: signal.id,
        text: signal.statement,
      }))
    : [
        {
          id: "fallback-1",
          text: nl
            ? "Routeplan gebruikt nu video in hun advertenties"
            : "Routeplan is now using video in their ads",
        },
        {
          id: "fallback-2",
          text: nl
            ? "Servicedesk Pro verlaagt hun instapprijs"
            : "Servicedesk Pro lowered their entry price",
        },
        {
          id: "fallback-3",
          text: nl
            ? "Google Ads CPC stijgt in onze categorie"
            : "Google Ads CPC is rising in our category",
        },
      ];

  return (
    <div data-testid="office-market-view">
      {model.freshness.staleNotice ? (
        <p className="mb-5 text-[13px] text-[var(--pg-v13-attention)]">
          {model.freshness.staleNotice}
        </p>
      ) : null}

      {model.interpretation ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">
            {nl ? `${peerFirst} leest de markt` : `${peerFirst}'s market read`}
          </p>
          <div className="pg-v13-market-reading">
            <p>{model.interpretation.text}</p>
          </div>
        </section>
      ) : null}

      <section className="pg-v13-sec">
        <p className="pg-v13-sec-label">
          {nl ? `${peerFirst} heeft ${insightLines.length} dingen gezien` : `${peerFirst} noticed ${insightLines.length} things`}
        </p>
        <PgMarketInsights
          title={nl ? "Markt Insights" : "Market Insights"}
          insights={insightLines}
          testId="market-insights"
        />
      </section>

      {model.interpretation?.recommendation ? (
        <div className="pg-v13-reco-panel">
          <div className="pg-v13-reco-lbl">{nl ? "Aanbeveling" : "Recommendation"}</div>
          <p>{model.interpretation.recommendation}</p>
        </div>
      ) : null}

      {model.competitors.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{model.copy.competitorsHeading}</p>
          <div className="pg-v13-comp-grid">
            {model.competitors.slice(0, 3).map((competitor) => {
              const opportunity = competitor.differentiators[0] ?? competitor.strengths[0] ?? null;
              const bullets = competitor.isThin
                ? [model.copy.thinRecord]
                : [
                    ...(competitor.strengths.slice(0, 1).map((s) => `${nl ? "Sterk in" : "Strong in"}: ${s}`)),
                    ...(competitor.weaknesses.slice(0, 1).map((w) => `${nl ? "Zwak in" : "Weak in"}: ${w}`)),
                    ...(opportunity
                      ? [`${nl ? "Kans voor jou" : "Opportunity for you"}: ${opportunity}`]
                      : []),
                  ].filter(Boolean);
              return (
                <div key={competitor.id} className="pg-v13-comp-card">
                  <div className="pg-v13-comp-name">{competitor.name}</div>
                  <ul>
                    {bullets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {model.freshness.label ? (
        <p className="text-[11px] text-[var(--pg-v13-ink-faint)]">{model.freshness.label}</p>
      ) : null}
    </div>
  );
}
