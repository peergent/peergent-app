"use client";

import type { EmmaNeedsApprovalViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import type {
  ApprovalDeliverableContent,
  ApprovalMediaAsset,
} from "@/lib/peer-experience/marketing/approval/types";
import EmmaWorkspaceSection from "../components/EmmaWorkspaceSection";
import ApprovalDeliverableCard from "../approval/ApprovalDeliverableCard";

export type EmmaNeedsApprovalProps = {
  model: EmmaNeedsApprovalViewModel;
  onApprove?: (draftId: string) => void;
  onSchedule?: (draftId: string) => void;
  onPublish?: (draftId: string) => void;
  onViewLive?: (draftId: string) => void;
  onFeedback?: (draftId: string, message: string) => void;
  onSaveContent?: (draftId: string, content: ApprovalDeliverableContent) => void;
  onSaveMedia?: (draftId: string, media: ApprovalMediaAsset[]) => void;
  onApproveAndSchedule?: (draftId: string, scheduledAt: string, timezone: string) => void;
  onPublishNow?: (draftId: string) => void;
  publishMessage?: string | null;
};

export default function EmmaNeedsApproval({
  model,
  onApprove,
  onSaveContent,
  onSaveMedia,
  onApproveAndSchedule,
  onPublishNow,
  onFeedback,
  publishMessage,
}: EmmaNeedsApprovalProps) {
  return (
    <EmmaWorkspaceSection id="needs-approval" title="Needs Your Approval">
      {!model.hasItem || !model.deliverable || !model.connection ? (
        <div className="emma-approval-empty">
          <p className="emma-voice">{model.emptyMessage}</p>
          {model.emptySupportingMessage && (
            <p className="emma-voice emma-voice--muted">{model.emptySupportingMessage}</p>
          )}
        </div>
      ) : (
        <ApprovalDeliverableCard
          deliverable={model.deliverable}
          connection={model.connection}
          publishMessage={publishMessage}
          onSaveContent={(content) => onSaveContent?.(model.draftId!, content)}
          onSaveMedia={(media) => onSaveMedia?.(model.draftId!, media)}
          onApprove={() => onApprove?.(model.draftId!)}
          onApproveAndSchedule={(scheduledAt, timezone) =>
            onApproveAndSchedule?.(model.draftId!, scheduledAt, timezone)
          }
          onPublishNow={() => onPublishNow?.(model.draftId!)}
          onFeedback={(message) => onFeedback?.(model.draftId!, message)}
        />
      )}
    </EmmaWorkspaceSection>
  );
}
