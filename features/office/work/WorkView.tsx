"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { peerAccentVar } from "@/lib/design-system/foundation";
import {
  PgEntityCard,
  PgMeta,
  PgPage,
  PgPageHeader,
  PgSection,
  PgStateBadge,
  type PgState,
} from "@/components/design-system";
import type { WorkGroup, WorkGroupId, WorkItem, WorkViewModel } from "@/lib/office/work/types";

/**
 * §4.2 Work — the weekly review. Reassurance that nothing has quietly stalled.
 *
 * Grouped by state, never by date or type. Every card answers three things
 * without a click: what stage, what's next, and who is holding it up.
 */

export type WorkViewProps = {
  model: WorkViewModel;
  onCreate?: () => void;
  onAcceptProposal?: () => void;
  onBriefInstead?: () => void;
};

/** Group id maps directly onto the shared badge vocabulary. */
const GROUP_STATE: Record<WorkGroupId, PgState> = {
  blocked_on_you: "blocked_on_you",
  blocked_elsewhere: "blocked_elsewhere",
  moving: "moving",
  queued: "queued",
  finished: "completed",
};

function WorkCard({
  item,
  group,
  copy,
}: {
  item: WorkItem;
  group: WorkGroup;
  copy: WorkViewModel["copy"];
}) {
  const blockedOnCustomer = group.id === "blocked_on_you";

  return (
    <PgEntityCard
      title={item.name}
      subtitle={item.nextStep || null}
      status={{ state: GROUP_STATE[group.id], label: item.stageLabel }}
      attention={blockedOnCustomer}
      href={item.href}
      meta={
        <PgMeta
          items={[
            item.expectedLabel,
            ...item.channels.map((channel) =>
              channel.connected ? channel.label : `${channel.label} ⚠`
            ),
          ]}
        />
      }
      facts={
        item.blockedBy
          ? [{ label: copy.blockedLabel, value: item.blockedBy }]
          : []
      }
      testId={`work-item-${item.id}`}
    />
  );
}

function WorkGroupSection({
  group,
  copy,
}: {
  group: WorkGroup;
  copy: WorkViewModel["copy"];
}) {
  const [expanded, setExpanded] = useState(!group.collapsedByDefault);

  return (
    <PgSection
      title={group.title}
      count={group.items.length}
      attention={group.id === "blocked_on_you"}
      action={
        group.collapsedByDefault ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="pg-focus-premium text-[13px] text-[var(--pg-color-accent)]"
          >
            {expanded ? copy.hideFinished : copy.showFinished}
          </button>
        ) : null
      }
    >
      {expanded
        ? group.items.map((item) => (
            <WorkCard key={item.id} item={item} group={group} copy={copy} />
          ))
        : null}
    </PgSection>
  );
}

