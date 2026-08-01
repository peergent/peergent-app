"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb, TrendingUp } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import {
  PgAskInput,
  PgAttentionBand,
  PgAutonomyRequest,
  PgContentPreviewCard,
  PgDecisionCard,
  PgEntityCard,
  PgHeroSurface,
  PgKpiCard,
  PgSectionHeader,
  PgSignalPanel,
  PgTimeline,
  type PgState,
} from "@/components/design-system";
import { peerAccentVar } from "@/lib/design-system/foundation";
import { officeHref } from "@/lib/office/links";
import { DESK_COMPLETED_VISIBLE, type DeskViewModel } from "@/lib/office/desk/types";
import type { DeskBriefing } from "@/lib/office/desk/briefing-types";

export type DeskViewProps = {
  model: DeskViewModel;
  briefing?: DeskBriefing | null;
  onAsk?: (question: string) => void;
  onAskFocusChange?: (focused: boolean) => void;
  onAcceptAutonomy?: (boundaryId: string) => void;
  onDeclineAutonomy?: (boundaryId: string) => void;
};

function kpiToMetric(kpi: DeskBriefing["kpis"][number]) {
  return {
    id: kpi.id,
    label: kpi.label,
    value: kpi.value,
    delta: kpi.delta
      ? { ...kpi.delta, upIsGood: kpi.delta.upIsGood }
      : null,
    methodology: kpi.methodology,
    emphasis: kpi.emphasis === "outcome" ? ("outcome" as const) : ("activity" as const),
  };
}

