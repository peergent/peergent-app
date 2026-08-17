"use client";

import PgVisionModal from "@/components/design-system/PgVisionModal";
import type { CampaignApprovalPackage } from "@/lib/brain/approval/campaign-approval-package-types";

export type CampaignApprovalReviewModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  package: CampaignApprovalPackage | null;
  loading?: boolean;
  error?: string | null;
  phase?: "idle" | "processing" | "success" | "error";
  onApprove?: () => void;
  onRequestChanges?: () => void;
};

export default function CampaignApprovalReviewModal({
  open,
  onClose,
  locale,
  package: pkg,
  loading,
  error,
  phase = "idle",
  onApprove,
  onRequestChanges,
}: CampaignApprovalReviewModalProps) {
  const nl = locale === "nl";
  const busy = phase === "processing" || loading;
  const succeeded = phase === "success";
  const canApprove = Boolean(pkg?.publicationReady && onApprove && !busy && !succeeded);

  return (
    <PgVisionModal
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="workspace"
      testId="campaign-approval-review-modal"
    >
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Campagnegoedkeuring" : "Campaign approval"}
            </p>
            <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">
              {pkg?.campaign.name ?? (nl ? "Campagnereview" : "Campaign review")}
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

      <div className="max-h-[55vh] overflow-y-auto px-7 py-6">
        {loading ? (
          <p className="text-[14px] text-[var(--pg-v13-ink-soft)]">
            {nl ? "Campagnepakket laden…" : "Loading campaign package…"}
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 text-[13px] text-[var(--pg-v13-attention)]" data-testid="approval-package-error">
            {error}
          </p>
        ) : null}

        {pkg && !loading ? (
          <>
            <section className="mb-6">
              <p className="pg-v13-mono mb-2 text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Campagne" : "Campaign"}
              </p>
              <dl className="m-0 grid gap-2 text-[13.5px] text-[var(--pg-v13-ink-soft)]">
                <div>
                  <dt className="font-semibold text-[var(--pg-v13-ink)]">{nl ? "Doel" : "Objective"}</dt>
                  <dd className="m-0">{pkg.campaign.objective}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--pg-v13-ink)]">{nl ? "Doelgroep" : "Audience"}</dt>
                  <dd className="m-0">{pkg.campaign.audience}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--pg-v13-ink)]">{nl ? "Strategie" : "Strategy"}</dt>
                  <dd className="m-0">{pkg.strategySummary || pkg.campaign.strategicRationale}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--pg-v13-ink)]">{nl ? "Kanalen" : "Channels"}</dt>
                  <dd className="m-0">{pkg.campaign.channels.join(" · ") || "—"}</dd>
                </div>
              </dl>
            </section>

            {!pkg.publicationReady && pkg.blockingIssues.length > 0 ? (
              <section className="mb-6 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-attention)] bg-[var(--pg-v13-panel)] px-4 py-3">
                <p className="mb-2 text-[13px] font-semibold text-[var(--pg-v13-attention)]">
                  {nl ? "Nog niet publicatiegereed" : "Not publication-ready yet"}
                </p>
                <ul className="m-0 list-disc pl-5 text-[13px] text-[var(--pg-v13-ink-soft)]">
                  {pkg.blockingIssues.map((issue) => (
                    <li key={issue.code}>{issue.message}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <p className="pg-v13-mono mb-3 text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                {nl ? "Deliverables" : "Deliverables"}
              </p>
              <div className="flex flex-col gap-4">
                {pkg.deliverables.map((del) => (
                  <article
                    key={del.id}
                    className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4"
                    data-testid={`approval-deliverable-${del.id}`}
                  >
                    <header className="mb-2">
                      <p className="text-[14px] font-bold text-[var(--pg-v13-ink)]">
                        {del.format} · {del.channel}
                      </p>
                      {del.subject ? (
                        <p className="text-[13px] text-[var(--pg-v13-ink-soft)]">
                          {nl ? "Onderwerp" : "Subject"}: {del.subject}
                        </p>
                      ) : null}
                    </header>
                    <pre className="m-0 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
                      {del.body}
                    </pre>
                    <p className="mt-2 text-[12px] text-[var(--pg-v13-ink-faint)]">
                      CTA: {del.cta} · {nl ? "Doelgroep" : "Audience"}: {del.targetAudience}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {succeeded ? (
          <p className="text-[14px] font-semibold text-[var(--pg-v13-success)]">
            {nl ? "Campagne goedgekeurd." : "Campaign approved."}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        {canApprove ? (
          <button
            type="button"
            className="pg-v13-btn"
            onClick={onApprove}
            data-testid="campaign-approval-approve"
          >
            {nl ? "Campagne goedkeuren" : "Approve campaign"}
          </button>
        ) : null}

        {!busy && !succeeded && onRequestChanges ? (
          <button
            type="button"
            className="pg-v13-btn pg-v13-btn--ghost"
            onClick={onRequestChanges}
            data-testid="campaign-approval-request-changes"
          >
            {nl ? "Wijzigingen vragen" : "Request changes"}
          </button>
        ) : null}

        {!busy && !succeeded ? (
          <button type="button" className="pg-v13-btn pg-v13-btn--ghost" onClick={onClose}>
            {nl ? "Sluiten" : "Close"}
          </button>
        ) : null}
      </div>
    </PgVisionModal>
  );
}
