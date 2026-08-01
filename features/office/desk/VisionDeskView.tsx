"use client";

import Link from "next/link";
import PgMarketInsights from "@/components/design-system/PgMarketInsights";
import type { DeskViewModel } from "@/lib/office/desk/types";
import type { DeskBriefing } from "@/lib/office/desk/briefing-types";
import { officeHref } from "@/lib/office/links";

export type VisionDeskViewProps = {
  model: DeskViewModel;
  briefing?: DeskBriefing | null;
  locale?: string | null;
  onDecisionPrimary?: (decisionId: string) => void;
};

function SparkPath() {
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <path d="M0 22 L20 18 L40 20 L60 10 L80 12 L100 4" />
    </svg>
  );
}

/**
 * Vision v13 Bureau — matches docs/reference/peergent-vision-v13 mockup Bureau subview.
 * Uses existing desk VM + briefing; presentation only.
 */
export default function VisionDeskView({
  model,
  briefing = null,
  locale,
  onDecisionPrimary,
}: VisionDeskViewProps) {
  const peerId = model.peerId;
  const copy = model.copy;

  const doneItems =
    model.completed.length > 0
      ? model.completed
      : (briefing?.changes.slice(0, 5).map((c) => ({ id: c.id, label: c.label })) ?? []);

  const nextItems = briefing?.nextStep
    ? [briefing.nextStep.label]
    : briefing?.panels.find((p) => p.id === "work")?.stats.slice(0, 2).map((s) => s.hint ?? s.label) ?? [];

  const primaryKpi = briefing?.kpis.find((k) => k.emphasis === "outcome") ?? briefing?.kpis[0];
  const leadsKpi = briefing?.kpis.find((k) => k.id.includes("lead") || k.label.toLowerCase().includes("lead"));

  return (
    <div data-testid="office-desk-view">
      {model.decisions.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label pg-v13-sec-label--attn">
            {copy.decisionsHeading(model.decisions.length)}
          </p>
          {model.decisions.map((decision) => (
            <div key={decision.id} className="pg-v13-decision mb-2">
              <div>
                <b>{decision.title}</b>
                <span>{decision.unblocks}</span>
              </div>
              {decision.href ? (
                <Link href={decision.href} className="pg-v13-btn pg-v13-btn--sm no-underline">
                  {decision.primaryLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  className="pg-v13-btn pg-v13-btn--sm"
                  onClick={() => onDecisionPrimary?.(decision.id)}
                >
                  {decision.primaryLabel}
                </button>
              )}
            </div>
          ))}
        </section>
      ) : null}

      {doneItems.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">
            {locale === "nl" ? "Vandaag gedaan" : "Done today"}
          </p>
          {doneItems.map((item) => (
            <div key={item.id} className="pg-v13-done-row">
              <span className="pg-v13-dot2" style={{ background: "var(--pg-v13-marketing)" }} />
              {item.label}
            </div>
          ))}
        </section>
      ) : null}

      {nextItems.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{locale === "nl" ? "Hierna" : "Up next"}</p>
          {nextItems.map((row) => (
            <div key={row} className="pg-v13-next-row">
              {row}
            </div>
          ))}
        </section>
      ) : null}

      {briefing?.nextStep &&
      !model.decisions.some((d) => d.title === briefing.nextStep?.label) ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label pg-v13-sec-label--attn">
            {locale === "nl" ? "Emma raadt aan" : "Emma recommends"}
          </p>
          <div className="pg-v13-reco-panel">
            <p className="font-semibold text-[var(--pg-v13-ink)]">{briefing.nextStep.label}</p>
            {briefing.nextStep.why ? (
              <p className="text-[13.5px] text-[var(--pg-v13-ink-soft)]">{briefing.nextStep.why}</p>
            ) : null}
            {briefing.nextStep.href ? (
              <Link
                href={briefing.nextStep.href}
                className="pg-v13-btn pg-v13-btn--sm mt-3 inline-flex no-underline"
              >
                {briefing.nextStep.ctaLabel}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="pg-v13-sec">
        <PgMarketInsights
          compact
          title={locale === "nl" ? "Markt Insights" : "Market Insights"}
          insights={[
            {
              id: "desk-1",
              text:
                locale === "nl"
                  ? "Routeplan test video-advertenties in jullie categorie"
                  : "Routeplan is testing video ads in your category",
            },
            {
              id: "desk-2",
              text:
                locale === "nl"
                  ? "Google Ads CPC stijgt licht — Emma houdt het in de gaten"
                  : "Google Ads CPC is edging up — Emma is watching it",
            },
            {
              id: "desk-3",
              text:
                locale === "nl"
                  ? "Warmtepomp-zoekvolume piekt in augustus"
                  : "Heat pump search volume peaks in August",
            },
          ]}
          testId="desk-market-insights"
        />
      </section>

      {primaryKpi ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">
            {locale === "nl" ? "Deze week — snel overzicht" : "This week — at a glance"}
          </p>
          <div className="pg-v13-spark-mini">
            <SparkPath />
            <p className="text-[12.5px] leading-snug text-[var(--pg-v13-ink-soft)]">
              <b className="text-[var(--pg-v13-ink)]">{primaryKpi.value}</b>
              {primaryKpi.label.toLowerCase()}
              {leadsKpi ? (
                <>
                  {" "}
                  · <b className="text-[var(--pg-v13-ink)]">{leadsKpi.value}</b> {leadsKpi.label.toLowerCase()}
                </>
              ) : null}
              {briefing?.executive?.interpretation
                ? ` — ${briefing.executive.interpretation}`
                : null}
            </p>
          </div>
          <Link
            href={officeHref(peerId, "performance")}
            className="pg-v13-btn pg-v13-btn--ghost inline-flex no-underline"
          >
            {locale === "nl" ? "Bekijk volledige resultaten →" : "View full results →"}
          </Link>
        </section>
      ) : null}

      {model.autonomyRequest ? (
        <section className="pg-v13-sec pg-v13-panel p-5">
          <p className="pg-v13-sec-label">{locale === "nl" ? "Zelfstandigheid" : "Autonomy"}</p>
          <p className="text-[14px] text-[var(--pg-v13-ink-soft)]">{model.autonomyRequest.proposal}</p>
        </section>
      ) : null}
    </div>
  );
}
