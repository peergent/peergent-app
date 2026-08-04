"use client";

import { useCallback, useEffect, useState } from "react";
import PgVisionModal from "@/components/design-system/PgVisionModal";
import {
  validateCompetitorInputs,
  type CampaignCompetitorInput,
  type CompetitorRowValidation,
} from "@/lib/office/campaign/competitor-input-validation";

export type CampaignCompetitorModalPhase = "idle" | "validating" | "saving" | "success" | "error";

export type CampaignCompetitorModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  onSubmit: (competitors: readonly CampaignCompetitorInput[]) => void | Promise<void>;
};

type Row = { name: string; url: string };

type ModalBodyProps = {
  nl: boolean;
  onClose: () => void;
  onSubmit: (competitors: readonly CampaignCompetitorInput[]) => void | Promise<void>;
  onBusyChange: (busy: boolean) => void;
};

function CampaignCompetitorModalBody({ nl, onClose, onSubmit, onBusyChange }: ModalBodyProps) {
  const [rows, setRows] = useState<Row[]>([{ name: "", url: "" }]);
  const [rowErrors, setRowErrors] = useState<Record<number, CompetitorRowValidation>>({});
  const [phase, setPhase] = useState<CampaignCompetitorModalPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validRows = rows.filter((r) => r.name.trim().length > 0);
  const busy = phase === "validating" || phase === "saving";

  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);

  const addRow = () => setRows((prev) => [...prev, { name: "", url: "" }]);

  const updateRow = (index: number, field: keyof Row, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    setRowErrors((prev) => {
      if (!prev[index]) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    setErrorMessage(null);
    setPhase("validating");

    const { rowErrors: nextRowErrors, validEntries, hasErrors } = validateCompetitorInputs(rows, nl);
    if (validEntries.length === 0) {
      setRowErrors(
        rows.reduce<Record<number, CompetitorRowValidation>>((acc, row, index) => {
          if (row.name.trim() || row.url.trim()) {
            acc[index] = nextRowErrors[index] ?? {
              nameError: nl ? "Vul een naam in." : "Enter a name.",
            };
          } else if (index === 0) {
            acc[index] = { nameError: nl ? "Vul een naam in." : "Enter a name." };
          }
          return acc;
        }, {})
      );
      setPhase("error");
      return;
    }

    if (hasErrors) {
      setRowErrors(nextRowErrors);
      setPhase("error");
      return;
    }

    setRowErrors({});
    setPhase("saving");
    try {
      await onSubmit(validEntries);
      setPhase("success");
    } catch {
      setPhase("error");
      setErrorMessage(
        nl
          ? "Concurrenten konden niet worden opgeslagen. Probeer het opnieuw."
          : "Could not save competitors. Please try again."
      );
    }
  }, [nl, onSubmit, rows]);

  return (
    <>
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">Emma</p>
        <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
          {nl ? "Concurrenten toevoegen" : "Add competitors"}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
          {nl
            ? "Voeg één of meer concurrenten toe. Emma vergelijkt alleen met wat jij expliciet opgeeft — geen automatische marktscan."
            : "Add one or more competitors. Emma compares only what you explicitly provide — no automatic market scan."}
        </p>
      </div>

      <div className="max-h-[40vh] space-y-4 overflow-y-auto px-7 py-6">
        {phase === "success" ? (
          <p
            className="text-[14px] font-semibold text-[var(--pg-v13-success)]"
            data-testid="competitor-modal-success"
          >
            {nl ? "Concurrenten toegevoegd als context" : "Competitors added as context"}
          </p>
        ) : (
          <>
            {rows.map((row, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                    {nl ? "Naam" : "Name"} *
                  </span>
                  <input
                    className="pg-v13-input mt-1 w-full"
                    value={row.name}
                    disabled={busy}
                    onChange={(e) => updateRow(index, "name", e.target.value)}
                    data-testid={`competitor-name-${index}`}
                  />
                  {rowErrors[index]?.nameError ? (
                    <p
                      className="mt-1 text-[12px] text-[var(--pg-v13-attention)]"
                      data-testid={`competitor-name-error-${index}`}
                    >
                      {rowErrors[index]?.nameError}
                    </p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                    {nl ? "URL (optioneel)" : "URL (optional)"}
                  </span>
                  <input
                    className="pg-v13-input mt-1 w-full"
                    value={row.url}
                    disabled={busy}
                    onChange={(e) => updateRow(index, "url", e.target.value)}
                    placeholder="https://"
                    data-testid={`competitor-url-${index}`}
                  />
                  {rowErrors[index]?.urlError ? (
                    <p
                      className="mt-1 text-[12px] text-[var(--pg-v13-attention)]"
                      data-testid={`competitor-url-error-${index}`}
                    >
                      {rowErrors[index]?.urlError}
                    </p>
                  ) : null}
                </label>
              </div>
            ))}
            <button
              type="button"
              className="pg-v13-btn pg-v13-btn--ghost text-[13px]"
              onClick={addRow}
              disabled={busy}
            >
              {nl ? "+ Nog een concurrent" : "+ Another competitor"}
            </button>
            {errorMessage ? (
              <p className="text-[12px] text-[var(--pg-v13-attention)]" data-testid="competitor-modal-error">
                {errorMessage}
              </p>
            ) : null}
            {busy ? (
              <p
                className="flex items-center gap-2 text-[13px] text-[var(--pg-v13-ink-soft)]"
                data-testid="competitor-modal-saving"
              >
                <span
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--pg-v13-blue)] border-t-transparent"
                  aria-hidden
                />
                {nl ? "Concurrenten opslaan…" : "Saving competitors…"}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        {phase !== "success" ? (
          <button
            type="button"
            className="pg-v13-btn"
            onClick={() => void handleSubmit()}
            disabled={validRows.length === 0 || busy}
            data-testid="campaign-competitor-submit"
          >
            {nl ? "Opslaan en vergelijken" : "Save and compare"}
          </button>
        ) : null}
        <button
          type="button"
          className="pg-v13-btn pg-v13-btn--ghost ml-auto"
          onClick={onClose}
          disabled={busy}
        >
          {phase === "success" ? (nl ? "Sluiten" : "Close") : nl ? "Annuleren" : "Cancel"}
        </button>
      </div>
    </>
  );
}

export default function CampaignCompetitorModal({
  open,
  onClose,
  locale,
  onSubmit,
}: CampaignCompetitorModalProps) {
  const nl = locale === "nl";
  const [busy, setBusy] = useState(false);

  return (
    <PgVisionModal
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="preview"
      testId="campaign-competitor-modal"
    >
      {open ? (
        <CampaignCompetitorModalBody
          key="competitor-modal-body"
          nl={nl}
          onClose={onClose}
          onSubmit={onSubmit}
          onBusyChange={setBusy}
        />
      ) : null}
    </PgVisionModal>
  );
}
