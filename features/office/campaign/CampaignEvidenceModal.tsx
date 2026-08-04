"use client";

import PgVisionModal from "@/components/design-system/PgVisionModal";
import {
  evidencePrimaryActionLabel,
  evidenceSuccessMessage,
} from "@/lib/office/campaign/campaign-workflow-status";
import type { CampaignExecutionMode, CampaignWorkflowStep } from "@/lib/office/campaign/workflow-types";
import { evidenceApprovalRequired } from "@/lib/office/deliverable/deliverable-cta-labels";
import { isInformationalWorkflowStep } from "@/lib/office/campaign/campaign-orchestration-types";
import type { BrainDevDiagnostics } from "@/lib/brain/integration/brain-dev-diagnostics";
import { isBrainDevDiagnosticsEnabled } from "@/lib/brain/integration/brain-dev-diagnostics";
import type { EvidenceMissingAction } from "@/lib/office/campaign/evidence-readiness";
import { evidenceItemKey } from "@/lib/brain/presentation/dedupe-evidence-items";

export type EvidenceModalPhase = "idle" | "loading" | "processing" | "success" | "error";

export type CampaignEvidenceModalProps = {
  open: boolean;
  onClose: () => void;
  step: CampaignWorkflowStep | null;
  locale?: string | null;
  executionMode?: CampaignExecutionMode;
  phase?: EvidenceModalPhase;
  progressLabel?: string | null;
  devDiagnostics?: BrainDevDiagnostics | null;
  errorMessage?: string | null;
  onPrimaryAction?: () => void;
  onMissingAction?: (action: EvidenceMissingAction) => void;
  onRequestChanges?: () => void;
  onReject?: () => void;
};

