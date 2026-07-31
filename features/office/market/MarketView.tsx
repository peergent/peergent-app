"use client";

import {
  PgCard,
  PgEmptyState,
  PgInsightCard,
  PgMethodology,
  PgPage,
  PgPageHeader,
  PgSection,
  PgStateBadge,
} from "@/components/design-system";
import type { MarketObservation, MarketViewModel } from "@/lib/office/market/types";

/**
 * §4.7 Market — the only destination about the world rather than about you.
 *
 * Observed facts, inferences, and her reading are visually separated and
 * separately headed, so an inference can never be mistaken for a fact. Nothing
 * on this page reports on the customer's own results: market awareness and
 * performance analytics stay apart.
 */

export type MarketViewProps = {
  model: MarketViewModel;
};

function ObservationList({
  observations,
  copy,
  tone,
}: {
  observations: MarketObservation[];
  copy: MarketViewModel["copy"];
  tone: "observed" | "inferred";
}) {
  return (
    <ul className="m-0 flex list-none flex-col gap-[var(--pg-space-2)] p-0">
      {observations.map((observation) => (
        <li
          key={observation.id}
          className="flex flex-col gap-1"
          data-testid={`market-${tone}-${observation.id}`}
        >
          <p className="pg-body pg-body--sm pg-measure text-[var(--pg-color-text-primary)]">
            {observation.statement}
          </p>
          {/* Evidence level carries a distinct glyph, so fact and inference are
              never told apart by colour alone. */}
          <span className="flex flex-wrap items-center gap-[var(--pg-space-2)]">
            <PgStateBadge
              state={tone === "inferred" ? "inferred" : "observed"}
              label={
                tone === "inferred" ? copy.evidenceLikely : copy.evidenceObserved
              }
            />
            <span className="text-[11.5px] text-[var(--pg-color-text-tertiary)]">
              {copy.sourceLabel(observation.sourceLabel)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function MarketView({ model }: MarketViewProps) {
  const { copy } = model;

  return (
    <PgPage testId="office-market-view">
      <PgPageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        meta={
          model.freshness.label ? (
            <span className="text-[11.5px] text-[var(--pg-color-text-tertiary)]">
              {model.freshness.label}
            </span>
          ) : null
        }
      />

      {/* A known gap in the underlying knowledge is stated before anything is
          read from it. */}
      {model.freshness.knownGap ? (
        <PgMethodology testId="market-known-gap">
          {model.freshness.knownGap}
        </PgMethodology>
      ) : null}

      {/* Stale knowledge is flagged before anything is read from it. */}
      {model.freshness.staleNotice ? (
        <PgCard
          decision
          data-testid="market-stale"
          className="border-l-[var(--pg-color-decision)]"
        >
          <p className="pg-body pg-body--sm pg-measure">
            {model.freshness.staleNotice}
          </p>
        </PgCard>
      ) : null}

      {model.noCompetitors ? (
        <PgEmptyState
          voice={model.noCompetitors.voice}
          next={model.noCompetitors.next}
          future={{
            heading: model.copy.futureHeading,
            promise: model.copy.futurePromise,
          }}
          action={{
            label: model.noCompetitors.ctaLabel,
            href: model.noCompetitors.ctaHref,
          }}
          testId="market-empty"
        />
      ) : null}

      {model.partialData ? (
        <p className="pg-voice pg-measure" data-testid="market-partial">
          {model.partialData}
        </p>
      ) : null}

      {/* Her reading, clearly headed as a reading. */}
      {model.interpretation ? (
        <PgSection title={copy.interpretationHeading}>
          <PgInsightCard
            recommendationLabel={model.copy.recommendationHeading}
            observation={model.interpretation.text}
            recommendation={model.interpretation.recommendation}
            testId="market-interpretation"
          />
        </PgSection>
      ) : null}

      {/* Facts and inferences, separately headed. */}
      {model.observedFacts.length > 0 ? (
        <PgSection title={copy.observedHeading}>
          <PgCard>
            <ObservationList
              observations={model.observedFacts}
              copy={copy}
              tone="observed"
            />
          </PgCard>
        </PgSection>
      ) : null}

      {model.inferences.length > 0 ? (
        <PgSection title={copy.inferredHeading}>
          <PgCard>
            <ObservationList
              observations={model.inferences}
              copy={copy}
              tone="inferred"
            />
          </PgCard>
        </PgSection>
      ) : null}

      {/* §4.7 Stated positioning side by side — never a scored position map. */}
      {model.position ? (
        <PgSection title={copy.positionHeading}>
          <div className="flex flex-col gap-[var(--pg-space-2)]">
            <PgCard data-testid="market-position-you">
              <p className="pg-label text-[var(--pg-color-accent)]">
                {copy.youLabel}
              </p>
              <p className="pg-voice mt-[var(--pg-space-2)] pg-measure">
                {model.position.ownStatement}
              </p>
              {model.position.ownDifferentiators.length > 0 ? (
                <p className="pg-body pg-body--sm mt-[var(--pg-space-2)]">
                  {model.position.ownDifferentiators.join(" · ")}
                </p>
              ) : null}
            </PgCard>

            {model.position.competitors.map((competitor) => (
              <PgCard
                key={competitor.id}
                data-testid={`market-position-${competitor.id}`}
              >
                <p className="pg-label">{competitor.name}</p>
                <p className="pg-body pg-body--sm mt-[var(--pg-space-2)]">
                  {competitor.leadsWith.join(" · ")}
                </p>
              </PgCard>
            ))}
          </div>
          <PgMethodology>{model.position.caveat}</PgMethodology>
        </PgSection>
      ) : model.positionUnavailable ? (
        <PgSection title={copy.positionHeading}>
          <p
            className="pg-body pg-body--sm pg-measure"
            data-testid="market-position-unavailable"
          >
            {model.positionUnavailable.reason}
          </p>
        </PgSection>
      ) : null}

      {/* The roster itself. */}
      {model.competitors.length > 0 ? (
        <PgSection title={copy.competitorsHeading}>
          <div className="grid gap-[var(--pg-space-3)] lg:grid-cols-2">
            {model.competitors.map((competitor) => (
              <PgCard
                key={competitor.id}
                data-testid={`market-competitor-${competitor.id}`}
              >
                <p className="pg-voice">{competitor.name}</p>

                {competitor.isThin ? (
                  <p className="pg-body pg-body--sm mt-[var(--pg-space-2)] text-[var(--pg-color-text-tertiary)]">
                    {copy.thinRecord}
                  </p>
                ) : (
                  <dl className="m-0 mt-[var(--pg-space-3)] flex flex-col gap-[var(--pg-space-2)]">
                    {(
                      [
                        [copy.differentiatorsLabel, competitor.differentiators],
                        [copy.strengthsLabel, competitor.strengths],
                        [copy.weaknessesLabel, competitor.weaknesses],
                      ] as const
                    )
                      .filter(([, values]) => values.length > 0)
                      .map(([label, values]) => (
                        <div key={label} className="flex flex-col gap-0.5">
                          <dt className="pg-label">{label}</dt>
                          <dd className="pg-body pg-body--sm m-0">
                            {values.join(" · ")}
                          </dd>
                        </div>
                      ))}
                  </dl>
                )}
              </PgCard>
            ))}
          </div>
        </PgSection>
      ) : null}
    </PgPage>
  );
}
