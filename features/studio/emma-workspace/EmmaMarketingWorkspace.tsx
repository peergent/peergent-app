"use client";

import "./emma-workspace.css";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PgAlcove, PgConversationLedge } from "@/components/design-system";
import type { PeerRow } from "@/lib/peer-display";
import type { ConversationMessage, ConversationNextStep } from "@/lib/marketing-workspace/experience";
import { isDeliverableInReview } from "@/lib/peer-experience";
import type { DeliverableViewModel } from "@/lib/peer-experience";
import type { DelegationTask } from "@/lib/peer-experience/marketing/parse-delegation-intent";
import type {
  ApprovalDeliverableContent,
  ApprovalMediaAsset,
} from "@/lib/peer-experience/marketing/approval/types";
import type {
  EmmaMissionControlCta,
  EmmaWorkspaceViewModel,
} from "@/lib/peer-experience/marketing/emma-workspace-types";
import { cn } from "@/lib/ui/cn";
import EmmaWorkspaceReviewBar from "./components/EmmaWorkspaceReviewBar";
import EmmaCurrentWork from "./sections/EmmaCurrentWork";
import EmmaDelegation from "./sections/EmmaDelegation";
import EmmaExecutiveBrief from "./sections/EmmaExecutiveBrief";
import EmmaInsightsOpportunities from "./sections/EmmaInsightsOpportunities";
import EmmaMissionOverview from "./sections/EmmaMissionOverview";
import EmmaNeedsApproval from "./sections/EmmaNeedsApproval";
import EmmaRecentlyFinished from "./sections/EmmaRecentlyFinished";

const PEER_TAGLINE = "Your marketing employee.";

export type EmmaMarketingWorkspaceProps = {
  peer: PeerRow;
  presenceLine: string;
  viewModel: EmmaWorkspaceViewModel;
  deliverable: DeliverableViewModel;
  alcoveOpen?: boolean;
  alcoveTitle?: string;
  alcoveContent?: ReactNode;
  onAlcoveClose?: () => void;
  conversationOpen?: boolean;
  onConversationOpenChange?: (open: boolean) => void;
  conversationMessages?: ConversationMessage[];
  conversationPendingStep?: ConversationNextStep | null;
  onConversationSend?: (message: string) => void;
  onConversationRedirect?: (step: ConversationNextStep) => void;
  onOpenFinishedItem?: (draftId: string) => void;
  onApproveDraft?: (draftId: string) => void;
  onRejectDraft?: (draftId: string) => void;
  onScheduleDraft?: (draftId: string) => void;
  onPublishDraft?: (draftId: string) => void;
  onViewLiveDraft?: (draftId: string) => void;
  onExecuteDelegation?: (task: DelegationTask) => Promise<void>;
  delegationBusy?: boolean;
  onMissionCta?: (cta: EmmaMissionControlCta) => void;
  onDismissInsight?: (insightId: string) => void;
  onFeedback?: (draftId: string, message: string) => void;
  onSaveApprovalContent?: (draftId: string, content: ApprovalDeliverableContent) => void;
  onSaveApprovalMedia?: (draftId: string, media: ApprovalMediaAsset[]) => void;
  onApproveAndSchedule?: (draftId: string, scheduledAt: string, timezone: string) => void;
  onPublishNow?: (draftId: string) => void;
  approvalPublishMessage?: string | null;
  className?: string;
};

