"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import type {
  AgreementBoundary,
  AgreementKnowledge,
  AgreementSaveState,
  AgreementViewModel,
  BoundaryKind,
} from "@/lib/office/agreement/types";
import type { AgreementViewProps } from "./AgreementView";

const PROVENANCE_STYLE: Record<AgreementKnowledge["provenance"], string> = {
  system_fact: "text-[var(--pg-v13-ink-faint)]",
  customer_rule: "text-[var(--pg-v13-blue)]",
  emma_understanding: "text-[var(--pg-v13-attention)]",
};

function boundaryKindLabel(kind: BoundaryKind, copy: AgreementViewModel["copy"]): string {
  if (kind === "autonomous") return copy.autonomousHeading;
  if (kind === "needs_approval") return copy.needsApprovalHeading;
  return copy.neverHeading;
}

function VisionBoundaryRow({
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
  const isTarget = "boundaryId" in saveState && saveState.boundaryId === boundary.id;

  return (
    <div className="pg-v13-agreement-boundary" data-testid={`agreement-boundary-${boundary.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-[var(--pg-v13-ink)]">{boundary.title}</p>
          {boundary.description ? (
            <p className="mt-1 text-[12.5px] leading-snug text-[var(--pg-v13-ink-soft)]">
              {boundary.description}
            </p>
          ) : null}
        </div>
        <span className="pg-v13-mono shrink-0 text-[10px] font-bold tracking-[0.06em] text-[var(--pg-v13-ink-faint)] uppercase">
          {boundaryKindLabel(boundary.kind, copy)}
        </span>
      </div>

      <div className="pg-v13-agreement-consequence mt-3">
        <p className="pg-v13-mono text-[10px] tracking-[0.06em] text-[var(--pg-v13-ink-faint)] uppercase">
          {copy.consequenceLabel}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-[var(--pg-v13-ink-soft)]">{boundary.consequence}</p>
      </div>

      {boundary.guardrails.length > 0 ? (
        <dl className="mt-3 flex flex-col gap-1.5">
          {boundary.guardrails.map((guardrail) => (
            <div key={guardrail.id} className="flex flex-wrap gap-2 text-[12.5px]">
              <dt className="pg-v13-mono text-[10px] tracking-[0.05em] text-[var(--pg-v13-ink-faint)] uppercase">
                {guardrail.label}
              </dt>
              <dd className="m-0 text-[var(--pg-v13-ink-soft)]">{guardrail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {boundary.lastChangedLabel ? (
        <p className="pg-v13-mono mt-3 text-[10px] text-[var(--pg-v13-ink-faint)]">{boundary.lastChangedLabel}</p>
      ) : null}

      {isTarget && saveState.status === "confirming" ? (
        <div className="mt-4 flex flex-col gap-3" data-testid={`agreement-confirm-${boundary.id}`}>
          <p className="text-[14px] leading-relaxed text-[var(--pg-v13-ink)]">{saveState.consequence}</p>
          <p className="text-[12px] text-[var(--pg-v13-ink-faint)]">
            {copy.reversalLabel}: {boundary.reversal}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="pg-v13-btn pg-v13-btn--sm" onClick={() => onConfirm?.(boundary.id)}>
              {copy.confirmLabel}
            </button>
            <button type="button" className="pg-v13-btn pg-v13-btn--ghost pg-v13-btn--sm" onClick={onCancel}>
              {copy.cancelLabel}
            </button>
          </div>
        </div>
      ) : isTarget && saveState.status === "failed" ? (
        <div className="mt-4 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-attention-line)] bg-[var(--pg-v13-attention-soft)] px-4 py-3">
          <p className="text-[13px] font-semibold text-[var(--pg-v13-ink)]">{saveState.voice}</p>
          <p className="mt-1 text-[12px] text-[var(--pg-v13-ink-soft)]">{saveState.preserved}</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {boundary.kind !== "autonomous" ? (
            <button
              type="button"
              className="pg-v13-btn pg-v13-btn--ghost pg-v13-btn--sm"
              onClick={() => onChangeBoundary?.(boundary.id, "autonomous")}
              data-testid={`agreement-widen-${boundary.id}`}
            >
              {copy.widenLabel}
            </button>
          ) : null}
          {boundary.kind !== "needs_approval" ? (
            <button
              type="button"
              className="pg-v13-btn pg-v13-btn--ghost pg-v13-btn--sm"
              onClick={() => onChangeBoundary?.(boundary.id, "needs_approval")}
              data-testid={`agreement-narrow-${boundary.id}`}
            >
              {copy.narrowLabel}
            </button>
          ) : null}
          {isTarget && saveState.status === "saving" ? (
            <span className="pg-v13-mono text-[10px] text-[var(--pg-v13-ink-faint)]">{copy.savingLabel}</span>
          ) : null}
          {isTarget && saveState.status === "saved" ? (
            <span className="pg-v13-mono text-[10px] text-[var(--pg-v13-success)]">{copy.savedLabel}</span>
          ) : null}
          {isTarget && saveState.status === "invalid" ? (
            <span className="pg-v13-mono text-[10px] text-[var(--pg-v13-attention)]">{saveState.reason}</span>
          ) : null}
          {isTarget && saveState.status === "conflict" ? (
            <span className="pg-v13-mono text-[10px] text-[var(--pg-v13-attention)]">{saveState.reason}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function BoundaryGroup({
  heading,
  boundaries,
  copy,
  saveState,
  onChangeBoundary,
  onConfirm,
  onCancel,
}: {
  heading: string;
  boundaries: AgreementBoundary[];
  copy: AgreementViewModel["copy"];
  saveState: AgreementSaveState;
  onChangeBoundary?: (id: string, next: BoundaryKind) => void;
  onConfirm?: (id: string) => void;
  onCancel?: () => void;
}) {
  if (boundaries.length === 0) return null;

  return (
    <section className="pg-v13-sec">
      <p className="pg-v13-sec-label">{heading}</p>
      <div className="flex flex-col gap-3">
        {boundaries.map((boundary) => (
          <VisionBoundaryRow
            key={boundary.id}
            boundary={boundary}
            copy={copy}
            saveState={saveState}
            onChangeBoundary={onChangeBoundary}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        ))}
      </div>
    </section>
  );
}

export type VisionAgreementDetailViewProps = Omit<AgreementViewProps, "hideHeader"> & {
  visibleSection: NonNullable<AgreementViewProps["visibleSection"]>;
  locale?: string | null;
  isDemo?: boolean;
  onSaveKnowledge?: (id: string, value: string) => void;
  onAddKnowledge?: (entry: { label: string; value: string }) => void;
  onRemoveKnowledge?: (id: string) => void;
  knowledgePersistNotice?: string | null;
};

function KnowledgeSection({
  entries,
  copy,
  locale,
  visibleSection,
  onCorrect,
  onSaveKnowledge,
  onAddKnowledge,
  onRemoveKnowledge,
  knowledgePersistNotice,
}: {
  entries: AgreementKnowledge[];
  copy: AgreementViewModel["copy"];
  locale?: string | null;
  visibleSection: "brand" | "knowledge";
  onCorrect?: (id: string) => void;
  onSaveKnowledge?: (id: string, value: string) => void;
  onAddKnowledge?: (entry: { label: string; value: string }) => void;
  onRemoveKnowledge?: (id: string) => void;
  knowledgePersistNotice?: string | null;
}) {
  const nl = locale === "nl";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const provenanceLabel = (provenance: AgreementKnowledge["provenance"]) =>
    provenance === "system_fact"
      ? copy.provenanceSystem
      : provenance === "customer_rule"
        ? copy.provenanceCustomer
        : copy.provenanceEmma;

  const startEdit = (entry: AgreementKnowledge) => {
    setEditingId(entry.id);
    setDraftValue(entry.value);
  };

  const saveEdit = (id: string) => {
    const trimmed = draftValue.trim();
    if (!trimmed) return;
    onSaveKnowledge?.(id, trimmed);
    setEditingId(null);
    setDraftValue("");
  };

  const submitAdd = () => {
    const label = newLabel.trim();
    const value = newValue.trim();
    if (!label || !value) return;
    onAddKnowledge?.({ label, value });
    setNewLabel("");
    setNewValue("");
    setShowAdd(false);
  };

  return (
    <div data-testid="office-agreement-view">
      {knowledgePersistNotice ? (
        <p className="mb-4 text-[12.5px] text-[var(--pg-v13-ink-faint)]" data-testid="knowledge-persist-notice">
          {knowledgePersistNotice}
        </p>
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-0 p-0">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="pg-v13-agreement-knowledge-row"
            data-testid={`agreement-knowledge-${entry.id}`}
          >
            <p className="pg-v13-mono text-[10px] tracking-[0.06em] text-[var(--pg-v13-ink-faint)] uppercase">
              {entry.label}
              {" · "}
              <span className={PROVENANCE_STYLE[entry.provenance]}>{provenanceLabel(entry.provenance)}</span>
            </p>
            {editingId === entry.id ? (
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  className="pg-v13-input min-h-[88px] w-full resize-y text-[13.5px]"
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  data-testid={`agreement-edit-${entry.id}`}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="pg-v13-btn pg-v13-btn--sm"
                    onClick={() => saveEdit(entry.id)}
                  >
                    {copy.confirmLabel}
                  </button>
                  <button
                    type="button"
                    className="pg-v13-btn pg-v13-btn--ghost pg-v13-btn--sm"
                    onClick={() => {
                      setEditingId(null);
                      setDraftValue("");
                    }}
                  >
                    {copy.cancelLabel}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-1 text-[13.5px] leading-snug text-[var(--pg-v13-ink)]">{entry.value}</p>
                {entry.correctedBy ? (
                  <p className="mt-1 text-[12px] text-[var(--pg-v13-blue)]">
                    {copy.correctedLabel(entry.correctedBy)}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.correctable && onSaveKnowledge ? (
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      className="pg-v13-btn pg-v13-btn--link"
                      data-testid={`agreement-edit-btn-${entry.id}`}
                    >
                      {entry.correctable && entry.provenance === "emma_understanding"
                        ? copy.correctLabel
                        : nl
                          ? "Bewerken"
                          : "Edit"}
                    </button>
                  ) : entry.correctable && onCorrect ? (
                    <button
                      type="button"
                      onClick={() => onCorrect(entry.id)}
                      className="pg-v13-btn pg-v13-btn--link"
                      data-testid={`agreement-correct-${entry.id}`}
                    >
                      {copy.correctLabel}
                    </button>
                  ) : null}
                  {entry.provenance === "customer_rule" && onRemoveKnowledge ? (
                    <button
                      type="button"
                      onClick={() => onRemoveKnowledge(entry.id)}
                      className="pg-v13-btn pg-v13-btn--ghost pg-v13-btn--sm"
                      data-testid={`agreement-remove-${entry.id}`}
                    >
                      {nl ? "Verwijderen" : "Remove"}
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {visibleSection === "knowledge" && onAddKnowledge ? (
        <div className="mt-6 border-t border-[var(--pg-v13-line-soft)] pt-5">
          {showAdd ? (
            <div className="flex flex-col gap-3" data-testid="agreement-add-knowledge-form">
              <input
                className="pg-v13-input w-full text-[13.5px]"
                placeholder={nl ? "Onderwerp (bijv. concurrent, product, regel)" : "Topic (e.g. competitor, product, rule)"}
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
              />
              <textarea
                className="pg-v13-input min-h-[96px] w-full resize-y text-[13.5px]"
                placeholder={nl ? "Wat moet Emma weten?" : "What should Emma know?"}
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
              />
              <p className="text-[12px] text-[var(--pg-v13-ink-faint)]">
                {nl
                  ? "Dit wordt opgeslagen als door jou ingestelde kennis — niet als afgeleid beeld."
                  : "This is saved as knowledge you set — not as inferred understanding."}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="pg-v13-btn pg-v13-btn--sm" onClick={submitAdd}>
                  {nl ? "Voeg kennis toe" : "Add knowledge"}
                </button>
                <button
                  type="button"
                  className="pg-v13-btn pg-v13-btn--ghost pg-v13-btn--sm"
                  onClick={() => setShowAdd(false)}
                >
                  {copy.cancelLabel}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="pg-v13-btn pg-v13-btn--ghost"
              onClick={() => setShowAdd(true)}
              data-testid="agreement-add-knowledge"
            >
              {nl ? "Voeg kennis toe" : "Add knowledge"}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function VisionAgreementDetailView({
  model,
  saveState = { status: "idle" },
  onChangeBoundary,
  onConfirm,
  onCancel,
  onCorrect,
  visibleSection,
  locale,
  onSaveKnowledge,
  onAddKnowledge,
  onRemoveKnowledge,
  knowledgePersistNotice,
}: VisionAgreementDetailViewProps) {
  const { copy } = model;
  const [showHistory, setShowHistory] = useState(false);

  const brandKnowledge = model.knowledge.filter(
    (entry) => entry.provenance === "customer_rule" || entry.provenance === "emma_understanding"
  );

  if (model.empty) {
    return (
      <div className="pg-v13-panel px-5 py-4" data-testid="agreement-empty">
        <p className="text-[15px] text-[var(--pg-v13-ink-soft)]">{model.empty.voice}</p>
        {model.empty.next ? (
          <p className="mt-2 text-[13px] text-[var(--pg-v13-ink-faint)]">{model.empty.next}</p>
        ) : null}
      </div>
    );
  }

  if (visibleSection === "brand" || visibleSection === "knowledge") {
    const entries = visibleSection === "brand" ? brandKnowledge : model.knowledge;

    if (entries.length === 0 && visibleSection === "brand") {
      return (
        <p className="text-[13px] text-[var(--pg-v13-ink-faint)]" data-testid="agreement-no-learned">
          {model.noLearnedUnderstanding ?? copy.knowledgeHeading}
        </p>
      );
    }

    if (entries.length === 0 && visibleSection === "knowledge" && !onAddKnowledge) {
      return (
        <p className="text-[13px] text-[var(--pg-v13-ink-faint)]" data-testid="agreement-no-learned">
          {model.noLearnedUnderstanding ?? copy.knowledgeHeading}
        </p>
      );
    }

    return (
      <>
        <KnowledgeSection
          entries={entries}
          copy={copy}
          locale={locale}
          visibleSection={visibleSection}
          onCorrect={onCorrect}
          onSaveKnowledge={onSaveKnowledge}
          onAddKnowledge={visibleSection === "knowledge" ? onAddKnowledge : undefined}
          onRemoveKnowledge={onRemoveKnowledge}
          knowledgePersistNotice={knowledgePersistNotice}
        />
        {model.noLearnedUnderstanding && visibleSection === "knowledge" && entries.length > 0 ? (
          <p className="mt-4 text-[13px] text-[var(--pg-v13-ink-faint)]" data-testid="agreement-no-learned">
            {model.noLearnedUnderstanding}
          </p>
        ) : null}
      </>
    );
  }

  if (visibleSection === "connections") {
    if (model.connections.length === 0) {
      return <p className="text-[13px] text-[var(--pg-v13-ink-faint)]">{copy.connectionsHeading}</p>;
    }

    return (
      <div className="flex flex-col gap-2" data-testid="office-agreement-view">
        {model.connections.map((connection) => (
          <div key={connection.id} className="pg-v13-settings-row" data-testid={`agreement-connection-${connection.id}`}>
            <div className="min-w-0 flex-1">
              <div className="pg-v13-settings-name">{connection.label}</div>
              <div className="pg-v13-settings-desc">{connection.unlocks}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className={cn(
                  "pg-v13-mono text-[10px] font-bold tracking-[0.06em] uppercase",
                  connection.connected ? "text-[var(--pg-v13-success)]" : "text-[var(--pg-v13-ink-faint)]"
                )}
              >
                {connection.statusLabel}
              </span>
              <Link href={connection.href} className="pg-v13-btn pg-v13-btn--link text-[12px] no-underline">
                {connection.connected ? copy.reversalLabel : copy.confirmLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visibleSection === "responsibilities") {
    return (
      <div data-testid="office-agreement-view">
        <BoundaryGroup
          heading={copy.needsApprovalHeading}
          boundaries={model.needsApproval}
          copy={copy}
          saveState={saveState}
          onChangeBoundary={onChangeBoundary}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </div>
    );
  }

  if (visibleSection === "autonomy") {
    return (
      <div data-testid="office-agreement-view">
        <BoundaryGroup
          heading={copy.autonomousHeading}
          boundaries={model.autonomous}
          copy={copy}
          saveState={saveState}
          onChangeBoundary={onChangeBoundary}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
        <BoundaryGroup
          heading={copy.neverHeading}
          boundaries={model.never}
          copy={copy}
          saveState={saveState}
          onChangeBoundary={onChangeBoundary}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div data-testid="office-agreement-view">
      <BoundaryGroup
        heading={copy.autonomousHeading}
        boundaries={model.autonomous}
        copy={copy}
        saveState={saveState}
        onChangeBoundary={onChangeBoundary}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <BoundaryGroup
        heading={copy.needsApprovalHeading}
        boundaries={model.needsApproval}
        copy={copy}
        saveState={saveState}
        onChangeBoundary={onChangeBoundary}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <BoundaryGroup
        heading={copy.neverHeading}
        boundaries={model.never}
        copy={copy}
        saveState={saveState}
        onChangeBoundary={onChangeBoundary}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      {model.history.length > 0 ? (
        <section className="pg-v13-sec" aria-labelledby="agreement-history">
          <div className="flex items-baseline gap-3">
            <p id="agreement-history" className="pg-v13-sec-label mb-0">
              {copy.historyHeading}
            </p>
            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              className="pg-v13-btn pg-v13-btn--link text-[12px]"
              aria-expanded={showHistory}
            >
              {showHistory ? copy.cancelLabel : copy.historyHeading}
            </button>
          </div>
          {showHistory ? (
            <ul className="pg-v13-row-list mt-3">
              {model.history.map((entry) => (
                <li key={entry.id} className="pg-v13-row-item">
                  <span className="text-[13px] text-[var(--pg-v13-ink-soft)]">{entry.label}</span>
                  <span className="pg-v13-mono text-[10px] text-[var(--pg-v13-ink-faint)]">{entry.atLabel}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
