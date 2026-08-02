"use client";

import { useCallback, useState } from "react";
import PgVisionModal from "@/components/design-system/PgVisionModal";
import type { DemoCompetitorInput } from "@/lib/office/demo/demo-campaign-store";

export type CampaignCompetitorModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  onSubmit: (competitors: readonly DemoCompetitorInput[]) => void;
};

type Row = { name: string; url: string };

export default function CampaignCompetitorModal({
  open,
  onClose,
  locale,
  onSubmit,
}: CampaignCompetitorModalProps) {
  const nl = locale === "nl";
  const [rows, setRows] = useState<Row[]>([{ name: "", url: "" }]);

  const validRows = rows.filter((r) => r.name.trim().length > 0);

  const addRow = () => setRows((prev) => [...prev, { name: "", url: "" }]);

  const updateRow = (index: number, field: keyof Row, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleSubmit = useCallback(() => {
    if (validRows.length === 0) return;
    onSubmit(
      validRows.map((r) => ({
        name: r.name.trim(),
        url: r.url.trim() || undefined,
      }))
    );
    onClose();
  }, [onClose, onSubmit, validRows]);

  return (
    <PgVisionModal open={open} onClose={onClose} size="preview" testId="campaign-competitor-modal">
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
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Naam" : "Name"} *
              </span>
              <input
                className="pg-v13-input mt-1 w-full"
                value={row.name}
                onChange={(e) => updateRow(index, "name", e.target.value)}
                data-testid={`competitor-name-${index}`}
              />
            </label>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "URL (optioneel)" : "URL (optional)"}
              </span>
              <input
                className="pg-v13-input mt-1 w-full"
                value={row.url}
                onChange={(e) => updateRow(index, "url", e.target.value)}
                placeholder="https://"
                data-testid={`competitor-url-${index}`}
              />
            </label>
          </div>
        ))}
        <button type="button" className="pg-v13-btn pg-v13-btn--ghost text-[13px]" onClick={addRow}>
          {nl ? "+ Nog een concurrent" : "+ Another competitor"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        <button
          type="button"
          className="pg-v13-btn"
          onClick={handleSubmit}
          disabled={validRows.length === 0}
          data-testid="campaign-competitor-submit"
        >
          {nl ? "Opslaan en vergelijken" : "Save and compare"}
        </button>
        <button type="button" className="pg-v13-btn pg-v13-btn--ghost ml-auto" onClick={onClose}>
          {nl ? "Annuleren" : "Cancel"}
        </button>
      </div>
    </PgVisionModal>
  );
}
