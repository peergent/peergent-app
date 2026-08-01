"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import {
  PgAccordion,
  PgAccordionSection,
  PgCard,
  PgEmptyState,
  PgErrorState,
  PgMethodology,
  PgPage,
  PgPageHeader,
  PgSection,
  PgStateBadge,
  type PgState,
} from "@/components/design-system";
import type {
  AgreementBoundary,
  AgreementKnowledge,
  AgreementSaveState,
  AgreementViewModel,
  BoundaryKind,
} from "@/lib/office/agreement/types";

/**
 * §4.8 Working agreement — review, narrow and reverse.
 *
 * No autonomy request appears here; that lives on the Desk (§4.1a). Every
 * change states its consequence and is confirmed before it saves, and every
 * boundary carries how to undo it.
 */

export type AgreementViewProps = {
  model: AgreementViewModel;
  saveState?: AgreementSaveState;
  onChangeBoundary?: (boundaryId: string, next: BoundaryKind) => void;
  onConfirm?: (boundaryId: string) => void;
  onCancel?: () => void;
  onCorrect?: (knowledgeId: string) => void;
  visibleSection?:
    | "brand"
    | "connections"
    | "responsibilities"
    | "autonomy"
    | "agreement"
    | "knowledge"
    | null;
  hideHeader?: boolean;
};

const PROVENANCE_STYLE: Record<AgreementKnowledge["provenance"], string> = {
  system_fact: "text-[var(--pg-color-text-tertiary)]",
  customer_rule: "text-[var(--pg-color-accent)]",
  emma_understanding: "text-[var(--pg-color-decision)]",
};

