"use client";

import { useCallback, useEffect, useState } from "react";
import PgVisionModal from "@/components/design-system/PgVisionModal";

export type CampaignWebsiteModalPhase = "idle" | "validating" | "saving" | "success" | "error";

export type CampaignWebsiteModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  isDemo?: boolean;
  initialUrl?: string | null;
  onSubmit: (url: string) => void | Promise<void>;
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
  isDemo = false,
  initialUrl,
  onSubmit,
}: CampaignWebsiteModalProps) {
  const nl = locale === "nl";
  const [url, setUrl] = useState(initialUrl ?? "");
  const [touched, setTouched] = useState(false);
  const [phase, setPhase] = useState<CampaignWebsiteModalPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl ?? "");
      setTouched(false);
      setPhase("idle");
      setErrorMessage(null);
    }
  }, [open, initialUrl]);

  const valid = isValidUrl(url);
  const showError =
    (touched && !valid && url.trim().length > 0) || (phase === "error" && Boolean(errorMessage));
  const busy = phase === "validating" || phase === "saving";

  const handleSubmit = useCallback(async () => {
    setTouched(true);
    setErrorMessage(null);
    if (!valid) {
      setPhase("error");
      setErrorMessage(
        nl ? "Voer een geldige URL in (bijv. peergent.com)." : "Enter a valid URL (e.g. peergent.com)."
      );
      return;
    }
    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    setPhase("saving");
    try {
      await onSubmit(normalized);
      setPhase("success");
    } catch {
      setPhase("error");
      setErrorMessage(
        nl
          ? "De website kon niet worden opgeslagen. Probeer het opnieuw."
          : "Could not save the website. Please try again."
      );
    }
  }, [nl, onSubmit, url, valid]);

  return (
    <PgVisionModal
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="preview"
      testId="campaign-website-modal"
    >
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">Emma</p>
        <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
          {nl ? "Website toevoegen" : "Add website"}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
          {isDemo
            ? nl
              ? "Voeg je website-URL toe. Emma gebruikt dit samen met je campagne-input — er wordt geen echte crawl uitgevoerd in deze demo."
              : "Add your website URL. Emma uses this with your campaign input — no real crawl runs in this demo."
            : nl
              ? "Voeg je website-URL toe. Emma slaat deze op als context — er wordt geen echte crawl uitgevoerd."
              : "Add your website URL. Emma saves it as context — no real website crawl is performed."}
        </p>
      </div>

      <div className="px-7 py-6">
        {phase === "success" ? (
          <p className="text-[14px] font-semibold text-[var(--pg-v13-success)]" data-testid="website-modal-success">
            {nl ? "Website toegevoegd" : "Website added"}
          </p>
        ) : (
          <>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Website-URL" : "Website URL"}
              </span>
              <input
                type="url"
                className="pg-v13-input mt-2 w-full"
                placeholder="https://peergent.com"
                value={url}
                disabled={busy}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => setTouched(true)}
                data-testid="campaign-website-url-input"
              />
            </label>
            {showError ? (
              <p className="mt-2 text-[12px] text-[var(--pg-v13-attention)]" data-testid="website-modal-error">
                {errorMessage ??
                  (nl ? "Voer een geldige URL in (bijv. peergent.com)." : "Enter a valid URL (e.g. peergent.com).")}
              </p>
            ) : null}
            {busy ? (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-[var(--pg-v13-ink-soft)]" data-testid="website-modal-saving">
                <span
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--pg-v13-blue)] border-t-transparent"
                  aria-hidden
                />
                {nl ? "Website opslaan…" : "Saving website…"}
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
            disabled={!valid || busy}
            data-testid="campaign-website-analyse"
          >
            {nl ? "Analyseer" : "Analyse"}
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
    </PgVisionModal>
  );
}