export default function EmmaMarketingWorkspace({
  peer,
  presenceLine,
  viewModel,
  deliverable,
  alcoveOpen = false,
  alcoveTitle = "",
  alcoveContent,
  onAlcoveClose,
  conversationOpen = false,
  onConversationOpenChange,
  conversationMessages = [],
  conversationPendingStep,
  onConversationSend,
  onConversationRedirect,
  onOpenFinishedItem,
  onApproveDraft,
  onRejectDraft,
  onScheduleDraft,
  onPublishDraft,
  onViewLiveDraft,
  onExecuteDelegation,
  delegationBusy = false,
  onMissionCta,
  onDismissInsight,
  onFeedback,
  onSaveApprovalContent,
  onSaveApprovalMedia,
  onApproveAndSchedule,
  onPublishNow,
  approvalPublishMessage,
  className,
}: EmmaMarketingWorkspaceProps) {
  const isReviewActive = isDeliverableInReview(deliverable);
  const reviewDraftId =
    deliverable.kind === "content" && deliverable.reviewable ? deliverable.draftId : null;

  const scrollToApproval = () => {
    document.getElementById("needs-approval")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMissionCta = (cta: EmmaMissionControlCta) => {
    if (onMissionCta) {
      onMissionCta(cta);
      return;
    }
    switch (cta.kind) {
      case "review_deliverable":
        scrollToApproval();
        break;
      case "open_task":
        document.getElementById("current-work")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "assign_work":
        document.getElementById("delegation")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "open_performance":
        window.location.href = viewModel.missionOverview.performanceLinkHref;
        break;
    }
  };

  const handleFeedback = (draftId: string, message: string) => {
    onFeedback?.(draftId, message);
  };

  return (
    <div
      className={cn(
        "emma-workspace",
        isReviewActive && "emma-workspace--review",
        className
      )}
    >
      <header className="emma-workspace__header">
        <div className="emma-workspace__header-row">
          <Link href="/team" className="emma-workspace__back pg-focus-premium">
            <ArrowLeft size={16} aria-hidden />
            Team
          </Link>

          <div className="emma-workspace__header-actions">
            {presenceLine && (
              <div className="emma-workspace__status-pill">
                <span className="emma-live-dot emma-live-dot--sm" aria-hidden>
                  <span className="emma-live-dot__pulse" />
                </span>
                <span>{presenceLine}</span>
              </div>
            )}
            {onConversationOpenChange && (
              <button
                type="button"
                className="emma-workspace__chat pg-focus-premium"
                onClick={() => onConversationOpenChange(!conversationOpen)}
                aria-label={`Message ${peer.name}`}
              >
                <MessageCircle size={18} aria-hidden />
              </button>
            )}
          </div>
        </div>

        <div className="emma-workspace__identity">
          <div className="emma-workspace__avatar" aria-hidden>
            {peer.name.charAt(0).toUpperCase()}
          </div>
          <div className="emma-workspace__identity-text">
            <h1 className="emma-workspace__name">{peer.name}</h1>
            <p className="emma-workspace__tagline">{PEER_TAGLINE}</p>
          </div>
        </div>
      </header>

      <EmmaExecutiveBrief model={viewModel.executiveBrief} />

      <div className="emma-workspace__main">
        <div className="emma-workspace__col emma-workspace__col--mission">
          <EmmaMissionOverview
            model={viewModel.missionOverview}
            onMissionCta={handleMissionCta}
          />
        </div>

        <div className="emma-workspace__col emma-workspace__col--current">
          <EmmaCurrentWork model={viewModel.currentWork} />
        </div>

        <div className="emma-workspace__col emma-workspace__col--right">
          <EmmaNeedsApproval
            model={viewModel.needsApproval}
            onApprove={onApproveDraft}
            onSchedule={onScheduleDraft}
            onPublish={onPublishDraft}
            onViewLive={onViewLiveDraft}
            onFeedback={handleFeedback}
            onSaveContent={onSaveApprovalContent}
            onSaveMedia={onSaveApprovalMedia}
            onApproveAndSchedule={onApproveAndSchedule}
            onPublishNow={onPublishNow}
            publishMessage={approvalPublishMessage}
          />

          <div className="emma-workspace__bottom-row">
            <EmmaRecentlyFinished
              model={viewModel.recentlyFinished}
              onOpenItem={onOpenFinishedItem}
            />
            <EmmaInsightsOpportunities
              model={viewModel.insights}
              onDismiss={onDismissInsight}
              onReview={(id) => {
                onConversationOpenChange?.(true);
                onConversationSend?.(`Tell me more about this recommendation: ${id}`);
              }}
              onApply={(id) => {
                onConversationOpenChange?.(true);
                onConversationSend?.(`Apply this recommendation: ${id}`);
              }}
            />
          </div>
        </div>
      </div>

      <EmmaDelegation
        model={viewModel.delegation}
        peerName={peer.name}
        onExecuteTask={onExecuteDelegation}
        busy={delegationBusy}
      />

      {alcoveOpen && alcoveContent && onAlcoveClose && (
        <PgAlcove open={alcoveOpen} title={alcoveTitle} onClose={onAlcoveClose}>
          {alcoveContent}
        </PgAlcove>
      )}

      {onConversationOpenChange && onConversationSend && onConversationRedirect && (
        <PgConversationLedge
          open={conversationOpen}
          onOpenChange={onConversationOpenChange}
          messages={conversationMessages}
          pendingNextStep={conversationPendingStep ?? null}
          onSend={onConversationSend}
          onRedirect={onConversationRedirect}
          peerName={peer.name}
        />
      )}

      {isReviewActive && reviewDraftId && onApproveDraft && onRejectDraft && (
        <EmmaWorkspaceReviewBar
          draftId={reviewDraftId}
          onApprove={onApproveDraft}
          onReject={onRejectDraft}
        />
      )}
    </div>
  );
}
