"use client";

import { useMemo, type ReactNode } from "react";
import {
  PgAlcove,
  PgConversationLedge,
  PgReviewBar,
  PgWorkPlane,
  PgWorkPlaneContent,
} from "@/components/design-system";
import StudioChrome from "@/features/studio/StudioChrome";
import type { PeerRow } from "@/lib/peer-display";
import {
  isDeliverableInReview,
  type DeliverableReviewContextAction,
  type DetailSlideOverKind,
  type PrimaryAction,
} from "@/lib/peer-experience";
import type { ProgressRailChapterId, ProgressRailViewModel } from "@/lib/peer-experience/marketing/build-progress-rail-view-model";
import { resolveWorkPlaneState } from "@/lib/peer-experience/marketing/resolve-work-plane-state";
import type { DeliverableViewModel, NowPresence } from "@/lib/peer-experience";
import { buildStudioAnnouncement } from "@/lib/studio/build-studio-announcement";
import type {
  ConversationMessage,
  ConversationNextStep,
} from "@/lib/marketing-workspace/experience";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import { cn } from "@/lib/ui/cn";

export type PeerStudioShellContentProps = {
  peer: PeerRow;
  campaignTitle: string;
  presenceLine: string;
  presence: NowPresence;
  progressRail: ProgressRailViewModel;
  deliverable: DeliverableViewModel;
  primaryAction: PrimaryAction | null;
  generating: GeneratingActivity | null;
  archiveLabel?: string;
  alcoveOpen?: boolean;
  alcoveTitle?: string;
  alcoveContent?: ReactNode;
  onAlcoveClose?: () => void;
  reviewContextActions?: DeliverableReviewContextAction[];
  onOpenInspector?: (kind: DetailSlideOverKind) => void;
  onOpenDetail?: (kind: DetailSlideOverKind) => void;
  conversationOpen?: boolean;
  onConversationOpenChange?: (open: boolean) => void;
  conversationMessages?: ConversationMessage[];
  conversationPendingStep?: ConversationNextStep | null;
  onConversationSend?: (message: string) => void;
  onConversationRedirect?: (step: ConversationNextStep) => void;
  onProgressChapterSelect?: (chapterId: ProgressRailChapterId) => void;
  onPrimaryAction?: () => void;
  onReview?: (draftId: string, status: "approved" | "rejected") => void;
  className?: string;
  "data-scene"?: string;
};

export default function PeerStudioShellContent({
  peer,
  campaignTitle,
  presenceLine,
  presence,
  progressRail,
  deliverable,
  primaryAction,
  generating,
  archiveLabel,
  alcoveOpen = false,
  alcoveTitle = "",
  alcoveContent,
  onAlcoveClose,
  reviewContextActions,
  onOpenInspector,
  onOpenDetail,
  conversationOpen = false,
  onConversationOpenChange,
  conversationMessages = [],
  conversationPendingStep,
  onConversationSend,
  onConversationRedirect,
  onProgressChapterSelect,
  onPrimaryAction,
  onReview,
  className,
  "data-scene": dataScene,
}: PeerStudioShellContentProps) {
  const isReviewActive = isDeliverableInReview(deliverable);
  const reviewDraftId =
    isReviewActive && deliverable.kind === "content" ? deliverable.draftId : null;

  const workPlaneState = resolveWorkPlaneState(deliverable);
  const screenReaderAnnouncement = useMemo(
    () =>
      buildStudioAnnouncement({
        workPlaneState,
        archiveLabel,
        presenceLine,
      }),
    [workPlaneState, archiveLabel, presenceLine]
  );

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col",
        isReviewActive && "pb-24 max-md:pb-[88px]",
        className
      )}
      data-scene={dataScene}
      data-studio-shell="true"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {screenReaderAnnouncement}
      </p>

      <StudioChrome
        peerName={peer.name}
        peerRole={peer.role}
        campaignTitle={campaignTitle}
        presenceLine={presenceLine}
        presence={presence}
        progressRail={progressRail}
        onProgressChapterSelect={onProgressChapterSelect}
        onDirectMaya={
          onConversationOpenChange
            ? () => onConversationOpenChange(!conversationOpen)
            : undefined
        }
        directMayaDisabled={!onConversationOpenChange}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <PgWorkPlane className="min-w-0 flex-1">
          <PgWorkPlaneContent
            key={`${workPlaneState}:${archiveLabel ?? "live"}`}
            deliverable={deliverable}
            primaryAction={primaryAction}
            generating={generating !== null}
            onPrimaryAction={onPrimaryAction}
            archiveLabel={archiveLabel}
            reviewContextActions={reviewContextActions}
            onOpenInspector={onOpenInspector}
            onOpenDetail={onOpenDetail}
          />
        </PgWorkPlane>

        {alcoveOpen && onAlcoveClose && alcoveContent && (
          <PgAlcove
            open
            title={alcoveTitle}
            onClose={onAlcoveClose}
            className="pg-studio-alcove-enter"
          >
            {alcoveContent}
          </PgAlcove>
        )}
      </div>

      {reviewDraftId && onReview && (
        <PgReviewBar
          draftId={reviewDraftId}
          disabled={generating !== null}
          onApprove={(draftId) => onReview(draftId, "approved")}
          onReject={(draftId) => onReview(draftId, "rejected")}
        />
      )}

      {onConversationOpenChange && onConversationSend && (
        <PgConversationLedge
          open={conversationOpen}
          onOpenChange={onConversationOpenChange}
          peerName={peer.name}
          messages={conversationMessages}
          pendingNextStep={conversationPendingStep}
          onSend={onConversationSend}
          onRedirect={onConversationRedirect}
          disabled={generating !== null}
        />
      )}
    </div>
  );
}

export { detailPanelTitle } from "@/lib/peer-experience/marketing/review-panel-routing";