export default function WorkView({
  model,
  onCreate,
  onAcceptProposal,
  onBriefInstead,
}: WorkViewProps) {
  const { copy } = model;
  const accent = peerAccentVar(model.peerRole);

  const guidedStart = model.groups.length === 0 && model.proposal !== null;

  return (
    <PgPage testId="office-work-view">
      {guidedStart ? null : (
      <PgPageHeader
        title={copy.title}
        action={
          onCreate ? (
            <button
              type="button"
              onClick={onCreate}
              className={cn(
                "pg-focus-premium inline-flex min-h-9 items-center rounded-[var(--pg-radius-sm)]",
                "border border-[var(--pg-color-border)] px-4 text-sm",
                "text-[var(--pg-color-text-secondary)] transition",
                "hover:border-[var(--pg-color-border-strong,var(--pg-color-border))]",
                "hover:text-[var(--pg-color-text-primary)]"
              )}
            >
              {copy.createLabel}
            </button>
          ) : null
        }
      />
      )}

      {/* §4.2 A guided start, not an empty page: what she'd do, what it rests
          on, and how the work would actually run. */}
      {model.proposal ? (
        <div
          className="flex flex-col gap-[var(--pg-space-5)]"
          data-testid="work-proposal"
        >
          <section
            className="relative max-w-[680px] pl-[var(--pg-space-5)]"
            style={{
              backgroundImage: `radial-gradient(46% 120% at 0% 40%, ${accent}0f, transparent 70%)`,
            }}
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
              {copy.whereIdStart}
            </p>

            <h2 className="mt-[var(--pg-space-3)] max-w-[20ch] text-[26px] leading-[1.16] font-semibold tracking-[-0.02em] sm:text-[30px] lg:text-[34px] lg:leading-[1.14] lg:tracking-[-0.025em] text-[var(--pg-color-text-primary)]">
              {model.proposal.voice}
            </h2>

            {model.proposal.next ? (
              <p className="mt-[var(--pg-space-4)] max-w-[46ch] text-[15px] leading-relaxed text-[var(--pg-color-text-secondary)]">
                {model.proposal.next}
              </p>
            ) : null}

            {/* The recommendation names its own basis, so it can be judged
                rather than taken on trust. */}
            {model.proposal.basedOn ? (
              <p className="mt-[var(--pg-space-4)] text-[12.5px] text-[var(--pg-color-text-tertiary)]">
                {copy.basedOnPrefix} {model.proposal.basedOn}
                {model.proposal.channel
                  ? ` · ${copy.startingOnPrefix} ${model.proposal.channel}`
                  : ""}
              </p>
            ) : null}

            {model.proposal.terms ? (
              <dl
                className={cn(
                  "mt-[var(--pg-space-6)] m-0 grid gap-x-[var(--pg-space-6)]",
                  "gap-y-[var(--pg-space-4)] sm:grid-cols-2"
                )}
                data-testid="work-proposal-terms"
              >
                {model.proposal.terms.items.map((term) => (
                  <div key={term.id} className="flex min-w-0 flex-col gap-1">
                    <dt className="text-[10.5px] font-medium tracking-[0.09em] text-[var(--pg-color-text-tertiary)] uppercase">
                      {term.label}
                    </dt>
                    <dd className="m-0 text-[13.5px] leading-snug text-[var(--pg-color-text-secondary)]">
                      {term.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-[var(--pg-space-6)] flex flex-wrap items-center gap-[var(--pg-space-2)]">
              {onAcceptProposal ? (
                <button
                  type="button"
                  onClick={onAcceptProposal}
                  className={cn(
                    "pg-focus-premium inline-flex min-h-10 items-center gap-2",
                    "rounded-[var(--pg-radius-sm)] px-5 text-[14px] font-medium",
                    "text-[var(--pg-color-text-inverse)]",
                    "transition-transform duration-[var(--pg-duration-state)]",
                    "hover:-translate-y-px active:translate-y-0"
                  )}
                  style={{
                    background: `linear-gradient(145deg, ${accent}, color-mix(in srgb, ${accent} 76%, #000))`,
                    boxShadow: "var(--pg-office-lift)",
                  }}
                >
                  {model.proposal.acceptLabel}
                  <ArrowRight size={14} aria-hidden />
                </button>
              ) : null}
              {onBriefInstead ? (
                <button
                  type="button"
                  onClick={onBriefInstead}
                  className={cn(
                    "pg-focus-premium inline-flex min-h-10 items-center",
                    "rounded-[var(--pg-radius-sm)] px-4 text-[13.5px]",
                    "text-[var(--pg-color-text-tertiary)]",
                    "transition-colors duration-[var(--pg-duration-state)]",
                    "hover:text-[var(--pg-color-text-primary)]"
                  )}
                >
                  {model.proposal.briefLabel}
                </button>
              ) : null}
            </div>
          </section>

          {/* What happens after saying yes — the real lifecycle, so starting
              is not a leap of faith. */}
          <section className="mt-[var(--pg-space-6)]" aria-label={model.proposal.stagesHeading}>
            <h3 className="text-[10.5px] font-medium tracking-[0.09em] text-[var(--pg-color-text-tertiary)] uppercase">
              {model.proposal.stagesHeading}
            </h3>
            {/* A track, not five cards: one line runs through the work and
                each stage is a marker on it. The step that needs the customer
                is the only one that carries colour. */}
            <ol
              className={cn(
                "relative m-0 mt-[var(--pg-space-5)] grid list-none p-0",
                "gap-y-[var(--pg-space-5)] sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-[var(--pg-space-5)]"
              )}
            >
              {model.proposal.stages.map((stage, index) => (
                <li
                  key={stage.id}
                  className={cn(
                    "relative pt-[var(--pg-space-5)]",
                    // Each stage draws the line to the next one, so the track
                    // begins and ends exactly on a marker.
                    "lg:after:absolute lg:after:top-[5px] lg:after:left-[15px]",
                    "lg:after:right-[calc(-1*var(--pg-space-5)-4px)] lg:after:h-px",
                    index < model.proposal!.stages.length - 1 &&
                      "lg:after:bg-[var(--pg-office-line)] lg:after:content-['']"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-0 left-0 h-[11px] w-[11px] rounded-full",
                      "ring-4 ring-[var(--pg-office-canvas)]"
                    )}
                    style={{
                      background: stage.needsYou
                        ? "var(--pg-color-decision)"
                        : "var(--pg-office-line-strong)",
                    }}
                  />
                  <p className="flex items-baseline gap-1.5 text-[11px] tabular-nums">
                    <span className="text-[var(--pg-color-text-tertiary)]">
                      {index + 1}
                    </span>
                    <span
                      className="text-[12.5px] font-medium"
                      style={{
                        color: stage.needsYou
                          ? "var(--pg-color-decision)"
                          : "var(--pg-color-text-secondary)",
                      }}
                    >
                      {stage.label}
                    </span>
                  </p>
                  <p className="mt-1.5 max-w-[26ch] text-[12.5px] leading-snug text-[var(--pg-color-text-tertiary)]">
                    {stage.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}

      {model.groups.map((group) => (
        <WorkGroupSection key={group.id} group={group} copy={copy} />
      ))}
    </PgPage>
  );
}
