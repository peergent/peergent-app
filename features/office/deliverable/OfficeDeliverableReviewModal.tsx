"use client";

import { useMemo, useState } from "react";
import PgVisionModal from "@/components/design-system/PgVisionModal";
import OfficeDeliverableFeedbackModal from "@/features/office/deliverable/OfficeDeliverableFeedbackModal";
import DeliverableChannelPreview from "@/features/office/deliverable/previews/DeliverableChannelPreview";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { DemoApprovalRecord } from "@/lib/office/demo/demo-campaign-store";
import { deliverablePreviewCtaLabel } from "@/lib/office/deliverable/deliverable-cta-labels";

export type DeliverableReviewModel = {
  draftId: string;
  title: string;
  channelLabel: string;
  channelId?: string;
  body: string;
  objective?: string;
  rationale?: string;
  status: MarketingContentDraft["status"];
  emailFrom?: string;
  emailTo?: string;
  emailSubject?: string;
  emailPreheader?: string;
  emailCta?: string;
  linkedInPostCopy?: string;
  linkedInHashtags?: string;
  linkedInCta?: string;
  googleAdsCampaign?: string;
  googleAdsAdGroup?: string;
  googleAdsBudget?: string;
  googleAdsHeadlines?: string[];
  googleAdsDescriptions?: string[];
  googleAdsKeywords?: string;
  googleAdsTargeting?: string;
  googleAdsPreview?: string;
  landingHero?: string;
  landingSub?: string;
  landingSections?: string[];
  landingCta?: string;
  landingSeoTitle?: string;
  landingSeoDescription?: string;
  campaignTitle?: string;
  approvalHistory?: DemoApprovalRecord[];
};

export type OfficeDeliverableReviewModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  model: DeliverableReviewModel;
  onApprove?: (draftId: string) => void;
  onRequestChanges?: (draftId: string, notes: string) => void;
  onReject?: (draftId: string, notes: string) => void;
  detailHref?: string | null;
  reviewProgress?: string | null;
};

export default function OfficeDeliverableReviewModal({
  open,
  onClose,
  locale,
  model,
  onApprove,
  onRequestChanges,
  onReject,
  detailHref,
  reviewProgress,
}: OfficeDeliverableReviewModalProps) {
  const nl = locale === "nl";
  const channel = model.channelId ?? model.channelLabel.toLowerCase();
  const canReview = model.status === "ready_for_review";
  const [feedbackMode, setFeedbackMode] = useState<"changes" | "reject" | null>(null);

  const historyForDraft = useMemo(
    () => model.approvalHistory?.filter((entry) => entry.draftId === model.draftId) ?? [],
    [model.approvalHistory, model.draftId]
  );

  const detailCtaLabel = deliverablePreviewCtaLabel(channel, nl);

  return (
    <PgVisionModal open={open} onClose={onClose} size="workspace" testId="deliverable-review-modal">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {model.channelLabel}
            </p>
            <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">{model.title}</h3>
            {reviewProgress ? (
              <p className="mt-1 text-[12px] font-semibold text-[var(--pg-v13-blue)]" data-testid="review-progress">
                {reviewProgress}
              </p>
            ) : null}
            {model.campaignTitle ? (
              <p className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">{model.campaignTitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] text-[var(--pg-v13-ink-soft)]"
            aria-label={nl ? "Sluiten" : "Close"}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-7 py-6">
        {model.rationale ? (
          <div className="mb-5 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3">
            <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
              {nl ? "Waarom Emma dit schreef" : "Why Emma wrote this"}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-[var(--pg-v13-ink-soft)]">{model.rationale}</p>
          </div>
        ) : null}

        <DeliverableChannelPreview model={model} locale={locale} companyName={model.campaignTitle} />

        {historyForDraft.length > 0 ? (
          <section className="mb-5">
            <p className="pg-v13-mono mb-2 text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
              {nl ? "Goedkeuringsgeschiedenis" : "Approval history"}
            </p>
            <ul className="m-0 list-none space-y-2 p-0">
              {historyForDraft.map((entry) => (
                <li key={`${entry.at}-${entry.action}`} className="text-[12.5px] text-[var(--pg-v13-ink-soft)]">
                  {entry.action === "approved"
                    ? nl
                      ? "Goedgekeurd"
                      : "Approved"
                    : entry.action === "changes_requested"
                      ? nl
                        ? "Wijzigingen gevraagd"
                        : "Changes requested"
                      : nl
                        ? "Afgewezen"
                        : "Rejected"}{" "}
                  {nl ? "door" : "by"} {entry.by} · {new Date(entry.at).toLocaleString(nl ? "nl-NL" : "en-GB")}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--pg-v13-line-soft)] px-7 py-4">
        {canReview && onApprove ? (
          <button type="button" className="pg-v13-btn w-full" onClick={() => onApprove(model.draftId)}>
            {nl ? "Goedkeuren" : "Approve"}
          </button>
        ) : null}
        {canReview && onRequestChanges ? (
          <button
            type="button"
            className="pg-v13-btn pg-v13-btn--ghost w-full"
            onClick={() => setFeedbackMode("changes")}
          >
            {nl ? "Wijzigingen vragen" : "Request changes"}
          </button>
        ) : null}
        {canReview && onReject ? (
          <button
            type="button"
            className="border-none bg-transparent py-1 text-[13px] font-semibold text-[var(--pg-v13-attention)]"
            onClick={() => setFeedbackMode("reject")}
          >
            {nl ? "Afwijzen" : "Reject"}
          </button>
        ) : null}
        {detailHref ? (
          <a href={detailHref} className="pg-v13-btn pg-v13-btn--ghost w-full text-center no-underline">
            {detailCtaLabel} →
          </a>
        ) : null}
      </div>

      {feedbackMode ? (
        <OfficeDeliverableFeedbackModal
          open
          locale={locale}
          mode={feedbackMode}
          onClose={() => setFeedbackMode(null)}
          onSubmit={(notes) => {
            if (feedbackMode === "changes") {
              onRequestChanges?.(model.draftId, notes);
            } else {
              onReject?.(model.draftId, notes);
            }
            setFeedbackMode(null);
          }}
        />
      ) : null}
    </PgVisionModal>
  );
}
