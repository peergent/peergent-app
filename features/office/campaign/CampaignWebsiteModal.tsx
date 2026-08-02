"use client";

import { useCallback, useState } from "react";
import PgVisionModal from "@/components/design-system/PgVisionModal";

export type CampaignWebsiteModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  initialUrl?: string | null;
  onSubmit: (url: string) => void;
};

function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return Boolean(parsed.hostname.includes("."));
  } catch {
    return false;
  }
}

export default function CampaignWebsiteModal({
  open,
  onClose,
  locale,
  initialUrl,
  onSubmit,
}: CampaignWebsiteModalProps) {
  const nl = locale === "nl";
  const [url, setUrl] = useState(initialUrl ?? "");
  const [touched, setTouched] = useState(false);

  const valid = isValidUrl(url);
  const showError = touched && !valid && url.trim().length > 0;

  const handleSubmit = useCallback(() => {
    setTouched(true);
    if (!valid) return;
    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    onSubmit(normalized);
    onClose();
  }, [onClose, onSubmit, url, valid]);

  return (
    <PgVisionModal open={open} onClose={onClose} size="preview" testId="campaign-website-modal">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">Emma</p>
        <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
          {nl ? "Website toevoegen" : "Add website"}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
          {nl
            ? "Voeg je website-URL toe. Emma gebruikt dit samen met je campagne-input — er wordt geen echte crawl uitgevoerd in deze demo."
            : "Add your website URL. Emma uses this with your campaign input — no real crawl runs in this demo."}
        </p>
      </div>

      <div className="px-7 py-6">
        <label className="block">
          <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
            {nl ? "Website-URL" : "Website URL"}
          </span>
          <input
            type="url"
            className="pg-v13-input mt-2 w-full"
            placeholder="https://peergent.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            data-testid="campaign-website-url-input"
          />
        </label>
        {showError ? (
          <p className="mt-2 text-[12px] text-[var(--pg-v13-attention)]">
            {nl ? "Voer een geldige URL in (bijv. peergent.com)." : "Enter a valid URL (e.g. peergent.com)."}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        <button
          type="button"
          className="pg-v13-btn"
          onClick={handleSubmit}
          disabled={!valid}
          data-testid="campaign-website-analyse"
        >
          {nl ? "Analyseer" : "Analyse"}
        </button>
        <button type="button" className="pg-v13-btn pg-v13-btn--ghost ml-auto" onClick={onClose}>
          {nl ? "Annuleren" : "Cancel"}
        </button>
      </div>
    </PgVisionModal>
  );
}
