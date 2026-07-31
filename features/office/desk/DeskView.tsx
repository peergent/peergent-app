"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import {
  PgAskInput,
  PgAutonomyRequest,
  PgCard,
  PgDecisionCard,
  PgSignalPanel,
} from "@/components/design-system";
import { peerAccentVar } from "@/lib/design-system/foundation";
import { DESK_COMPLETED_VISIBLE, type DeskViewModel } from "@/lib/office/desk/types";
import type {
  DeskBriefing,
  DeskFocusAnchor,
} from "@/lib/office/desk/briefing-types";

/**
 * The Desk — the daily ritual, and the Peer's report on her whole job.
 *
 * §4.1 The Desk is not a homepage. Opening it should answer, without a second
 * click: what she is doing, what she is waiting for, what changed, how the work
 * is performing, and what she would do next. Every other destination therefore
 * contributes a short account of itself, built from that destination's own view
 * model so a summary can never drift from the page it summarises.
 *
 * The composition runs top to bottom as a briefing: what blocks you, what she
 * is doing and what she'd do next, then how each part of her job stands, then
 * your reply. Nothing is fabricated — a part of her job with nothing to report
 * says what it will report and what unlocks it.
 */

export type DeskViewProps = {
  model: DeskViewModel;
  /** Absent while loading; the page renders without the briefing band. */
  briefing?: DeskBriefing | null;
  onAsk?: (question: string) => void;
  onAskFocusChange?: (focused: boolean) => void;
  onAcceptAutonomy?: (boundaryId: string) => void;
  onDeclineAutonomy?: (boundaryId: string) => void;
};

/**
 * The Focus Anchor — what the work is right now.
 *
 * Distinct from the presence line in the rail (her state) and from the decision
 * cards above (what needs the customer). All three can be true at once, and on
 * a busy day all three are: she needs a review, she is preparing the next
 * campaign, and two items are blocked. Giving each its own place is what stops
 * the hero going empty whenever presence resolves to "needs you".
 */
