"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { CampaignContinuationResult } from "@/lib/peer-experience/marketing/campaign-continuation";
import { formatCampaignContinuationSummary } from "@/lib/peer-experience/marketing/campaign-continuation";
import type { CampaignOrchestratorInput } from "@/lib/peer-experience/marketing/campaign-orchestrator";
import {
  buildCampaignContinueActionViewModel,
} from "../lib/campaign-continue-action-presenter";

export type CampaignContinueCampaignActionProps = {
  projectId: string;
  campaignsEnabled: boolean;
  orchestratorInput: CampaignOrchestratorInput;
  continuationRunning: boolean;
  manualExecutionDisabled?: boolean;
  onContinueCampaign: (projectId: string) => Promise<CampaignContinuationResult>;
};

export default function CampaignContinueCampaignAction({
  projectId,
  campaignsEnabled,
  orchestratorInput,
  continuationRunning,
  manualExecutionDisabled,
  onContinueCampaign,
}: CampaignContinueCampaignActionProps) {
  const feedbackId = useId();
  const pendingRef = useRef(false);
  const [summary, setSummary] = useState<CampaignContinuationResult | null>(null);

  const viewModel = useMemo(
    () =>
      buildCampaignContinueActionViewModel({
        campaignsEnabled,
        orchestratorInput,
        continuationRunning,
        manualExecutionDisabled,
      }),
    [
      campaignsEnabled,
      orchestratorInput,
      continuationRunning,
      manualExecutionDisabled,
    ]
  );

  const handleContinue = useCallback(async () => {
    if (pendingRef.current || viewModel.primaryDisabled) {
      return;
    }
    pendingRef.current = true;
    setSummary(null);
    try {
      const result = await onContinueCampaign(projectId);
      setSummary(result);
    } catch {
      setSummary({
        ok: false,
        projectId,
        completedWorkUnits: [],
        stopReason: "execution_failed",
        stopMessage: "Campaign could not be continued. Try again.",
        iterations: 0,
      });
    } finally {
      pendingRef.current = false;
    }
  }, [onContinueCampaign, projectId, viewModel.primaryDisabled]);

  if (!viewModel.show) {
    return null;
  }

  const formattedSummary = summary ? formatCampaignContinuationSummary(summary) : null;

  return (
    <div
      className="mw-section mw-glass mw-campaign-continue-action"
      style={{ padding: 16, marginBottom: 12 }}
      data-testid="mw-campaign-continue-action"
    >
      <div className="mw-section-title" style={{ marginBottom: 10 }}>
        <Play size={15} aria-hidden style={{ marginRight: 6, verticalAlign: "middle" }} />
        Autonomous continuation
      </div>
      <p className="mw-kn-helper" style={{ marginBottom: 12 }}>
        Run every work unit Marketing Peer can execute right now, one at a time.
      </p>
      {viewModel.runningMessage ? (
        <p className="mw-kn-helper" role="status" aria-live="polite">
          {viewModel.runningMessage}
        </p>
      ) : null}
      <button
        type="button"
        className="mw-btn-primary pg-focus-premium"
        disabled={viewModel.primaryDisabled}
        aria-describedby={formattedSummary ? feedbackId : undefined}
        onClick={handleContinue}
      >
        {viewModel.primaryLabel}
      </button>
      {formattedSummary ? (
        <div id={feedbackId} className="mw-kn-helper" style={{ marginTop: 12 }}>
          <p style={{ margin: 0 }}>{formattedSummary.completedLine}</p>
          <p style={{ margin: "8px 0 0", whiteSpace: "pre-line" }}>
            {formattedSummary.stoppedBecauseLine}
          </p>
          {summary?.failedWorkUnit ? (
            <p style={{ margin: "8px 0 0" }}>{summary.failedWorkUnit.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
