"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  buildCampaignStrategyWorkUnitActionViewModel,
  presentMarketingWorkUnitExecutionError,
} from "../lib/campaign-strategy-work-unit-action-presenter";

export type CampaignStrategyWorkUnitActionProps = {
  projectId: string;
  campaignsEnabled: boolean;
  workUnits: readonly WorkUnit[];
  executingWorkUnitId?: string | null;
  manualExecutionDisabled?: boolean;
  onExecuteMarketingWorkUnit: (
    workUnitId: string
  ) => Promise<MarketingWorkUnitExecutionResult>;
};

export default function CampaignStrategyWorkUnitAction({
  projectId,
  campaignsEnabled,
  workUnits,
  executingWorkUnitId,
  manualExecutionDisabled,
  onExecuteMarketingWorkUnit,
}: CampaignStrategyWorkUnitActionProps) {
  const feedbackId = useId();
  const pendingRef = useRef(false);
  const [localPending, setLocalPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const viewModel = buildCampaignStrategyWorkUnitActionViewModel({
    campaignsEnabled,
    projectId,
    workUnits,
    executingWorkUnitId,
    localPending,
    manualExecutionDisabled,
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
      setErrorMessage("Marketing Peer could not prepare the strategy. Please try again.");
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
      className="mw-section mw-glass mw-campaign-strategy-work-unit"
      style={{ padding: 16, marginBottom: 12 }}
      data-testid="mw-campaign-strategy-work-unit-action"
    >
      <div className="mw-section-title" style={{ marginBottom: 10 }}>
        <Sparkles size={15} aria-hidden style={{ marginRight: 6, verticalAlign: "middle" }} />
        Campaign strategy
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
            data-testid="mw-campaign-strategy-complete"
          >
            {viewModel.completionLabel}
          </p>
        ) : viewModel.showPrimaryAction ? (
          <button
            type="button"
            className="mw-btn-primary pg-focus-premium"
            disabled={viewModel.primaryDisabled}
            aria-disabled={viewModel.primaryDisabled}
            data-testid="mw-campaign-strategy-execute-button"
            onClick={() => void handleExecute()}
          >
            {viewModel.primaryLabel}
          </button>
        ) : null}
      </div>

      {errorMessage ? (
        <p
          id={feedbackId}
          className="mw-campaign-start-feedback mw-campaign-start-feedback--error"
          role="alert"
          aria-live="polite"
          style={{ marginTop: 8 }}
          data-testid="mw-campaign-strategy-error"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