function BoundaryCard({
  boundary,
  copy,
  saveState,
  onChangeBoundary,
  onConfirm,
  onCancel,
}: {
  boundary: AgreementBoundary;
  copy: AgreementViewModel["copy"];
  saveState: AgreementSaveState;
  onChangeBoundary?: (id: string, next: BoundaryKind) => void;
  onConfirm?: (id: string) => void;
  onCancel?: () => void;
}) {
  const isTarget =
    "boundaryId" in saveState && saveState.boundaryId === boundary.id;

  const button = cn(
    "pg-focus-premium inline-flex min-h-9 items-center rounded-[var(--pg-radius-sm)]",
    "px-4 text-sm font-medium transition"
  );

  return (
    <PgCard data-testid={`agreement-boundary-${boundary.id}`}>
      <div className="flex flex-wrap items-baseline gap-x-[var(--pg-space-3)] gap-y-1">
        <p className="pg-voice min-w-0 flex-1">{boundary.title}</p>
        <PgStateBadge
          state={boundary.kind as PgState}
          label={
            boundary.kind === "autonomous"
              ? copy.autonomousHeading
              : boundary.kind === "needs_approval"
                ? copy.needsApprovalHeading
                : copy.neverHeading
          }
          className="shrink-0"
        />
      </div>
      {boundary.description ? (
        <p className="pg-body pg-body--sm mt-[var(--pg-space-1)]">
          {boundary.description}
        </p>
      ) : null}

      {/* The consequence is always visible, not only at the moment of change. */}
      <div className="mt-[var(--pg-space-3)] border-l-2 border-[var(--pg-color-border)] pl-[var(--pg-space-3)]">
        <p className="text-[11.5px] text-[var(--pg-color-text-tertiary)]">
          {copy.consequenceLabel}
        </p>
        <p className="pg-body pg-body--sm pg-measure mt-0.5">{boundary.consequence}</p>
      </div>

      {boundary.guardrails.length > 0 ? (
        <dl className="m-0 mt-[var(--pg-space-3)] flex flex-col gap-1">
          {boundary.guardrails.map((guardrail) => (
            <div key={guardrail.id} className="flex flex-wrap gap-[var(--pg-space-2)]">
              <dt className="pg-label">{guardrail.label}</dt>
              <dd className="pg-body pg-body--sm m-0">{guardrail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {boundary.lastChangedLabel ? (
        <p className="pg-label mt-[var(--pg-space-3)]">{boundary.lastChangedLabel}</p>
      ) : null}

      {/* Confirm-before-save: the consequence is restated at the moment of
          commitment, so nothing changes silently. */}
      {isTarget && saveState.status === "confirming" ? (
        <div
          className="mt-[var(--pg-space-3)] flex flex-col gap-[var(--pg-space-2)]"
          data-testid={`agreement-confirm-${boundary.id}`}
        >
          <p className="pg-voice pg-measure">{saveState.consequence}</p>
          <PgMethodology>
            {copy.reversalLabel}: {boundary.reversal}
          </PgMethodology>
          <div className="flex flex-wrap gap-[var(--pg-space-2)]">
            <button
              type="button"
              onClick={() => onConfirm?.(boundary.id)}
              className={cn(
                button,
                "bg-[var(--pg-color-accent)] text-[var(--pg-color-text-inverse)]"
              )}
            >
              {copy.confirmLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                button,
                "border border-[var(--pg-color-border)] text-[var(--pg-color-text-secondary)]"
              )}
            >
              {copy.cancelLabel}
            </button>
          </div>
        </div>
      ) : isTarget && saveState.status === "failed" ? (
        <PgErrorState
          className="mt-[var(--pg-space-3)]"
          voice={saveState.voice}
          preserved={saveState.preserved}
          testId={`agreement-failed-${boundary.id}`}
        />
      ) : (
        <div className="mt-[var(--pg-space-3)] flex flex-wrap items-center gap-[var(--pg-space-2)]">
          {boundary.kind !== "autonomous" ? (
            <button
              type="button"
              onClick={() => onChangeBoundary?.(boundary.id, "autonomous")}
              className={cn(
                button,
                "border border-[var(--pg-color-border)] text-[var(--pg-color-text-secondary)]",
                "hover:text-[var(--pg-color-text-primary)]"
              )}
              data-testid={`agreement-widen-${boundary.id}`}
            >
              {copy.widenLabel}
            </button>
          ) : null}
          {boundary.kind !== "needs_approval" ? (
            <button
              type="button"
              onClick={() => onChangeBoundary?.(boundary.id, "needs_approval")}
              className={cn(
                button,
                "border border-[var(--pg-color-border)] text-[var(--pg-color-text-secondary)]",
                "hover:text-[var(--pg-color-text-primary)]"
              )}
              data-testid={`agreement-narrow-${boundary.id}`}
            >
              {copy.narrowLabel}
            </button>
          ) : null}

          {isTarget && saveState.status === "saving" ? (
            <span className="pg-label">{copy.savingLabel}</span>
          ) : null}
          {isTarget && saveState.status === "saved" ? (
            <span className="pg-label text-[var(--pg-color-success)]">
              {copy.savedLabel}
            </span>
          ) : null}
          {isTarget && saveState.status === "invalid" ? (
            <span className="pg-label text-[var(--pg-color-decision)]">
              {saveState.reason}
            </span>
          ) : null}
          {isTarget && saveState.status === "conflict" ? (
            <span className="pg-label text-[var(--pg-color-decision)]">
              {saveState.reason}
            </span>
          ) : null}
        </div>
      )}
    </PgCard>
  );
}

function BoundarySection({
  heading,
  boundaries,
  copy,
  saveState,
  tone,
  onChangeBoundary,
  onConfirm,
  onCancel,
}: {
  heading: string;
  boundaries: AgreementBoundary[];
  copy: AgreementViewModel["copy"];
  saveState: AgreementSaveState;
  tone?: "decision";
  onChangeBoundary?: (id: string, next: BoundaryKind) => void;
  onConfirm?: (id: string) => void;
  onCancel?: () => void;
}) {
  if (boundaries.length === 0) return null;

  return (
    <PgSection
      title={heading}
      count={boundaries.length}
      attention={tone === "decision"}
    >
      {boundaries.map((boundary) => (
        <BoundaryCard
          key={boundary.id}
          boundary={boundary}
          copy={copy}
          saveState={saveState}
          onChangeBoundary={onChangeBoundary}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ))}
    </PgSection>
  );
}

export default function AgreementView({
  model,
  saveState = { status: "idle" },
  onChangeBoundary,
  onConfirm,
  onCancel,
  onCorrect,
  visibleSection = null,
  hideHeader = false,
}: AgreementViewProps) {
  const { copy } = model;
  const [showHistory, setShowHistory] = useState(false);

  const provenanceLabel = (provenance: AgreementKnowledge["provenance"]) =>
    provenance === "system_fact"
      ? copy.provenanceSystem
      : provenance === "customer_rule"
        ? copy.provenanceCustomer
        : copy.provenanceEmma;

  const brandKnowledge = model.knowledge.filter(
    (entry) => entry.provenance === "customer_rule" || entry.provenance === "emma_understanding"
  );

  const showBoundaries =
    !visibleSection || visibleSection === "agreement" || visibleSection === "autonomy" || visibleSection === "responsibilities";
  const showKnowledge =
    !visibleSection || visibleSection === "knowledge" || visibleSection === "brand";
  const showConnections = !visibleSection || visibleSection === "connections";
  const knowledgeEntries =
    visibleSection === "brand" ? brandKnowledge : model.knowledge;

  return (
    <PgPage testId="office-agreement-view">
      {!hideHeader ? <PgPageHeader title={copy.title} subtitle={copy.subtitle} /> : null}

      {model.empty ? (
        <PgEmptyState
          voice={model.empty.voice}
          next={model.empty.next}
          testId="agreement-empty"
        />
      ) : null}

      {/* Boundaries — scannable accordion groups with counts always visible. */}
      {showBoundaries ? (
      <PgAccordion testId="agreement-boundaries" className="mb-[var(--pg-space-6)]">
        {(!visibleSection || visibleSection === "agreement" || visibleSection === "autonomy") ? (
        <PgAccordionSection
          id="autonomous"
          title={copy.autonomousHeading}
          count={model.autonomous.length}
          defaultOpen
        >
          {model.autonomous.map((boundary) => (
            <BoundaryCard
              key={boundary.id}
              boundary={boundary}
              copy={copy}
              saveState={saveState}
              onChangeBoundary={onChangeBoundary}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          ))}
        </PgAccordionSection>
        ) : null}
        {(!visibleSection || visibleSection === "agreement" || visibleSection === "responsibilities") ? (
        <PgAccordionSection
          id="needs-approval"
          title={copy.needsApprovalHeading}
          count={model.needsApproval.length}
          defaultOpen
        >
          {model.needsApproval.map((boundary) => (
            <BoundaryCard
              key={boundary.id}
              boundary={boundary}
              copy={copy}
              saveState={saveState}
              onChangeBoundary={onChangeBoundary}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          ))}
        </PgAccordionSection>
        ) : null}
        {(!visibleSection || visibleSection === "agreement" || visibleSection === "autonomy") ? (
        <PgAccordionSection
          id="never"
          title={copy.neverHeading}
          count={model.never.length}
        >
          {model.never.map((boundary) => (
            <BoundaryCard
              key={boundary.id}
              boundary={boundary}
              copy={copy}
              saveState={saveState}
              onChangeBoundary={onChangeBoundary}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          ))}
        </PgAccordionSection>
        ) : null}
      </PgAccordion>
      ) : null}

      {/* Legacy flat sections removed — boundaries live in accordion above. */}

      {/* What she knows, with provenance always visible. */}
      {showKnowledge && knowledgeEntries.length > 0 ? (
      <PgSection title={copy.knowledgeHeading}>
        <PgCard>
          <ul className="m-0 flex list-none flex-col gap-[var(--pg-space-3)] p-0">
            {knowledgeEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1"
                data-testid={`agreement-knowledge-${entry.id}`}
              >
                <p className="pg-label">
                  {entry.label}
                  {" · "}
                  <span className={PROVENANCE_STYLE[entry.provenance]}>
                    {provenanceLabel(entry.provenance)}
                  </span>
                </p>
                <p className="pg-body pg-body--sm pg-measure">{entry.value}</p>
                {entry.correctedBy ? (
                  <p className="pg-label text-[var(--pg-color-accent)]">
                    {copy.correctedLabel(entry.correctedBy)}
                  </p>
                ) : entry.correctable && onCorrect ? (
                  <button
                    type="button"
                    onClick={() => onCorrect(entry.id)}
                    className="pg-focus-premium self-start text-sm text-[var(--pg-color-accent)]"
                    data-testid={`agreement-correct-${entry.id}`}
                  >
                    {copy.correctLabel}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          {model.noLearnedUnderstanding ? (
            <p
              className="pg-body pg-body--sm pg-measure mt-[var(--pg-space-3)] text-[var(--pg-color-text-tertiary)]"
              data-testid="agreement-no-learned"
            >
              {model.noLearnedUnderstanding}
            </p>
          ) : null}
        </PgCard>
      </PgSection>
      ) : null}

      {/* Access — real connections only. */}
      {showConnections && model.connections.length > 0 ? (
        <PgSection title={copy.connectionsHeading}>
          <div className="flex flex-col gap-[var(--pg-space-2)]">
            {model.connections.map((connection) => (
              <PgCard
                key={connection.id}
                className="flex flex-wrap items-center gap-[var(--pg-space-3)]"
                data-testid={`agreement-connection-${connection.id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="pg-body pg-body--sm text-[var(--pg-color-text-primary)]">
                    {connection.label}
                  </p>
                  <p className="pg-body pg-body--sm">{connection.unlocks}</p>
                </div>
                <span
                  className={cn(
                    "pg-label shrink-0",
                    connection.connected
                      ? "text-[var(--pg-color-success)]"
                      : "text-[var(--pg-color-text-tertiary)]"
                  )}
                >
                  {connection.statusLabel}
                </span>
                <Link
                  href={connection.href}
                  className="pg-focus-premium shrink-0 text-sm text-[var(--pg-color-accent)]"
                >
                  {connection.connected ? copy.reversalLabel : copy.confirmLabel}
                </Link>
              </PgCard>
            ))}
          </div>
        </PgSection>
      ) : null}

      {/* Reversible history, collapsed — it is a record, not presence. */}
      {(!visibleSection || visibleSection === "agreement") && model.history.length > 0 ? (
        <section aria-labelledby="agreement-history">
          <div className="flex items-baseline gap-[var(--pg-space-3)]">
            <h2 id="agreement-history" className="pg-label">
              {copy.historyHeading}
            </h2>
            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              className="pg-focus-premium text-sm text-[var(--pg-color-accent)]"
              aria-expanded={showHistory}
            >
              {showHistory ? copy.cancelLabel : copy.historyHeading}
            </button>
          </div>

          {showHistory ? (
            <ul className="m-0 mt-[var(--pg-space-3)] flex list-none flex-col p-0">
              {model.history.map((entry) => (
                <li
                  key={entry.id}
                  className={cn(
                    "flex items-baseline gap-[var(--pg-space-3)]",
                    "border-b border-[var(--pg-office-line)] py-[var(--pg-space-2)]",
                    "last:border-b-0"
                  )}
                >
                  <span className="flex-1 text-[var(--pg-type-body-sm)] text-[var(--pg-color-text-secondary)]">
                    {entry.label}
                  </span>
                  <span className="pg-label shrink-0">{entry.atLabel}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </PgPage>
  );
}
