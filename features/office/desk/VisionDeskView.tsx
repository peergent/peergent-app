"use client";

import Link from "next/link";
import PgMarketInsights from "@/components/design-system/PgMarketInsights";
import type { DeskViewModel } from "@/lib/office/desk/types";
import type { DeskBriefing } from "@/lib/office/desk/briefing-types";
import type { DeskCampaignOverview } from "@/lib/office/desk/build-desk-campaign-overview";
import { officeHref } from "@/lib/office/links";

export type VisionDeskViewProps = {
  model: DeskViewModel;
  briefing?: DeskBriefing | null;
  campaignOverview?: DeskCampaignOverview | null;
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

function CampaignRow({
  row,
  locale,
}: {
  row: DeskCampaignOverview["live"][0];
  locale?: string | null;
}) {
  const nl = locale === "nl";

  if (row.isLive) {
    return (
      <Link href={row.href} className="pg-v13-settings-row pg-v13-settings-row--link mb-2 block no-underline">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="pg-v13-settings-name truncate">{row.name}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[var(--pg-v13-ink-soft)]">
              <span className="inline-flex items-center gap-1.5 text-[var(--pg-v13-marketing)]">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--pg-v13-marketing)]" aria-hidden />
                LIVE
              </span>
              {row.runningLabel ? <span>{row.runningLabel}</span> : null}
            </p>
            {row.dateRangeLabel ? (
              <p className="pg-v13-mono mt-1 text-[10px] text-[var(--pg-v13-ink-faint)]">{row.dateRangeLabel}</p>
            ) : null}
            {row.runningStatusLabel ? (
              <p className="pg-v13-mono mt-0.5 text-[10px] text-[var(--pg-v13-ink-faint)]">
                {row.runningStatusLabel}
              </p>
            ) : null}
          </div>
          {row.quickActionLabel ? (
            <span className="shrink-0 text-[12px] font-semibold text-[var(--pg-v13-blue)]">
              {row.quickActionLabel} →
            </span>
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <Link href={row.href} className="pg-v13-settings-row pg-v13-settings-row--link mb-2 block no-underline">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="pg-v13-settings-name truncate">{row.name}</p>
          <p className="pg-v13-settings-desc">{row.statusLabel}</p>
          {row.startDateLabel ? (
            <p className="pg-v13-mono mt-1 text-[10px] text-[var(--pg-v13-ink-faint)]">
              {row.startDateLabel}
              {row.daysRemaining != null
                ? ` · ${row.daysRemaining} ${nl ? "dagen resterend" : "days left"}`
                : ""}
            </p>
          ) : null}
        </div>
        {row.quickActionLabel ? (
          <span className="shrink-0 text-[12px] font-semibold text-[var(--pg-v13-blue)]">
            {row.quickActionLabel} →
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export default function VisionDeskView({
  model,
  briefing = null,
  campaignOverview = null,
  locale,
  onDecisionPrimary,
}: VisionDeskViewProps) {
  const peerId = model.peerId;

  const doneItems =
    model.completed.length > 0
      ? model.completed
      : (briefing?.changes.slice(0, 5).map((c) => ({ id: c.id, label: c.label })) ?? []);

  const primaryKpi = briefing?.kpis.find((k) => k.emphasis === "outcome") ?? briefing?.kpis[0];
  const leadsKpi = briefing?.kpis.find((k) => k.id.includes("lead") || k.label.toLowerCase().includes("lead"));

  const hasCampaignSections =
    campaignOverview &&
    (campaignOverview.needsApproval.length > 0 ||
      campaignOverview.live.length > 0 ||
      campaignOverview.scheduled.length > 0);

  return (
    <div data-testid="office-desk-view">
      {model.decisions.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label pg-v13-sec-label--attn">
            {model.copy.decisionsHeading(model.decisions.length)}
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

      {hasCampaignSections ? (
        <>
          {campaignOverview!.needsApproval.length > 0 ? (
            <section className="pg-v13-sec" data-testid="desk-needs-approval">
              <p className="pg-v13-sec-label pg-v13-sec-label--attn">
                {locale === "nl" ? "Wacht op goedkeuring" : "Needs approval"}
              </p>
              {campaignOverview!.needsApproval.map((row) => (
                <CampaignRow key={row.id} row={row} locale={locale} />
              ))}
            </section>
          ) : null}

          {campaignOverview!.live.length > 0 ? (
            <section className="pg-v13-sec" data-testid="desk-live-campaigns">
              <p className="pg-v13-sec-label">{locale === "nl" ? "Live campagnes" : "Live campaigns"}</p>
              {campaignOverview!.live.map((row) => (
                <CampaignRow key={row.id} row={row} locale={locale} />
              ))}
            </section>
          ) : null}

          {campaignOverview!.scheduled.length > 0 ? (
            <section className="pg-v13-sec" data-testid="desk-scheduled-campaigns">
              <p className="pg-v13-sec-label">
                {locale === "nl" ? "Ingeplande campagnes" : "Scheduled campaigns"}
              </p>
              {campaignOverview!.scheduled.map((row) => (
                <CampaignRow key={row.id} row={row} locale={locale} />
              ))}
            </section>
          ) : null}
        </>
      ) : null}

      {model.inFlight.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{model.copy.inFlightHeading}</p>
          {model.inFlight.map((item) => (
            <div key={item.id} className="pg-v13-next-row">
              <p className="font-semibold text-[var(--pg-v13-ink)]">{item.what}</p>
              {item.nextStep ? (
                <p className="text-[13px] text-[var(--pg-v13-ink-soft)]">{item.nextStep}</p>
              ) : null}
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

      {model.empty ? (
        <section className="pg-v13-sec pg-v13-panel p-5" data-testid="desk-empty-state">
          <p className="text-[15px] font-semibold text-[var(--pg-v13-ink)]">{model.empty.voice}</p>
          {model.empty.next ? (
            <p className="mt-2 text-[14px] text-[var(--pg-v13-ink-soft)]">{model.empty.next}</p>
          ) : null}
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
                  ? "LinkedIn engagement stijgt in jouw sector — Emma past contenttiming aan"
                  : "LinkedIn engagement is rising in your sector — Emma adjusts content timing",
            },
            {
              id: "desk-2",
              text:
                locale === "nl"
                  ? "Google Ads CPC stijgt licht — Emma houdt het in de gaten"
                  : "Google Ads CPC is edging up — Emma is watching it",
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
