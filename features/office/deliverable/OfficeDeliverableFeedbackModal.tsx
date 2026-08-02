"use client";

import { useId, useState } from "react";
import PgVisionFormModal from "@/components/design-system/PgVisionFormModal";

export type OfficeDeliverableFeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  mode: "changes" | "reject";
  onSubmit: (notes: string) => void;
};

export default function OfficeDeliverableFeedbackModal({
  open,
  onClose,
  locale,
  mode,
  onSubmit,
}: OfficeDeliverableFeedbackModalProps) {
  const nl = locale === "nl";
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaId = useId();

  const handleClose = () => {
    setNotes("");
    setError(null);
    onClose();
  };

  const title =
    mode === "changes"
      ? nl
        ? "Wijzigingen vragen"
        : "Request changes"
      : nl
        ? "Afwijzen"
        : "Reject";

  const subtitle =
    mode === "changes"
      ? nl
        ? "Leg uit welke wijzigingen je wilt zien."
        : "Explain what you would like changed."
      : nl
        ? "Leg uit waarom je dit afwijst."
        : "Explain why you are rejecting this.";

  const placeholder =
    mode === "changes"
      ? nl
        ? "Bijv. kortere intro, andere CTA, andere tone of voice…"
        : "E.g. shorter intro, different CTA, different tone…"
      : nl
        ? "Bijv. past niet bij campagne, verkeerde doelgroep…"
        : "E.g. does not fit the campaign, wrong audience…";

  const handleSubmit = () => {
    const trimmed = notes.trim();
    if (!trimmed) {
      setError(nl ? "Geef feedback om door te gaan." : "Add feedback to continue.");
      return;
    }
    onSubmit(trimmed);
    setNotes("");
    setError(null);
  };

  return (
    <PgVisionFormModal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      testId="deliverable-feedback-modal"
      closeAriaLabel={nl ? "Sluiten" : "Close"}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pg-v13-btn pg-v13-btn--ghost" onClick={handleClose}>
            {nl ? "Annuleren" : "Cancel"}
          </button>
          <button type="button" className="pg-v13-btn" onClick={handleSubmit}>
            {mode === "changes" ? (nl ? "Verstuur" : "Send") : nl ? "Afwijzen" : "Reject"}
          </button>
        </div>
      }
    >
      <label htmlFor={textareaId} className="pg-v13-mono mb-2 block text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
        {nl ? "Feedback" : "Feedback"}
      </label>
      <textarea
        id={textareaId}
        className="pg-v13-form-input min-h-[120px] w-full resize-y"
        rows={5}
        value={notes}
        placeholder={placeholder}
        onChange={(event) => {
          setNotes(event.target.value);
          if (error) setError(null);
        }}
      />
      {error ? (
        <p className="mt-2 text-[13px] font-medium text-[var(--pg-v13-attention)]" role="alert">
          {error}
        </p>
      ) : null}
    </PgVisionFormModal>
  );
}
