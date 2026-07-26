"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Mail } from "lucide-react";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  buildEmailCampaignWorkUnitActionViewModel,
  presentMarketingWorkUnitExecutionError,
} from "../lib/campaign-email-work-unit-action-presenter";

export type CampaignEmailWorkUnitActionProps = {
  projectId: string;
  campaignsEnabled: boolean;
  workUnit: WorkUnit;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
  executingWorkUnitId?: string | null;
  onExecuteMarketingWorkUnit: (
    workUnitId: string
  ) => Promise<MarketingWorkUnitExecutionResult>;
};

function EmailCampaignPreviewPanel({ email }: { email: MarketingEmailCampaign }) {
  return (
    <div
      className="mw-email-campaign-preview"
      data-testid="mw-campaign-email-preview"
      style={{ marginTop: 12 }}
    >
      <dl className="mw-campaign-meta" style={{ margin: 0 }}>
        <div style={{ marginBottom: 10 }}>
          <dt className="mw-kn-helper">Subject</dt>
          <dd>{email.subject}</dd>
        </div>
        <div style={{ marginBottom: 10 }}>
          <dt className="mw-kn-helper">Preview text</dt>
          <dd>{email.previewText}</dd>
        </div>
        <div style={{ marginBottom: 10 }}>
          <dt className="mw-kn-helper">Message</dt>
          <dd style={{ whiteSpace: "pre-wrap" }}>{email.body}</dd>
        </div>
        <div style={{ marginBottom: 10 }}>
          <dt className="mw-kn-helper">Call to action</dt>
          <dd>{email.cta}</dd>
        </div>
        {email.secondaryCta?.trim() ? (
          <div style={{ marginBottom: 10 }}>
            <dt className="mw-kn-helper">Secondary call to action</dt>
            <dd>{email.secondaryCta}</dd>
          </div>
        ) : null}
        {email.suggestedSendTiming?.trim() ? (
          <div style={{ marginBottom: 10 }}>
            <dt className="mw-kn-helper">Suggested send timing</dt>
            <dd>{email.suggestedSendTiming}</dd>
          </div>
        ) : null}
        {email.audienceNote?.trim() ? (
          <div>
            <dt className="mw-kn-helper">Audience note</dt>
            <dd>{email.audienceNote}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export default function CampaignEmailWorkUnitAction({
  projectId,
  campaignsEnabled,
  workUnit,
  workUnits,
  strategy,
  creativeBriefByCampaignId,
  emailByWorkUnitId,
  executingWorkUnitId,
  onExecuteMarketingWorkUnit,
}: CampaignEmailWorkUnitActionProps) {
  const feedbackId = useId();
  const pendingRef = useRef(false);
  const [localPending, setLocalPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const viewModel = buildEmailCampaignWorkUnitActionViewModel({
    campaignsEnabled,
    projectId,
    workUnit,
    workUnits,
    strategy,
    creativeBriefByCampaignId,
    emailByWorkUnitId,
    executingWorkUnitId,
    localPending,
  });

  const handleExecute = useCallback(async () => {
    if (!viewModel || pendingRef.current || viewModel.primaryDisabled) {
      return;
    }
    pendingRef.current = true;
    setLocalPending(true);
    setErrorMessage(null);
    try {
      const result = await onExecuteMarketingWorkUnit(viewModel.workUnitId);
      if (!result.ok) {
        setErrorMessage(presentMarketingWorkUnitExecutionError(result));
      }
    } catch {
      setErrorMessage("Marketing Peer could not prepare the email. Please try again.");
    } finally {
      pendingRef.current = false;
      setLocalPending(false);
    }
  }, [onExecuteMarketingWorkUnit, viewModel]);

  if (!viewModel?.show) {
    return null;
  }

  return (
    <div
      className="mw-section mw-glass mw-campaign-email-work-unit"
      style={{ padding: 16, marginBottom: 12 }}
      data-testid="mw-campaign-email-work-unit-action"
    >
      <div className="mw-section-title" style={{ marginBottom: 10 }}>
        <Mail size={15} aria-hidden style={{ marginRight: 6, verticalAlign: "middle" }} />
        Email campaign
      </div>
      <div className="mw-campaign-plan-compact-row">
        <div className="mw-campaign-plan-compact-head">
          <span className="mw-project-status mw-project-status--planning">
            {viewModel.statusLabel}
          </span>
          <span className="mw-approval-title">{viewModel.workItemTitle}</span>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {viewModel.completionLabel ? (
          <p
            className="mw-campaign-start-feedback mw-campaign-start-feedback--success"
            role="status"
            data-testid="mw-campaign-email-complete"
          >
            {viewModel.completionLabel}
          </p>
        ) : viewModel.blockedReason ? (
          <p className="mw-kn-helper" role="status" data-testid="mw-campaign-email-blocked">
            {viewModel.blockedReason}
          </p>
        ) : viewModel.showPrimaryAction ? (
          <button
            type="button"
            className="mw-btn-primary pg-focus-premium"
            disabled={viewModel.primaryDisabled}
            aria-disabled={viewModel.primaryDisabled}
            data-testid="mw-campaign-email-execute-button"
            onClick={() => void handleExecute()}
          >
            {viewModel.primaryLabel}
          </button>
        ) : null}
      </div>

      {viewModel.previewEmail ? <EmailCampaignPreviewPanel email={viewModel.previewEmail} /> : null}

      {errorMessage ? (
        <p
          id={feedbackId}
          className="mw-campaign-start-feedback mw-campaign-start-feedback--error"
          role="alert"
          aria-live="polite"
          style={{ marginTop: 8 }}
          data-testid="mw-campaign-email-error"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