export default function DeskView({
  model,
  briefing = null,
  onAsk,
  onAskFocusChange,
  onAcceptAutonomy,
  onDeclineAutonomy,
}: DeskViewProps) {
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const { copy } = model;
  const accent = peerAccentVar(model.peerRole);
  const peerId = model.peerId;

  const changes = briefing?.changes ?? [];
  const visibleChanges = showAllCompleted ? changes : changes.slice(0, DESK_COMPLETED_VISIBLE);

  const executive = briefing?.executive;
  const spotlight = briefing?.spotlight;

  return (
    <div
      className="mx-auto flex w-full max-w-[1180px] flex-col gap-[var(--pg-office-band-gap)]"
      data-testid="office-desk-view"
    >
      {model.decisions.length > 0 ? (
        <PgAttentionBand
          heading={copy.decisionsHeading(model.decisions.length)}
          testId="desk-attention"
          className="pg-band-enter"
        >
          {model.decisions.map((decision) => (
            <PgDecisionCard
              key={decision.id}
              title={decision.title}
              unblocks={decision.unblocks}
              primaryLabel={decision.primaryLabel}
              href={decision.href}
              ageLabel={decision.ageLabel}
              className="pg-item-enter"
              testId={`desk-decision-${decision.id}`}
            />
          ))}
        </PgAttentionBand>
      ) : null}

      {model.autonomyRequest ? (
        <PgAutonomyRequest
          peerRole={model.peerRole}
          evidence={model.autonomyRequest.evidence}
          proposal={model.autonomyRequest.proposal}
          scope={model.autonomyRequest.scope}
          impact={model.autonomyRequest.impact}
          reassurance={model.autonomyRequest.reassurance}
          onAccept={() => onAcceptAutonomy?.(model.autonomyRequest!.boundaryId)}
          onDecline={() => onDeclineAutonomy?.(model.autonomyRequest!.boundaryId)}
        />
      ) : null}

      {briefing ? (
        <PgHeroSurface
          accentVar={accent}
          eyebrow={briefing.focus.eyebrow}
          headline={briefing.focus.headline}
          detail={briefing.focus.detail}
          primaryMetric={
            executive?.primaryKpi
              ? {
                  ...kpiToMetric(executive.primaryKpi),
                  emphasis: "hero",
                }
              : null
          }
          secondaryMetrics={executive?.secondaryKpis.map(kpiToMetric) ?? []}
          periodLabel={executive?.periodLabel}
          voice={executive?.interpretation}
          voiceFact={executive?.interpretationFact}
          recommendation={executive?.recommendation}
          actions={
            briefing.focus.href && briefing.focus.ctaLabel ? (
              <Link
                href={briefing.focus.href}
                className={cn(
                  "pg-focus-premium inline-flex min-h-10 items-center gap-2",
                  "rounded-[var(--pg-radius-sm)] border border-[var(--pg-office-line-strong)]",
                  "bg-[var(--pg-office-inset)] px-5 text-[14px] font-medium",
                  "text-[var(--pg-color-text-primary)]",
                  "transition-transform duration-[var(--pg-duration-state)] hover:-translate-y-px"
                )}
              >
                {briefing.focus.ctaLabel}
                <ArrowRight size={14} aria-hidden />
              </Link>
            ) : null
          }
          testId="desk-executive-hero"
        />
      ) : null}

      {briefing && briefing.kpis.length > 0 ? (
        <section
          aria-label={briefing.copy.briefingHeading}
          data-testid="desk-kpis"
          className="pg-band-enter"
          style={{ animationDelay: "40ms" }}
        >
          <div className="grid gap-[var(--pg-space-4)] sm:grid-cols-2 lg:grid-cols-4">
            {briefing.kpis.map((kpi) => (
              <PgKpiCard
                key={kpi.id}
                {...kpiToMetric(kpi)}
                id={kpi.id}
                icon={
                  kpi.emphasis === "outcome" ? (
                    <TrendingUp size={16} aria-hidden style={{ color: "var(--pg-state-positive)" }} />
                  ) : undefined
                }
                href={officeHref(peerId, "performance")}
                testId={`desk-kpi-${kpi.id}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div
        className="grid gap-[var(--pg-office-block-gap)] lg:grid-cols-2 pg-band-enter"
        style={{ animationDelay: "80ms" }}
      >
        {spotlight?.activeWork ? (
          <section data-testid="desk-active-work">
            <PgSectionHeader title={copy.inFlightHeading} level="group" />
            <PgEntityCard
              className="mt-[var(--pg-space-4)]"
              title={spotlight.activeWork.title}
              subtitle={spotlight.activeWork.nextStep}
              status={{
                state: spotlight.activeWork.blockedBy ? "blocked_on_you" : "moving",
                label: spotlight.activeWork.stageLabel,
              }}
              attention={Boolean(spotlight.activeWork.blockedBy)}
              href={spotlight.activeWork.href}
              ctaLabel={copy.openCampaign}
              facts={
                spotlight.activeWork.blockedBy
                  ? [{ label: "Blocked", value: spotlight.activeWork.blockedBy }]
                  : []
              }
              testId="desk-spotlight-work"
            />
          </section>
        ) : null}

        {spotlight && spotlight.contentPreviews.length > 0 ? (
          <section data-testid="desk-content-spotlight">
            <PgSectionHeader
              title={briefing?.panels.find((p) => p.id === "content")?.eyebrow ?? "Content"}
              action={
                <Link
                  href={officeHref(peerId, "content")}
                  className="pg-focus-premium text-[13px] text-[var(--pg-color-accent)]"
                >
                  {briefing?.panels.find((p) => p.id === "content")?.openLabel}
                </Link>
              }
              level="group"
            />
            <div className="mt-[var(--pg-space-4)] grid gap-[var(--pg-space-3)]">
              {spotlight.contentPreviews.slice(0, 2).map((item, index) => (
                <PgContentPreviewCard
                  key={item.id}
                  title={item.title}
                  preview={item.preview}
                  channelId={item.channelId}
                  channelLabel={item.channelLabel}
                  status={{ state: item.state as PgState, label: item.statusLabel }}
                  meta={item.meta}
                  performance={item.performance}
                  href={item.href}
                  featured={index === 0}
                  testId={`desk-content-${item.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {spotlight?.marketHeadline ? (
        <section
          className="rounded-[var(--pg-radius-md)] border border-[var(--pg-office-line)] bg-[var(--pg-office-panel)] p-[var(--pg-space-5)] pg-band-enter"
          data-testid="desk-market-highlight"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-start gap-[var(--pg-space-3)]">
            <Lightbulb size={18} aria-hidden style={{ color: "var(--pg-state-attention)" }} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <PgSectionHeader title={briefing?.panels.find((p) => p.id === "market")?.eyebrow ?? "Markt"} level="group" />
              <p className="pg-voice mt-[var(--pg-space-2)]">{spotlight.marketHeadline}</p>
              {spotlight.marketRecommendation ? (
                <p className="pg-body pg-body--sm mt-[var(--pg-space-2)]">{spotlight.marketRecommendation}</p>
              ) : null}
              {spotlight.marketHref ? (
                <Link
                  href={spotlight.marketHref}
                  className="pg-focus-premium mt-[var(--pg-space-3)] inline-flex items-center gap-1.5 text-[13px] text-[var(--pg-color-accent)]"
                >
                  {briefing?.panels.find((p) => p.id === "market")?.openLabel}
                  <ArrowRight size={12} aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {briefing ? (
        <section
          className="flex flex-col gap-[var(--pg-space-5)] pg-band-enter"
          aria-label={briefing.copy.briefingHeading}
          data-testid="desk-briefing"
          style={{ animationDelay: "160ms" }}
        >
          <PgSectionHeader title={briefing.copy.briefingHeading} />

          <div className="grid gap-x-[var(--pg-space-8)] gap-y-[var(--pg-space-8)] sm:grid-cols-2 xl:grid-cols-3">
            {briefing.panels.map((panel) => (
              <PgSignalPanel
                key={panel.id}
                eyebrow={panel.eyebrow}
                headline={panel.headline}
                stats={panel.stats}
                future={panel.future}
                futureHeading={briefing.copy.futureHeading}
                href={panel.href}
                openLabel={panel.openLabel}
                accentVar={accent}
                testId={`desk-panel-${panel.id}`}
              />
            ))}

            {changes.length > 0 ? (
              <section aria-label={briefing.copy.changesHeading} data-testid="desk-changes">
                <span aria-hidden className="block h-px w-full bg-[var(--pg-office-line)]" />
                <PgSectionHeader
                  title={briefing.copy.changesHeading}
                  count={changes.length}
                  level="group"
                  className="pt-[var(--pg-space-4)]"
                />
                <PgTimeline
                  className="mt-[var(--pg-space-4)]"
                  items={visibleChanges.map((item) => ({
                    id: item.id,
                    label: item.label,
                    meta: [item.context, item.timeLabel].filter(Boolean).join(" · ") || null,
                    href: item.href,
                    icon: "check" as const,
                  }))}
                />
                {changes.length > DESK_COMPLETED_VISIBLE && !showAllCompleted ? (
                  <button
                    type="button"
                    onClick={() => setShowAllCompleted(true)}
                    className="pg-focus-premium mt-[var(--pg-space-3)] text-[12.5px] text-[var(--pg-color-accent)]"
                  >
                    {copy.viewAllCompleted}
                  </button>
                ) : null}
              </section>
            ) : null}
          </div>
        </section>
      ) : null}

      {briefing?.nextStep ? (
        <section
          className="rounded-[var(--pg-radius-md)] border border-[var(--pg-office-line-strong)] bg-[var(--pg-office-inset)] p-[var(--pg-space-5)] pg-band-enter"
          data-testid="desk-next-step"
        >
          <p className="pg-micro font-medium tracking-[0.09em] uppercase" style={{ color: accent }}>
            {briefing.copy.nextStepHeading}
          </p>
          <p className="pg-title mt-[var(--pg-space-2)]">{briefing.nextStep.label}</p>
          <p className="pg-body pg-body--sm mt-[var(--pg-space-2)]">{briefing.nextStep.why}</p>
          <Link
            href={briefing.nextStep.href}
            className="pg-focus-premium mt-[var(--pg-space-4)] inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--pg-color-accent)]"
          >
            {briefing.nextStep.ctaLabel}
            <ArrowRight size={12} aria-hidden />
          </Link>
        </section>
      ) : null}

      {onAsk ? (
        <div className="max-w-[560px] pg-band-enter" style={{ animationDelay: "200ms" }}>
          <PgAskInput
            peerName={copy.askPlaceholderName}
            placeholder={copy.askPlaceholder}
            onSubmit={onAsk}
            onFocusChange={onAskFocusChange}
          />
        </div>
      ) : null}
    </div>
  );
}
