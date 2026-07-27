"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { CampaignExecutionPlanViewModel } from "@/lib/peer-experience/marketing/campaign-planning/campaign-execution-plan-view-model";
import type { CampaignExecutionWorkspaceResult } from "@/lib/peer-experience/marketing/campaign-execution";
import type { MarketingProjectOrigin } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  buildCampaignStartActionViewModel,
  presentCampaignStartFeedback,
  type CampaignStartFeedback,
} from "../lib/campaign-start-action-presenter";
import MwModal from "./MwModal";

export type CampaignStartCampaignActionProps = {
  projectId: string;
  campaignsEnabled: boolean;
  projectOrigin?: MarketingProjectOrigin;
  workUnits: readonly WorkUnit[];
  executionPlan?: CampaignExecutionPlanViewModel | null;
  approvalModeLabel?: string;
  onStartCampaignExecution: (projectId: string) => Promise<CampaignExecutionWorkspaceResult>;
  buttonLabel?: string;
  className?: string;
};

export default function CampaignStartCampaignAction({
  projectId,
  campaignsEnabled,
  projectOrigin,
  workUnits,
  executionPlan,
  approvalModeLabel,
  onStartCampaignExecution,
  buttonLabel: buttonLabelOverride,
  className,
}: CampaignStartCampaignActionProps) {
  const feedbackId = useId();
  const pendingRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [feedback, setFeedback] = useState<CampaignStartFeedback | null>(null);

  const viewModel = buildCampaignStartActionViewModel({
    campaignsEnabled,
    projectOrigin,
    projectId,
    workUnits,
    executionPlan,
    pending,
    sessionStarted,
  });

  const handleConfirmStart = useCallback(async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setFeedback(null);
    try {
      const result = await onStartCampaignExecution(projectId);
      const nextFeedback = presentCampaignStartFeedback(result);
      if (result.status === "started" || result.status === "partially_started") {
        setFeedback(nextFeedback);
      } else if (result.status === "already_started") {
        setFeedback(null);
      } else {
        setFeedback(nextFeedback);
      }
      if (nextFeedback.marksStarted) {
        setSessionStarted(true);
      }
      setConfirmOpen(false);
    } catch {
      setFeedback({
        tone: "error",
        message: "Campaign could not be started. Try again.",
        marksStarted: false,
      });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [onStartCampaignExecution, projectId]);

  if (!viewModel.showAction) {
    return null;
  }

  const feedbackClass =
    feedback?.tone === "success"
      ? "mw-campaign-start-feedback mw-campaign-start-feedback--success"
      : feedback?.tone === "info"
        ? "mw-campaign-start-feedback mw-campaign-start-feedback--info"
        : feedback?.tone === "warning"
          ? "mw-campaign-start-feedback mw-campaign-start-feedback--warning"
          : "mw-campaign-start-feedback mw-campaign-start-feedback--error";

  return (
    <div className={`mw-campaign-start${className ? ` ${className}` : ""}`} data-testid="mw-campaign-start-action">
      <button
        type="button"
        className="mw-btn-primary pg-focus-premium"
        disabled={viewModel.buttonDisabled}
        aria-disabled={viewModel.buttonDisabled}
        onClick={() => {
          if (viewModel.buttonDisabled || viewModel.kind !== "ready") return;
          setConfirmOpen(true);
        }}
        data-testid="mw-campaign-start-button"
      >
        {buttonLabelOverride ?? viewModel.buttonLabel}
      </button>

      {viewModel.helperText ? (
        <p className="mw-kn-helper" style={{ marginTop: 8 }}>
          {viewModel.helperText}
        </p>
      ) : null}

      {feedback ? (
        <p
          id={feedbackId}
          className={feedbackClass}
          role="status"
          aria-live="polite"
          data-testid="mw-campaign-start-feedback"
        >
          {feedback.message}
        </p>
      ) : null}

      <MwModal
        open={confirmOpen}
        onClose={() => {
          if (pending) return;
          setConfirmOpen(false);
        }}
        title="Start campaign?"
        subtitle="Peergent will create campaign work items for your team."
        closeOnEscape={!pending}
        closeOnOverlayClick={!pending}
      >
        <div className="mw-modal-body">
          <ul className="mw-campaign-meta" style={{ marginBottom: 16 }}>
            <li>Work items will be added to this campaign.</li>
            <li>Nothing will be published automatically.</li>
            <li>
              Approval settings remain active
              {approvalModeLabel ? `: ${approvalModeLabel}` : "."}
            </li>
          </ul>
          <div className="mw-modal-actions">
            <button
              type="button"
              className="mw-modal-secondary pg-focus-premium"
              disabled={pending}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mw-btn-primary pg-focus-premium"
              disabled={pending}
              data-testid="mw-campaign-start-confirm"
              onClick={() => void handleConfirmStart()}
            >
              {pending ? "Starting campaign…" : "Start campaign"}
            </button>
          </div>
        </div>
      </MwModal>
    </div>
  );
}
