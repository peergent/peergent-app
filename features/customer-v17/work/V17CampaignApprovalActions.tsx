"use client";

import { useCallback, useRef, useState } from "react";
import type { CampaignApprovalResult } from "@/lib/peer-experience/marketing/campaign-approval";

export type V17CampaignApprovalActionsProps = {
  projectId: string;
  pendingApproval: boolean;
  publicationUnlocked: boolean;
  locale: "nl" | "en";
  onApproveCampaign?: (input: { projectId: string }) => Promise<CampaignApprovalResult>;
};

export default function V17CampaignApprovalActions({
  projectId,
  pendingApproval,
  publicationUnlocked,
  locale,
  onApproveCampaign,
}: V17CampaignApprovalActionsProps) {
  const nl = locale === "nl";
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runApprove = useCallback(async () => {
    if (!onApproveCampaign || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setErrorMessage(null);
    try {
      const result = await onApproveCampaign({ projectId });
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }
      setStatusMessage(result.message);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [onApproveCampaign, projectId]);

  if (!pendingApproval && publicationUnlocked) {
    return (
      <div className="v17-campaign-approval-actions" data-testid="v17-campaign-approved">
        <p className="v17-review-actions-status" role="status">
          {nl ? "Campagne goedgekeurd — Emma gaat verder." : "Campaign approved — Emma is continuing."}
        </p>
      </div>
    );
  }

  if (!pendingApproval) {
    return null;
  }

  return (
    <div className="v17-campaign-approval-actions" data-testid="v17-campaign-approval-actions">
      {statusMessage ? (
        <p className="v17-review-feedback v17-review-feedback--success" role="status">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="v17-review-feedback v17-review-feedback--error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <p className="v17-page-support">
        {nl
          ? "Emma heeft al het interne werk afgerond. Keur één keer goed en zij gaat automatisch verder."
          : "Emma completed all internal work. Approve once and she continues automatically."}
      </p>
      <button
        type="button"
        className="v17-btn v17-btn--primary pg-focus-premium"
        disabled={pending || !onApproveCampaign}
        data-testid="v17-approve-campaign-btn"
        onClick={() => void runApprove()}
      >
        {pending ? "…" : nl ? "Campagne goedkeuren" : "Approve Campaign"}
      </button>
    </div>
  );
}
