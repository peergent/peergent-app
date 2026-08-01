"use client";

import Link from "next/link";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review";
import type {
  CampaignReviewFeedback,
  CampaignReviewRejectionReason,
} from "@/lib/peer-experience/marketing/campaign-review-decisions";
import { getCampaignReviewItemHref, getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import MarketingVisionModal from "./MarketingVisionModal";
import type { CampaignReviewWorkspaceHandlers } from "../lib/campaign-review-handlers";
import {
  approveModalTitleForItem,
  approvePrimaryButtonLabel,
  CUSTOMER_REJECTION_OPTIONS,
  customerFeedbackOptionsForArtifact,
} from "../lib/campaign-review-feedback-ui";

import { getV17ReviewModalCopy } from "@/lib/i18n/v17-review-modal-copy";

export type CampaignReviewActionsProps = {
  peerId: string;
  projectId: string;
  item: CampaignReviewItem;
  copy: MarketingCampaignCopy;
  approvalMode?: CampaignApprovalMode;
  remainingQueueCount: number;
  nextInQueueItemId?: string | null;
  reviewHandlers: CampaignReviewWorkspaceHandlers;
  presentation?: "default" | "v17";
  localePreference?: string | null;
};

function chipKey(id: string, label: string): string {
  return `${id}::${label}`;
}

function messageFromSelectedLabels(labels: readonly string[]): string {
  if (labels.length === 0) return "";
  return labels.map((label) => `• ${label}`).join("\n");
}

export default function CampaignReviewActions({
  peerId,
  projectId,
  item,
  copy,
  approvalMode,
  remainingQueueCount,
  nextInQueueItemId,
  reviewHandlers,
  presentation = "default",
  localePreference,
}: CampaignReviewActionsProps) {
  const isV17 = presentation === "v17";
  const modalCopy = getV17ReviewModalCopy(localePreference);
  const router = useRouter();
  const feedbackId = useId();
  const approveTriggerRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chipOptions = useMemo(
    () => customerFeedbackOptionsForArtifact(item.artifactType),
    [item.artifactType]
  );

  const [selectedChipKeys, setSelectedChipKeys] = useState<string[]>([]);
  const [changeMessage, setChangeMessage] = useState("");
  const [changeError, setChangeError] = useState<string | null>(null);

  const [rejectReason, setRejectReason] = useState<CampaignReviewRejectionReason | "">("");
  const [rejectMessage, setRejectMessage] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const showOptionalApproval = approvalMode === "no_approval_required";
  const canReviewNow = item.inReviewQueue || item.decisionStatus === "awaiting_review";

  const statusLine =
    item.decisionStatus === "awaiting_review" || item.inReviewQueue
      ? copy.readyForYourReview
      : item.decisionStatus === "approved"
        ? copy.approvedStatus
        : item.decisionStatusLabel;

  const remainingLine =
    remainingQueueCount > 0 ? copy.itemsRemaining(remainingQueueCount) : null;

  const closeChanges = useCallback(() => {
    if (pending) return;
    setChangesOpen(false);
    setChangeError(null);
    approveTriggerRef.current?.focus();
  }, [pending]);

  const navigateAfterDecision = useCallback(() => {
    if (nextInQueueItemId) {
      router.push(getCampaignReviewItemHref(peerId, projectId, nextInQueueItemId));
      return;
    }
    router.push(`${getProjectHref(peerId, projectId)}?campaignReviewComplete=1`);
  }, [nextInQueueItemId, peerId, projectId, router]);

  const runApprove = useCallback(async () => {
    const onApprove = reviewHandlers.handleApproveCampaignReviewItem;
    if (typeof onApprove !== "function") {
      setErrorMessage("Review actions are unavailable. Refresh and try again.");
      return;
    }
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setErrorMessage(null);
    try {
      const autoContinue = approvalMode === "approval_before_generation";
      const result = await onApprove({
        projectId,
        workUnitId: item.workUnitId,
        autoContinue,
      });
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }
      setStatusMessage(
        autoContinue && result.campaignCanContinue
          ? "Approved. Marketing Peer is continuing your campaign…"
          : result.message
      );
      setApproveOpen(false);
      if (result.status === "approved" || result.status === "already_decided") {
        navigateAfterDecision();
      }
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [
    approvalMode,
    item.workUnitId,
    navigateAfterDecision,
    projectId,
    reviewHandlers,
  ]);

  const toggleChip = (key: string) => {
    setSelectedChipKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      const labels = chipOptions
        .filter((opt) => next.includes(chipKey(opt.id, opt.label)))
        .map((opt) => opt.label);
      setChangeMessage(messageFromSelectedLabels(labels));
      return next;
    });
  };

  const submitChanges = () => {
    const onRequestChanges = reviewHandlers.handleRequestCampaignReviewChanges;
    if (typeof onRequestChanges !== "function") {
      setChangeError("Review actions are unavailable. Refresh and try again.");
      return;
    }
    if (pendingRef.current) return;

    const categories = [
      ...new Set(
        chipOptions
          .filter((opt) => selectedChipKeys.includes(chipKey(opt.id, opt.label)))
          .map((opt) => opt.id)
      ),
    ] as NonNullable<CampaignReviewFeedback["categories"]>;

    const message = changeMessage.trim();
    if (categories.length === 0 && !message) {
      setChangeError("Choose at least one suggestion or describe what should change.");
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setChangeError(null);
    const result = onRequestChanges({
      projectId,
      workUnitId: item.workUnitId,
      feedback: {
        categories,
        message: message || undefined,
      },
    });
    pendingRef.current = false;
    setPending(false);
    if (!result.ok) {
      setChangeError(result.message);
      return;
    }
    setStatusMessage(result.message);
    setChangesOpen(false);
    setSelectedChipKeys([]);
    setChangeMessage("");
    approveTriggerRef.current?.focus();
  };

  const submitReject = () => {
    const onReject = reviewHandlers.handleRejectCampaignReviewItem;
    if (typeof onReject !== "function") {
      setRejectError("Review actions are unavailable. Refresh and try again.");
      return;
    }
    if (pendingRef.current) return;
    if (!rejectReason) {
      setRejectError("Choose a reason to continue.");
      return;
    }
    pendingRef.current = true;
    setPending(true);
    setRejectError(null);
    const result = onReject({
      projectId,
      workUnitId: item.workUnitId,
      rejectionReason: rejectReason,
      message: rejectMessage.trim() || undefined,
    });
    pendingRef.current = false;
    setPending(false);
    if (!result.ok) {
      setRejectError(result.message);
      return;
    }
    setStatusMessage(result.message);
    setRejectOpen(false);
    approveTriggerRef.current?.focus();
  };

  const runRevise = useCallback(async () => {
    const onRevise = reviewHandlers.handleReviseCampaignReviewItem;
    if (typeof onRevise !== "function") {
      setErrorMessage("Review actions are unavailable. Refresh and try again.");
      return;
    }
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setErrorMessage(null);
    try {
      const result = await onRevise({ projectId, workUnitId: item.workUnitId });
      setStatusMessage(result.message);
      if (!result.ok) setErrorMessage(result.message);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [item.workUnitId, projectId, reviewHandlers]);

  if (!canReviewNow && !item.canRequestRevision && item.decisionStatus === "approved") {
    return (
      <div className={isV17 ? "v17-review-actions" : "mw-review-actions-sticky"}>
        <p className={isV17 ? "v17-review-actions-status" : "mw-review-status"} role="status">
          {copy.approvedStatus}
        </p>
      </div>
    );
  }

  const toolbar = (
    <>
      {canReviewNow && !showOptionalApproval ? (
        <>
          {isV17 ? (
            <>
              <button
                type="button"
                className="v17-btn v17-btn--ghost pg-focus-premium"
                disabled={pending}
                onClick={() => setChangesOpen(true)}
              >
                {copy.requestChanges}
              </button>
              <button
                type="button"
                className="v17-btn v17-btn--ghost v17-btn--destructive pg-focus-premium"
                disabled={pending}
                onClick={() => setRejectOpen(true)}
              >
                {copy.reject}
              </button>
              <button
                ref={approveTriggerRef}
                type="button"
                className="v17-btn v17-btn--primary pg-focus-premium"
                disabled={pending}
                data-state={pending ? "loading" : undefined}
                onClick={() => setApproveOpen(true)}
              >
                {pending ? "…" : copy.approve}
              </button>
            </>
          ) : (
            <>
              <button
                ref={approveTriggerRef}
                type="button"
                className="mw-btn-primary"
                disabled={pending}
                onClick={() => setApproveOpen(true)}
              >
                {copy.approve}
              </button>
              <button
                type="button"
                className="mw-btn-secondary"
                disabled={pending}
                onClick={() => setChangesOpen(true)}
              >
                {copy.requestChanges}
              </button>
              <button
                type="button"
                className="mw-btn-secondary mw-btn-destructive"
                disabled={pending}
                onClick={() => setRejectOpen(true)}
              >
                {copy.reject}
              </button>
            </>
          )}
        </>
      ) : null}

      {showOptionalApproval && canReviewNow ? (
        <button
          type="button"
          className={isV17 ? "v17-btn v17-btn--ghost pg-focus-premium" : "mw-btn-secondary"}
          disabled={pending}
          onClick={() => setApproveOpen(true)}
        >
          {copy.confirmPreparedWork}
        </button>
      ) : null}

      {item.canRequestRevision ? (
        <button
          type="button"
          className={isV17 ? "v17-btn v17-btn--primary pg-focus-premium" : "mw-btn-primary"}
          disabled={pending}
          onClick={() => void runRevise()}
        >
          {copy.letPeerRevise}
        </button>
      ) : null}

      {item.decisionStatus === "rejected" ? (
        <Link
          href={getProjectHref(peerId, projectId)}
          className={
            isV17 ? "v17-btn v17-btn--ghost pg-focus-premium" : "mw-btn-secondary pg-focus-premium"
          }
        >
          {copy.returnToCampaign}
        </Link>
      ) : null}
    </>
  );

  return (
    <div
      className={isV17 ? "v17-review-actions" : "mw-review-actions-sticky"}
      aria-label="Review actions"
      data-testid={isV17 ? "v17-review-actions" : "mw-review-actions"}
    >
      <div className={isV17 ? "v17-review-actions-inner" : "mw-review-actions-inner mw-glass"}>
        {statusMessage ? (
          <p
            className={isV17 ? "v17-review-feedback v17-review-feedback--success" : "mw-review-status"}
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p
            className={isV17 ? "v17-review-feedback v17-review-feedback--error" : "mw-review-error"}
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className={isV17 ? "v17-review-actions-row" : undefined}>
          <div className={isV17 ? "v17-review-actions-meta" : undefined}>
            <p className={isV17 ? "v17-review-actions-status" : "mw-review-actions-status"}>
              {statusLine}
            </p>
            {remainingLine && canReviewNow ? (
              <p className={isV17 ? "v17-review-actions-remaining" : "mw-review-actions-remaining"}>
                {remainingLine}
              </p>
            ) : null}
            {item.feedbackSummary ? (
              <p
                className={
                  isV17 ? "v17-review-actions-feedback" : "mw-kn-helper mw-review-actions-feedback"
                }
              >
                {item.feedbackSummary}
              </p>
            ) : null}
          </div>

          <div
            className={
              isV17 ? "v17-review-actions-toolbar" : "mw-review-actions-toolbar"
            }
          >
            {toolbar}
          </div>
        </div>
      </div>

      <MarketingVisionModal
        open={approveOpen}
        onClose={() => !pending && setApproveOpen(false)}
        title={
          isV17
            ? modalCopy.approveTitle(item.artifactTypeLabel)
            : approveModalTitleForItem(item.artifactTypeLabel)
        }
        subtitle={
          isV17
            ? `${modalCopy.approveBody} ${modalCopy.approveNote}`
            : "Marketing Peer will continue preparing the next campaign deliverables. You can revisit past decisions from Version History when it is available."
        }
        presentation={isV17 ? "v17" : "default"}
        closeOnEscape={!pending}
        closeAriaLabel={isV17 ? modalCopy.closeAria : "Close"}
      >
        <div className={isV17 ? "pg-v13-form-actions" : "mw-modal-actions"}>
          <button
            type="button"
            className={isV17 ? "pg-v13-btn pg-v13-btn--ghost pg-focus-premium" : "mw-modal-secondary"}
            disabled={pending}
            onClick={() => setApproveOpen(false)}
          >
            {isV17 ? modalCopy.cancel : "Cancel"}
          </button>
          <button
            type="button"
            className={isV17 ? "pg-v13-btn pg-focus-premium" : "mw-btn-primary"}
            disabled={pending}
            onClick={() => void runApprove()}
          >
            {pending
              ? "…"
              : isV17
                ? modalCopy.approveConfirm
                : approvePrimaryButtonLabel(item.artifactTypeLabel)}
          </button>
        </div>
      </MarketingVisionModal>

      <MarketingVisionModal
        open={changesOpen}
        onClose={closeChanges}
        title={isV17 ? modalCopy.requestChangesTitle : "Request changes"}
        subtitle={
          isV17 ? modalCopy.requestChangesSubtitle : "Tell Marketing Peer what you would like changed."
        }
        presentation={isV17 ? "v17" : "default"}
        closeOnEscape={!pending}
        closeAriaLabel={isV17 ? modalCopy.closeAria : "Close"}
      >
        <div className="mw-modal-body">
          <p id={feedbackId} className="mw-modal-label">
            Quick feedback
          </p>
          <div className="mw-review-feedback-chips" role="group" aria-labelledby={feedbackId}>
            {chipOptions.map((opt) => {
              const key = chipKey(opt.id, opt.label);
              const selected = selectedChipKeys.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={selected ? "mw-review-chip is-selected" : "mw-review-chip"}
                  aria-pressed={selected}
                  disabled={pending}
                  onClick={() => toggleChip(key)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <label className="mw-modal-label" htmlFor={`${feedbackId}-message`} style={{ marginTop: 16 }}>
            Tell Marketing Peer what you would like changed
          </label>
          <textarea
            id={`${feedbackId}-message`}
            className="mw-modal-input"
            rows={4}
            value={changeMessage}
            disabled={pending}
            onChange={(e) => setChangeMessage(e.target.value)}
          />
          {changeError ? (
            <p className="mw-review-error" role="alert">
              {changeError}
            </p>
          ) : null}
        </div>
        <div className={isV17 ? "pg-v13-form-actions" : "mw-modal-actions"}>
          <button
            type="button"
            className={isV17 ? "pg-v13-btn pg-v13-btn--ghost pg-focus-premium" : "mw-modal-secondary"}
            disabled={pending}
            onClick={closeChanges}
          >
            {isV17 ? modalCopy.cancel : "Cancel"}
          </button>
          <button
            type="button"
            className={isV17 ? "pg-v13-btn pg-focus-premium" : "mw-btn-primary"}
            disabled={pending}
            onClick={submitChanges}
          >
            {isV17 ? modalCopy.requestChangesSubmit : "Submit feedback"}
          </button>
        </div>
      </MarketingVisionModal>

      <MarketingVisionModal
        open={rejectOpen}
        onClose={() => !pending && setRejectOpen(false)}
        title={isV17 ? modalCopy.rejectTitle : "Reject this item"}
        subtitle={isV17 ? modalCopy.rejectSubtitle : "Rejecting stops campaign progress. Marketing Peer will wait until you manually start a new revision."}
        presentation={isV17 ? "v17" : "default"}
        closeOnEscape={!pending}
        closeAriaLabel={isV17 ? modalCopy.closeAria : "Close"}
      >
        <div className="mw-modal-body">
          <fieldset className="mw-review-reject-reasons">
            <legend className="mw-modal-label">Reason (required)</legend>
            {CUSTOMER_REJECTION_OPTIONS.map((opt) => (
              <label key={opt.id} className="mw-review-reject-option">
                <input
                  type="radio"
                  name="reject-reason"
                  value={opt.id}
                  checked={rejectReason === opt.id}
                  disabled={pending}
                  onChange={() => setRejectReason(opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </fieldset>
          <label className="mw-modal-label" htmlFor={`${feedbackId}-reject-details`} style={{ marginTop: 12 }}>
            Optional details
          </label>
          <textarea
            id={`${feedbackId}-reject-details`}
            className="mw-modal-input"
            rows={3}
            value={rejectMessage}
            disabled={pending}
            onChange={(e) => setRejectMessage(e.target.value)}
          />
          {rejectError ? (
            <p className="mw-review-error" role="alert">
              {rejectError}
            </p>
          ) : null}
        </div>
        <div className={isV17 ? "pg-v13-form-actions" : "mw-modal-actions"}>
          <button
            type="button"
            className={isV17 ? "pg-v13-btn pg-v13-btn--ghost pg-focus-premium" : "mw-modal-secondary"}
            disabled={pending}
            onClick={() => setRejectOpen(false)}
          >
            {isV17 ? modalCopy.cancel : "Cancel"}
          </button>
          <button
            type="button"
            className={isV17 ? "pg-v13-btn pg-focus-premium" : "mw-btn-primary"}
            disabled={pending}
            onClick={submitReject}
          >
            {isV17 ? modalCopy.rejectSubmit : "Reject item"}
          </button>
        </div>
      </MarketingVisionModal>
    </div>
  );
}
