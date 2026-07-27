"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  buildLinkedInPostWorkUnitActionViewModel,
  presentMarketingWorkUnitExecutionError,
} from "../lib/campaign-linkedin-post-work-unit-action-presenter";

export type CampaignLinkedInPostWorkUnitActionProps = {
  projectId: string;
  campaignsEnabled: boolean;
  workUnit: WorkUnit;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  executingWorkUnitId?: string | null;
  manualExecutionDisabled?: boolean;
  onExecuteMarketingWorkUnit: (
    workUnitId: string
  ) => Promise<MarketingWorkUnitExecutionResult>;
};

function LinkedInPostPreviewPanel({ post }: { post: MarketingLinkedInPost }) {
  const hashtagLine = post.hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ");

  return (
    <div
      className="mw-linkedin-post-preview"
      data-testid="mw-campaign-linkedin-post-preview"
      style={{ marginTop: 12 }}
    >
      <dl className="mw-campaign-meta" style={{ margin: 0 }}>
        <div style={{ marginBottom: 10 }}>
          <dt className="mw-kn-helper">Hook</dt>
          <dd>{post.hook}</dd>
        </div>
        <div style={{ marginBottom: 10 }}>
          <dt className="mw-kn-helper">Main content</dt>
          <dd style={{ whiteSpace: "pre-wrap" }}>{post.body}</dd>
        </div>
        <div style={{ marginBottom: 10 }}>
          <dt className="mw-kn-helper">CTA</dt>
          <dd>{post.cta}</dd>
        </div>
        <div style={{ marginBottom: 10 }}>
          <dt className="mw-kn-helper">Hashtags</dt>
          <dd>{hashtagLine}</dd>
        </div>
        {post.suggestedImageDescription.trim() ? (
          <div>
            <dt className="mw-kn-helper">Suggested image description</dt>
            <dd>{post.suggestedImageDescription}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export default function CampaignLinkedInPostWorkUnitAction({
  projectId,
  campaignsEnabled,
  workUnit,
  workUnits,
  strategy,
  creativeBriefByCampaignId,
  linkedinPostByWorkUnitId,
  executingWorkUnitId,
  manualExecutionDisabled,
  onExecuteMarketingWorkUnit,
}: CampaignLinkedInPostWorkUnitActionProps) {
  const feedbackId = useId();
  const pendingRef = useRef(false);
  const [localPending, setLocalPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const viewModel = buildLinkedInPostWorkUnitActionViewModel({
    campaignsEnabled,
    projectId,
    workUnit,
    workUnits,
    strategy,
    creativeBriefByCampaignId,
    linkedinPostByWorkUnitId,
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
      setErrorMessage("Marketing Peer could not prepare the LinkedIn post. Please try again.");
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
      className="mw-section mw-glass mw-campaign-linkedin-post-work-unit"
      style={{ padding: 16, marginBottom: 12 }}
      data-testid="mw-campaign-linkedin-post-work-unit-action"
    >
      <div className="mw-section-title" style={{ marginBottom: 10 }}>
        <Share2 size={15} aria-hidden style={{ marginRight: 6, verticalAlign: "middle" }} />
        LinkedIn post
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
            data-testid="mw-campaign-linkedin-post-complete"
          >
            {viewModel.completionLabel}
          </p>
        ) : viewModel.blockedReason ? (
          <p className="mw-kn-helper" role="status" data-testid="mw-campaign-linkedin-post-blocked">
            {viewModel.blockedReason}
          </p>
        ) : viewModel.showPrimaryAction ? (
          <button
            type="button"
            className="mw-btn-primary pg-focus-premium"
            disabled={viewModel.primaryDisabled}
            aria-disabled={viewModel.primaryDisabled}
            data-testid="mw-campaign-linkedin-post-execute-button"
            onClick={() => void handleExecute()}
          >
            {viewModel.primaryLabel}
          </button>
        ) : null}
      </div>

      {viewModel.previewPost ? <LinkedInPostPreviewPanel post={viewModel.previewPost} /> : null}

      {errorMessage ? (
        <p
          id={feedbackId}
          className="mw-campaign-start-feedback mw-campaign-start-feedback--error"
          role="alert"
          aria-live="polite"
          style={{ marginTop: 8 }}
          data-testid="mw-campaign-linkedin-post-error"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