function FocusPanel({
  focus,
  accent,
}: {
  focus: DeskFocusAnchor;
  accent: string;
}) {
  return (
    <section
      className={cn(
        // The rule is the only chrome the anchor gets: it marks where her
        // voice begins and fades out rather than closing a box.
        "relative pl-[var(--pg-space-5)]"
      )}
      style={{
        backgroundImage: `radial-gradient(46% 120% at 0% 40%, ${accent}0f, transparent 70%)`,
      }}
      aria-label={focus.eyebrow}
      data-testid="desk-focus"
      data-focus-source={focus.source}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-0 w-[2px] rounded-full"
        style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}
      />

      <p
        className="text-[10.5px] font-medium tracking-[0.09em] uppercase"
        style={{ color: accent }}
      >
        {focus.eyebrow}
      </p>

      <h1 className="mt-[var(--pg-space-3)] max-w-[20ch] text-[26px] leading-[1.16] font-semibold tracking-[-0.02em] text-[var(--pg-color-text-primary)] sm:text-[30px] lg:text-[34px] lg:leading-[1.14] lg:tracking-[-0.025em]">
        {focus.headline}
      </h1>

      {focus.detail ? (
        <p className="mt-[var(--pg-space-4)] max-w-[46ch] text-[15px] leading-relaxed text-[var(--pg-color-text-secondary)]">
          {focus.detail}
        </p>
      ) : null}

      {focus.href || focus.meta ? (
        <div className="mt-[var(--pg-space-5)] flex flex-wrap items-center gap-[var(--pg-space-4)]">
          {focus.href && focus.ctaLabel ? (
            <Link
              href={focus.href}
              className={cn(
                "pg-focus-premium inline-flex min-h-9 items-center gap-2",
                "rounded-[var(--pg-radius-sm)] border border-[var(--pg-office-line-strong)]",
                "bg-[var(--pg-office-inset)] px-4 text-[13.5px]",
                "text-[var(--pg-color-text-primary)]",
                "transition-colors duration-[var(--pg-duration-state)]",
                "hover:bg-[var(--pg-office-panel-hover)]"
              )}
            >
              {focus.ctaLabel}
              <ArrowRight size={13} aria-hidden />
            </Link>
          ) : null}
          {focus.meta ? (
            <span className="text-[12.5px] text-[var(--pg-color-text-tertiary)]">
              {focus.meta}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * §4.1 One recommendation, and the fact it rests on.
 *
 * Deliberately narrow and set beside the anchor rather than beneath it: "what
 * she is doing" and "what I should do" are the two halves of the same glance.
 */
function NextStep({
  briefing,
  accent,
  beside,
}: {
  briefing: DeskBriefing;
  accent: string;
  /** True when it sits next to the focus anchor rather than standing alone. */
  beside: boolean;
}) {
  const step = briefing.nextStep;
  if (!step) return null;

  return (
    <section
      className={cn(
        "flex flex-col gap-[var(--pg-space-3)]",
        // Beside the anchor it is the narrow second column. On its own — when
        // she has nothing in flight — it takes the reading measure instead of
        // hugging the right edge across an empty row.
        beside
          ? "xl:w-[272px] xl:shrink-0 xl:border-l xl:border-[var(--pg-office-line)] xl:pl-[var(--pg-space-6)]"
          : "max-w-[560px]"
      )}
      aria-label={briefing.copy.nextStepHeading}
      data-testid="desk-next-step"
    >
      <span
        className="text-[10.5px] font-medium tracking-[0.09em] uppercase"
        style={{ color: accent }}
      >
        {briefing.copy.nextStepHeading}
      </span>

      <p className="text-[15px] leading-snug font-medium text-[var(--pg-color-text-primary)]">
        {step.label}
      </p>

      {step.why ? (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-[0.09em] text-[var(--pg-color-text-tertiary)] uppercase">
            {briefing.copy.whyLabel}
          </span>
          <p className="text-[13px] leading-relaxed text-[var(--pg-color-text-secondary)]">
            {step.why}
          </p>
        </div>
      ) : null}

      <Link
        href={step.href}
        className={cn(
          "pg-focus-premium mt-0.5 inline-flex min-h-8 items-center gap-1.5 self-start",
          "text-[13px] text-[var(--pg-color-accent)]"
        )}
      >
        {step.ctaLabel}
        <ArrowRight size={12} aria-hidden />
      </Link>
    </section>
  );
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

  const changes = briefing?.changes ?? [];
  const visibleChanges = showAllCompleted
    ? changes
    : changes.slice(0, DESK_COMPLETED_VISIBLE);

  const extraInFlight = model.inFlight.slice(1);

  return (
    <div
      className="mx-auto flex w-full max-w-[1180px] flex-col gap-[var(--pg-space-10)]"
      data-testid="office-desk-view"
    >
      {/* Decisions come before everything — they are the only thing that can
          genuinely block the customer's day. */}
      {model.decisions.length > 0 ? (
        <section
          className="flex flex-col gap-[var(--pg-space-3)]"
          aria-label={copy.decisionsHeading(model.decisions.length)}
        >
          <h2 className="text-[10.5px] font-medium tracking-[0.09em] text-[var(--pg-color-decision)] uppercase">
            {copy.decisionsHeading(model.decisions.length)}
          </h2>
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
        </section>
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

      {/* What the work is, beside what she would have you do. */}
      {briefing ? (
        <div className="flex flex-col gap-[var(--pg-space-8)] xl:flex-row xl:items-start xl:gap-[var(--pg-space-10)]">
          <div className="min-w-0 flex-1">
            <FocusPanel focus={briefing.focus} accent={accent} />
          </div>
          <NextStep briefing={briefing} accent={accent} beside />
        </div>
      ) : null}

      {/* Anything else in flight, listed plainly beneath the anchor. */}
      {extraInFlight.length > 0 ? (
        <div className="flex flex-col gap-[var(--pg-space-2)]">
          {extraInFlight.map((item) => (
            <PgCard
              key={item.id}
              interactive={Boolean(item.href)}
              data-testid={`desk-inflight-${item.id}`}
            >
              <p className="text-[14px] text-[var(--pg-color-text-primary)]">
                {item.what}
              </p>
              {item.nextStep ? (
                <p className="mt-1 text-[13px] text-[var(--pg-color-text-secondary)]">
                  {item.nextStep}
                </p>
              ) : null}
            </PgCard>
          ))}
        </div>
      ) : null}

      {/* §4.1 Her account of every part of her job, on one screen. Each panel
          is built from that destination's own view model, and the last cell is
          what actually changed — activity is a part of the report, not a
          footnote to it. */}
      {briefing ? (
        <section
          className="flex flex-col gap-[var(--pg-space-5)]"
          aria-label={briefing.copy.briefingHeading}
          data-testid="desk-briefing"
        >
          <h2 className="text-[10.5px] font-medium tracking-[0.09em] text-[var(--pg-color-text-tertiary)] uppercase">
            {briefing.copy.briefingHeading}
          </h2>

          <div
            className={cn(
              "grid gap-x-[var(--pg-space-8)] gap-y-[var(--pg-space-8)]",
              "sm:grid-cols-2 xl:grid-cols-3"
            )}
          >
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

            {/* The sixth cell: what landed, in the same visual language as the
                five destinations so the grid reads as one report. */}
            {changes.length > 0 ? (
              <section
                className="flex min-w-0 flex-col"
                aria-label={briefing.copy.changesHeading}
                data-testid="desk-changes"
              >
                <span
                  aria-hidden
                  className="h-px w-full"
                  style={{ background: "var(--pg-office-line)" }}
                />
                <div className="flex items-baseline gap-2 pt-[var(--pg-space-4)]">
                  <span className="text-[10.5px] font-medium tracking-[0.09em] text-[var(--pg-color-text-tertiary)] uppercase">
                    {briefing.copy.changesHeading}
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--pg-color-text-tertiary)]">
                    {changes.length}
                  </span>
                </div>

                {/* A timeline, not a table: one hairline runs the length of the
                    column and each item hangs off it. */}
                <ul
                  className={cn(
                    "relative m-0 mt-[var(--pg-space-4)] flex list-none flex-col p-0",
                    "gap-[var(--pg-space-4)]",
                    "before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px]",
                    "before:w-px before:bg-[var(--pg-office-line)] before:content-['']"
                  )}
                >
                  {visibleChanges.map((item) => (
                    <li
                      key={item.id}
                      className="relative flex flex-col pl-[var(--pg-space-5)]"
                    >
                      <Check
                        size={11}
                        aria-hidden
                        className={cn(
                          "absolute top-[3px] left-0 shrink-0 rounded-full",
                          "bg-[var(--pg-office-canvas)] text-[var(--pg-color-success)]"
                        )}
                      />
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="pg-focus-premium text-[13px] leading-snug text-[var(--pg-color-text-secondary)]"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="text-[13px] leading-snug text-[var(--pg-color-text-secondary)]">
                          {item.label}
                        </span>
                      )}
                      {item.context || item.timeLabel ? (
                        <span className="mt-1 text-[11px] text-[var(--pg-color-text-tertiary)]">
                          {[item.context, item.timeLabel]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {changes.length > DESK_COMPLETED_VISIBLE && !showAllCompleted ? (
                  <button
                    type="button"
                    onClick={() => setShowAllCompleted(true)}
                    className="pg-focus-premium mt-[var(--pg-space-3)] self-start text-[12.5px] text-[var(--pg-color-accent)]"
                  >
                    {copy.viewAllCompleted}
                  </button>
                ) : null}
              </section>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Read the report, then reply. */}
      {onAsk ? (
        <div className="max-w-[560px]">
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
