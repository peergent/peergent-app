"use client";

import PgVisionModal from "@/components/design-system/PgVisionModal";
import {
  evidencePrimaryActionLabel,
  evidenceSuccessMessage,
} from "@/lib/office/campaign/campaign-workflow-status";
import type { CampaignExecutionMode, CampaignWorkflowStep } from "@/lib/office/campaign/workflow-types";
import { evidenceApprovalRequired } from "@/lib/office/deliverable/deliverable-cta-labels";

export type EvidenceModalPhase = "idle" | "processing" | "success" | "error";

export type CampaignEvidenceModalProps = {
  open: boolean;
  onClose: () => void;
  step: CampaignWorkflowStep | null;
  locale?: string | null;
  executionMode?: CampaignExecutionMode;
  phase?: EvidenceModalPhase;
  errorMessage?: string | null;
  onPrimaryAction?: () => void;
  onRequestChanges?: () => void;
  onReject?: () => void;
};

export default function CampaignEvidenceModal({
  open,
  onClose,
  step,
  locale,
  executionMode = "semi_automatic",
  phase = "idle",
  errorMessage,
  onPrimaryAction,
  onRequestChanges,
  onReject,
}: CampaignEvidenceModalProps) {
  const nl = locale === "nl";
  if (!step) return null;

  const requiresApproval = evidenceApprovalRequired(step.id, executionMode);
  const isReviewGate = step.state === "active" && requiresApproval;
  const isContinueGate = step.state === "active" && !requiresApproval;
  const busy = phase === "processing";
  const succeeded = phase === "success";
  const failed = phase === "error";

  const primaryLabel = evidencePrimaryActionLabel(step.id, executionMode, nl);
  const successLabel = evidenceSuccessMessage(step.id, nl);

  return (
    <PgVisionModal
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="workspace"
      testId="campaign-evidence-modal"
    >
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Waarom Emma dit concludeerde" : "Why Emma reached this conclusion"}
            </p>
            <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
              {step.evidenceTitle}
            </h3>
          </div>
          {!busy ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] text-[var(--pg-v13-ink-soft)]"
              aria-label={nl ? "Sluiten" : "Close"}
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-[50vh] overflow-y-auto px-7 py-6">
        {succeeded ? (
          <div
            className="flex items-center gap-3 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4"
            data-testid="evidence-success-state"
          >
            <span className="text-[20px] text-[var(--pg-v13-success)]" aria-hidden>
              ✓
            </span>
            <p className="text-[14px] font-semibold text-[var(--pg-v13-ink)]">{successLabel}</p>
          </div>
        ) : null}

        {failed && errorMessage ? (
          <div
            className="mb-4 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-attention)] bg-[var(--pg-v13-panel)] px-4 py-3 text-[13px] text-[var(--pg-v13-attention)]"
            data-testid="evidence-error-state"
          >
            {errorMessage}
          </div>
        ) : null}

        {!succeeded ? (
          <>
            {step.evidenceIntro ? (
              <div
                className="mb-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4"
                data-testid="campaign-evidence-intro"
              >
                <p className="text-[14px] leading-relaxed text-[var(--pg-v13-ink)]">{step.evidenceIntro}</p>
              </div>
            ) : null}
            {step.evidenceSections.map((section) => (
              <section key={section.id} className="mb-5 last:mb-0">
                <p className="pg-v13-mono mb-2 text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                  {section.title}
                </p>
                <ul className="m-0 list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
                  {section.items.map((item) => (
                    <li key={item} className="break-words">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        {busy ? (
          <p className="flex items-center gap-2 text-[13px] text-[var(--pg-v13-ink-soft)]" data-testid="evidence-processing">
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--pg-v13-blue)] border-t-transparent"
              aria-hidden
            />
            {nl ? "Emma verwerkt je keuze…" : "Emma is processing your choice…"}
          </p>
        ) : null}

        {!busy && !succeeded && (isReviewGate || isContinueGate) && onPrimaryAction ? (
          <button
            type="button"
            className="pg-v13-btn"
            onClick={onPrimaryAction}
            data-testid="evidence-primary-action"
          >
            {primaryLabel}
          </button>
        ) : null}

        {!busy && !succeeded && isReviewGate && onRequestChanges ? (
          <button
            type="button"
            className="pg-v13-btn pg-v13-btn--ghost"
            onClick={onRequestChanges}
            data-testid="evidence-request-changes"
          >
            {nl ? "Wijzigingen vragen" : "Request changes"}
          </button>
        ) : null}

        {!busy && !succeeded && isReviewGate && onReject ? (
          <button
            type="button"
            className="border-none bg-transparent py-1 text-[13px] font-semibold text-[var(--pg-v13-attention)]"
            onClick={onReject}
            data-testid="evidence-reject"
          >
            {nl ? "Afwijzen" : "Reject"}
          </button>
        ) : null}

        {!busy && !succeeded ? (
          <button type="button" className="pg-v13-btn pg-v13-btn--ghost ml-auto" onClick={onClose}>
            {nl ? "Sluiten" : "Close"}
          </button>
        ) : null}
      </div>
    </PgVisionModal>
  );
}

export const EVIDENCE_NEXT_STEP = {
  strategy_determined: "channels_selected",
  channels_selected: "deliverables_created",
  deliverables_created: "waiting_for_approval",
} as const;
