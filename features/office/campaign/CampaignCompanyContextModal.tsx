"use client";

import { useCallback, useEffect, useState } from "react";
import PgVisionModal from "@/components/design-system/PgVisionModal";
import type { CampaignCompanyContextInput } from "@/lib/office/campaign/campaign-company-context-validation";
import {
  parseMultilineList,
  validateCampaignCompanyContext,
} from "@/lib/office/campaign/campaign-company-context-validation";

export type CampaignCompanyContextModalPhase =
  | "idle"
  | "validating"
  | "saving"
  | "success"
  | "error";

export type CampaignCompanyContextModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  initialValues?: CampaignCompanyContextInput;
  onSubmit: (context: CampaignCompanyContextInput) => void | Promise<void>;
};

type ModalBodyProps = {
  nl: boolean;
  initialValues?: CampaignCompanyContextInput;
  onClose: () => void;
  onSubmit: (context: CampaignCompanyContextInput) => void | Promise<void>;
  onBusyChange: (busy: boolean) => void;
};

function CampaignCompanyContextModalBody({
  nl,
  initialValues,
  onClose,
  onSubmit,
  onBusyChange,
}: ModalBodyProps) {
  const [brandName, setBrandName] = useState(initialValues?.brandName ?? "");
  const [industry, setIndustry] = useState(initialValues?.industry ?? "");
  const [mission, setMission] = useState(initialValues?.mission ?? "");
  const [positioning, setPositioning] = useState(initialValues?.positioning ?? "");
  const [tone, setTone] = useState(initialValues?.tone ?? "");
  const [targetAudience, setTargetAudience] = useState(initialValues?.targetAudience ?? "");
  const [productsText, setProductsText] = useState(
    initialValues?.productsAndServices?.join("\n") ?? ""
  );
  const [uspsText, setUspsText] = useState(initialValues?.uniqueSellingPoints?.join("\n") ?? "");
  const [brandNameError, setBrandNameError] = useState<string | null>(null);
  const [industryError, setIndustryError] = useState<string | null>(null);
  const [targetAudienceError, setTargetAudienceError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [uspError, setUspError] = useState<string | null>(null);
  const [phase, setPhase] = useState<CampaignCompanyContextModalPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const busy = phase === "validating" || phase === "saving";

  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);

  const handleSubmit = useCallback(async () => {
    setErrorMessage(null);
    setBrandNameError(null);
    setIndustryError(null);
    setTargetAudienceError(null);
    setProductsError(null);
    setUspError(null);
    setPhase("validating");

    const payload: CampaignCompanyContextInput = {
      brandName,
      industry,
      mission,
      positioning,
      tone,
      targetAudience,
      productsAndServices: parseMultilineList(productsText),
      uniqueSellingPoints: parseMultilineList(uspsText),
    };

    const validation = validateCampaignCompanyContext(payload, nl);
    if (!validation.valid) {
      setBrandNameError(validation.brandNameError ?? null);
      setIndustryError(validation.industryError ?? null);
      setTargetAudienceError(validation.targetAudienceError ?? null);
      setProductsError(validation.productsError ?? null);
      setUspError(validation.uspError ?? null);
      setPhase("error");
      return;
    }

    setPhase("saving");
    try {
      await onSubmit(payload);
      setPhase("success");
    } catch (error) {
      setPhase("error");
      const message =
        error instanceof Error && error.message && error.message !== "Error"
          ? error.message
          : nl
            ? "Bedrijfsinformatie kon niet worden opgeslagen. Probeer het opnieuw."
            : "Could not save company information. Please try again.";
      setErrorMessage(message);
    }
  }, [
    brandName,
    industry,
    mission,
    nl,
    onSubmit,
    positioning,
    productsText,
    targetAudience,
    tone,
    uspsText,
  ]);

  return (
    <>
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">Emma</p>
        <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
          {nl ? "Bedrijfsinformatie aanvullen" : "Add company information"}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
          {nl
            ? "Vul de context aan voor het merk of bedrijf van deze campagne. Dit is apart van je accountorganisatie."
            : "Add context for the brand or company in this campaign. This is separate from your account organization."}
        </p>
      </div>

      <div className="max-h-[50vh] space-y-4 overflow-y-auto px-7 py-6">
        {phase === "success" ? (
          <p className="text-[14px] font-semibold text-[var(--pg-v13-success)]" data-testid="company-context-success">
            {nl ? "Bedrijfsinformatie opgeslagen" : "Company information saved"}
          </p>
        ) : (
          <>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Bedrijfsnaam / merk" : "Company / brand name"} *
              </span>
              <input
                className="pg-v13-input mt-1 w-full"
                value={brandName}
                disabled={busy}
                onChange={(e) => setBrandName(e.target.value)}
                data-testid="company-context-brand-name"
              />
              {brandNameError ? (
                <p className="mt-1 text-[12px] text-[var(--pg-v13-attention)]">{brandNameError}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Branche" : "Industry"} *
              </span>
              <input className="pg-v13-input mt-1 w-full" value={industry} disabled={busy} onChange={(e) => setIndustry(e.target.value)} data-testid="company-context-industry" />
              {industryError ? (
                <p className="mt-1 text-[12px] text-[var(--pg-v13-attention)]">{industryError}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Missie" : "Mission"}
              </span>
              <textarea className="pg-v13-input mt-1 w-full min-h-[72px]" value={mission} disabled={busy} onChange={(e) => setMission(e.target.value)} />
            </label>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Producten en diensten" : "Products and services"} *
              </span>
              <textarea
                className="pg-v13-input mt-1 w-full min-h-[72px]"
                value={productsText}
                disabled={busy}
                onChange={(e) => setProductsText(e.target.value)}
                placeholder={nl ? "Één per regel" : "One per line"}
                data-testid="company-context-products"
              />
              {productsError ? (
                <p className="mt-1 text-[12px] text-[var(--pg-v13-attention)]">{productsError}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Unieke voordelen" : "Unique selling points"} *
              </span>
              <textarea
                className="pg-v13-input mt-1 w-full min-h-[72px]"
                value={uspsText}
                disabled={busy}
                onChange={(e) => setUspsText(e.target.value)}
                placeholder={nl ? "Één per regel" : "One per line"}
                data-testid="company-context-usps"
              />
              {uspError ? (
                <p className="mt-1 text-[12px] text-[var(--pg-v13-attention)]">{uspError}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Doelgroep" : "Target audience"} *
              </span>
              <input className="pg-v13-input mt-1 w-full" value={targetAudience} disabled={busy} onChange={(e) => setTargetAudience(e.target.value)} data-testid="company-context-target-audience" />
              {targetAudienceError ? (
                <p className="mt-1 text-[12px] text-[var(--pg-v13-attention)]">{targetAudienceError}</p>
              ) : null}
            </label>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Positionering" : "Positioning"}
              </span>
              <textarea className="pg-v13-input mt-1 w-full min-h-[72px]" value={positioning} disabled={busy} onChange={(e) => setPositioning(e.target.value)} />
            </label>
            <label className="block">
              <span className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Tone of voice" : "Tone of voice"}
              </span>
              <input className="pg-v13-input mt-1 w-full" value={tone} disabled={busy} onChange={(e) => setTone(e.target.value)} />
            </label>
            {errorMessage ? (
              <p className="text-[12px] text-[var(--pg-v13-attention)]" data-testid="company-context-error">
                {errorMessage}
              </p>
            ) : null}
            {busy ? (
              <p className="flex items-center gap-2 text-[13px] text-[var(--pg-v13-ink-soft)]" data-testid="company-context-saving">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--pg-v13-blue)] border-t-transparent" aria-hidden />
                {nl ? "Bedrijfsinformatie opslaan…" : "Saving company information…"}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        {phase !== "success" ? (
          <button type="button" className="pg-v13-btn" onClick={() => void handleSubmit()} disabled={busy} data-testid="company-context-submit">
            {busy
              ? nl
                ? "Opslaan…"
                : "Saving…"
              : nl
                ? "Opslaan"
                : "Save"}
          </button>
        ) : null}
        <button type="button" className="pg-v13-btn pg-v13-btn--ghost ml-auto" onClick={onClose} disabled={busy}>
          {phase === "success" ? (nl ? "Sluiten" : "Close") : nl ? "Annuleren" : "Cancel"}
        </button>
      </div>
    </>
  );
}

export default function CampaignCompanyContextModal({
  open,
  onClose,
  locale,
  initialValues,
  onSubmit,
}: CampaignCompanyContextModalProps) {
  const nl = locale === "nl";
  const [busy, setBusy] = useState(false);

  return (
    <PgVisionModal open={open} onClose={busy ? () => undefined : onClose} size="preview" testId="campaign-company-context-modal">
      {open ? (
        <CampaignCompanyContextModalBody
          key={`company-context-${initialValues?.brandName ?? "new"}`}
          nl={nl}
          initialValues={initialValues}
          onClose={onClose}
          onSubmit={onSubmit}
          onBusyChange={setBusy}
        />
      ) : null}
    </PgVisionModal>
  );
}