function BrainDevDiagnosticsPanel({
  diagnostics,
  nl,
}: {
  diagnostics: BrainDevDiagnostics;
  nl: boolean;
}) {
  if (!isBrainDevDiagnosticsEnabled()) return null;

  const rows = [
    [nl ? "Provider" : "Provider", diagnostics.finalProvider ?? diagnostics.provider],
    [nl ? "Initiële provider" : "Initial provider", diagnostics.initialProvider ?? "—"],
    [nl ? "Model" : "Model", diagnostics.model],
    [
      nl ? "Tokens" : "Tokens",
      `${diagnostics.inputTokens} in / ${diagnostics.outputTokens} out`,
    ],
    [
      nl ? "Latency" : "Latency",
      diagnostics.latencyMs != null ? `${diagnostics.latencyMs} ms` : "—",
    ],
    [
      nl ? "Fallback gebruikt" : "Fallback used",
      diagnostics.fallbackUsed ? (nl ? "ja" : "yes") : (nl ? "nee" : "no"),
    ],
    ...(diagnostics.fallbackUsed
      ? [[nl ? "Fallback reden" : "Fallback reason", diagnostics.failureCategory ?? diagnostics.fallbackReason ?? "unknown_provider_error"] as const]
      : []),
    [nl ? "LLM geregistreerd" : "LLM registered", diagnostics.llmRegistered == null ? "—" : diagnostics.llmRegistered ? (nl ? "ja" : "yes") : (nl ? "nee" : "no")],
    [nl ? "Feature flag" : "Feature flag", diagnostics.featureFlagEnabled == null ? "—" : diagnostics.featureFlagEnabled ? (nl ? "aan" : "on") : (nl ? "uit" : "off")],
    [nl ? "Key aanwezig" : "Key present", diagnostics.apiKeyPresent == null ? "—" : diagnostics.apiKeyPresent ? (nl ? "ja" : "yes") : (nl ? "nee" : "no")],
    [nl ? "Request gestart" : "Request started", diagnostics.requestStarted == null ? "—" : diagnostics.requestStarted ? (nl ? "ja" : "yes") : (nl ? "nee" : "no")],
    [
      nl ? "Validatie-retries" : "Validation retries",
      diagnostics.validationRetries != null ? String(diagnostics.validationRetries) : "—",
    ],
    [
      nl ? "Upstream strategie" : "Upstream strategy found",
      diagnostics.upstreamStrategyFound == null
        ? "—"
        : diagnostics.upstreamStrategyFound
          ? nl
            ? "ja"
            : "yes"
          : nl
            ? "nee"
            : "no",
    ],
    [
      nl ? "Upstream kanalen" : "Upstream channels found",
      diagnostics.upstreamChannelsFound == null
        ? "—"
        : diagnostics.upstreamChannelsFound
          ? nl
            ? "ja"
            : "yes"
          : nl
            ? "nee"
            : "no",
    ],
    [
      nl ? "Strategieversie ok" : "Strategy version compatible",
      diagnostics.strategyVersionCompatible == null
        ? "—"
        : diagnostics.strategyVersionCompatible
          ? nl
            ? "ja"
            : "yes"
          : nl
            ? "nee"
            : "no",
    ],
    [
      nl ? "Kanaalversie ok" : "Channel version compatible",
      diagnostics.channelVersionCompatible == null
        ? "—"
        : diagnostics.channelVersionCompatible
          ? nl
            ? "ja"
            : "yes"
          : nl
            ? "nee"
            : "no",
    ],
    [
      nl ? "Geselecteerde kanalen" : "Selected channel count",
      diagnostics.selectedChannelCount != null ? String(diagnostics.selectedChannelCount) : "—",
    ],
    [
      nl ? "Business validatie" : "Business validation",
      diagnostics.businessValidationSubreason ??
        diagnostics.businessValidationResult ??
        (diagnostics.fallbackUsed ? diagnostics.failureCategory : "ok"),
    ],
    [
      nl ? "Goedgekeurde kanalen" : "Approved canonical channels",
      diagnostics.approvedCanonicalChannels ?? "—",
    ],
    [
      nl ? "Gegenereerde kanalen" : "Generated canonical channels",
      diagnostics.generatedCanonicalChannels ?? "—",
    ],
    [
      nl ? "Niet-matchende kanalen" : "Unmatched channels",
      diagnostics.unmatchedChannels && diagnostics.unmatchedChannels.length > 0
        ? diagnostics.unmatchedChannels
        : diagnostics.unmatchedChannels === ""
          ? nl
            ? "geen"
            : "none"
          : "—",
    ],
    [
      nl ? "Repair-retries" : "Repair retries",
      diagnostics.validationRepairCount != null ? String(diagnostics.validationRepairCount) : "—",
    ],
    [
      nl ? "Initiële requestduur" : "Initial request duration",
      diagnostics.initialRequestDurationMs != null ? `${diagnostics.initialRequestDurationMs} ms` : "—",
    ],
    [
      nl ? "Timeout eigenaar" : "Timeout owner",
      diagnostics.timeoutOwner ?? "—",
    ],
    [
      nl ? "Geconfigureerde timeout" : "Configured timeout",
      diagnostics.configuredTimeoutMs != null ? `${diagnostics.configuredTimeoutMs} ms` : "—",
    ],
    [
      nl ? "Timeout poging" : "Timeout attempt",
      diagnostics.timeoutAttemptNumber != null ? String(diagnostics.timeoutAttemptNumber) : "—",
    ],
    [
      nl ? "Response headers ontvangen" : "Response headers received",
      diagnostics.responseHeadersReceived == null
        ? "—"
        : diagnostics.responseHeadersReceived
          ? nl
            ? "ja"
            : "yes"
          : nl
            ? "nee"
            : "no",
    ],
    [
      nl ? "Response body gestart" : "Response body started",
      diagnostics.responseBodyStarted == null
        ? "—"
        : diagnostics.responseBodyStarted
          ? nl
            ? "ja"
            : "yes"
          : nl
            ? "nee"
            : "no",
    ],
  ];

  return (
    <div
      className="mb-4 rounded-[var(--pg-radius-md)] border border-dashed border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3 font-mono text-[11px] text-[var(--pg-v13-ink-faint)]"
      data-testid="brain-dev-diagnostics"
    >
      <p className="mb-2 text-[10px] uppercase tracking-[0.06em]">
        {nl ? "Brain diagnostics (dev)" : "Brain diagnostics (dev)"}
      </p>
      <dl className="m-0 grid gap-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="min-w-[7rem]">{label}:</dt>
            <dd className="m-0 text-[var(--pg-v13-ink-soft)]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function CampaignEvidenceModal({
  open,
  onClose,
  step,
  locale,
  executionMode = "semi_automatic",
  phase = "idle",
  progressLabel,
  devDiagnostics,
  errorMessage,
  onPrimaryAction,
  onMissingAction,
  onRequestChanges,
  onReject,
}: CampaignEvidenceModalProps) {
  const nl = locale === "nl";
  if (!step) return null;

  const blocked = Boolean(step.evidenceBlocked);
  const informational = isInformationalWorkflowStep(step.id);
  const requiresApproval =
    evidenceApprovalRequired(step.id, executionMode) && !blocked && !informational;
  const isReviewGate = step.state === "active" && requiresApproval && !blocked;
  const isContinueGate =
    step.state === "active" && !requiresApproval && !blocked && !informational;
  const loading = phase === "loading";
  const busy = phase === "processing" || loading;
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
        {loading ? (
          <div
            className="flex flex-col gap-3 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-5"
            data-testid="evidence-loading-state"
          >
            <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--pg-v13-ink)]">
              <span
                className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--pg-v13-blue)] border-t-transparent"
                aria-hidden
              />
              {progressLabel ?? (nl ? "Emma werkt…" : "Emma is working…")}
            </p>
            <p className="text-[13px] text-[var(--pg-v13-ink-soft)]">
              {nl
                ? "Emma doorloopt de stappen op basis van je campagnecontext."
                : "Emma is working through the steps based on your campaign context."}
            </p>
          </div>
        ) : null}

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

        {!succeeded && !loading ? (
          <>
            {devDiagnostics ? <BrainDevDiagnosticsPanel diagnostics={devDiagnostics} nl={nl} /> : null}
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
                  {section.items.map((item, index) => (
                    <li key={evidenceItemKey(section.id, index)} className="break-words">
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
        {phase === "processing" ? (
          <p className="flex items-center gap-2 text-[13px] text-[var(--pg-v13-ink-soft)]" data-testid="evidence-processing">
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--pg-v13-blue)] border-t-transparent"
              aria-hidden
            />
            {nl ? "Emma verwerkt je keuze…" : "Emma is processing your choice…"}
          </p>
        ) : null}

        {!busy && !succeeded && blocked && step.evidenceMissingCtas?.length ? (
          <div className="flex flex-wrap gap-2">
            {step.evidenceMissingCtas.map((cta) => (
              <button
                key={cta.action}
                type="button"
                className={cta.primary ? "pg-v13-btn" : "pg-v13-btn pg-v13-btn--ghost"}
                onClick={() => onMissingAction?.(cta.action)}
                data-testid={`evidence-missing-${cta.action}`}
              >
                {cta.label}
              </button>
            ))}
          </div>
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
  business_analyzed: "website_analyzed",
  strategy_determined: "channels_selected",
  channels_selected: "deliverables_created",
  deliverables_created: "waiting_for_approval",
} as const;
