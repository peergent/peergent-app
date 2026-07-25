"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Clock } from "lucide-react";
import ApprovalDeliverableCard from "@/features/studio/emma-workspace/approval/ApprovalDeliverableCard";
import {
  buildMarketingReviewViewModel,
  reviewFilters,
  reviewHrefWithFilter,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-review-view-model";
import { buildAllMarketingApprovalQueue } from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import { buildMarketingActivities } from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import type { MarketingReviewFilter } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";
import { parseReviewSearchParams } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  ApprovalDeliverableContent,
  ApprovalMediaAsset,
} from "@/lib/peer-experience/marketing/approval/types";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";

export type ReviewTabProps = {
  peerId: string;
  domainInput: MarketingPeerDomainInput;
  onApprove?: (draftId: string) => void;
  onReject?: (draftId: string) => void;
  onSaveContent?: (draftId: string, content: ApprovalDeliverableContent) => void;
  onSaveMedia?: (draftId: string, media: ApprovalMediaAsset[]) => void;
  onFeedback?: (draftId: string, message: string) => void;
  onApproveAndSchedule?: (draftId: string, scheduledAt: string, timezone: string) => void;
  onPublishNow?: (draftId: string) => void;
  publishMessage?: string | null;
};

export default function ReviewTab({
  peerId,
  domainInput,
  onApprove,
  onReject,
  onSaveContent,
  onSaveMedia,
  onFeedback,
  onApproveAndSchedule,
  onPublishNow,
  publishMessage,
}: ReviewTabProps) {
  const searchParams = useSearchParams();
  const { deliverableId, filter: filterParam } = parseReviewSearchParams(searchParams);
  const filter = (filterParam as MarketingReviewFilter) ?? "needs_review";
  const [busyId, setBusyId] = useState<string | null>(null);

  const vm = useMemo(
    () =>
      buildMarketingReviewViewModel({
        ...domainInput,
        filter,
        selectedDraftId: deliverableId,
      }),
    [domainInput, filter, deliverableId]
  );

  const decisionQueue = useMemo(
    () => buildAllMarketingApprovalQueue(domainInput),
    [domainInput]
  );

  const activities = useMemo(
    () => buildMarketingActivities(domainInput),
    [domainInput]
  );

  const showDecisionList = filter === "needs_review";

  return (
    <>
      {showDecisionList && (
        <section className="mw-section" style={{ animationDelay: "0.05s" }}>
          <div className="mw-section-head">
            <div className="mw-section-title">
              <AlertTriangle size={15} aria-hidden />
              Needs your decision
            </div>
            {decisionQueue.length > 0 && (
              <span className="mw-count-badge">{decisionQueue.length}</span>
            )}
          </div>
          <p className="mw-kn-helper" style={{ marginBottom: 14 }}>
            Everything {domainInput.peerName} can&apos;t decide alone — budget, campaigns, pages,
            audiences and brand changes all land here.
          </p>
          {decisionQueue.length === 0 ? (
            <p className="mw-empty-inline">{vm.emptyMessage}</p>
          ) : (
            <div className="mw-glass mw-approvals">
              {decisionQueue.map((item) => (
                <div key={item.id} className="mw-approval-row">
                  <div className="mw-approval-body">
                    <div className="mw-approval-title">{item.title}</div>
                    <div className="mw-approval-reason">{item.attentionReason}</div>
                  </div>
                  <div className="mw-approval-actions">
                    <Link
                      href={reviewHrefWithFilter(peerId, "needs_review", item.draftId)}
                      className="mw-btn-review pg-focus-premium"
                    >
                      Review
                    </Link>
                    <button
                      type="button"
                      className="mw-btn-approve pg-focus-premium"
                      disabled={busyId === item.draftId}
                      onClick={() => {
                        setBusyId(item.draftId);
                        onApprove?.(item.draftId);
                        setTimeout(() => setBusyId(null), 400);
                      }}
                    >
                      Approve
                    </button>
                    {onReject && (
                      <button
                        type="button"
                        className="mw-btn-review pg-focus-premium"
                        disabled={busyId === item.draftId}
                        onClick={() => {
                          setBusyId(item.draftId);
                          onReject(item.draftId);
                          setTimeout(() => setBusyId(null), 400);
                        }}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {!showDecisionList && (
        <section className="mw-section">
          <div className="mw-content-filters">
            {reviewFilters().map((f) => (
              <Link
                key={f.id}
                href={reviewHrefWithFilter(peerId, f.id)}
                className={`mw-filter-chip pg-focus-premium${filter === f.id ? " mw-filter-chip--active" : ""}`}
              >
                {f.label}
              </Link>
            ))}
          </div>
          {vm.queue.length === 0 ? (
            <p className="mw-empty-inline">{vm.emptyMessage}</p>
          ) : (
            <div className="mw-glass mw-approvals">
              {vm.queue.map((item) => (
                <Link
                  key={item.id}
                  href={reviewHrefWithFilter(peerId, filter, item.draftId)}
                  className="mw-approval-row pg-focus-premium"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="mw-approval-body">
                    <div className="mw-approval-title">{item.title}</div>
                    <div className="mw-approval-reason">{item.channel}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {vm.selectedDeliverable && vm.selectedConnection && deliverableId && (
        <section className="mw-section mw-glass" style={{ padding: 20 }}>
          <ApprovalDeliverableCard
            deliverable={vm.selectedDeliverable}
            connection={vm.selectedConnection}
            publishMessage={publishMessage}
            onSaveContent={(content) => onSaveContent?.(vm.selectedDraftId!, content)}
            onSaveMedia={(media) => onSaveMedia?.(vm.selectedDraftId!, media)}
            onApprove={() => onApprove?.(vm.selectedDraftId!)}
            onApproveAndSchedule={(scheduledAt, timezone) =>
              onApproveAndSchedule?.(vm.selectedDraftId!, scheduledAt, timezone)
            }
            onPublishNow={() => onPublishNow?.(vm.selectedDraftId!)}
            onFeedback={(message) => onFeedback?.(vm.selectedDraftId!, message)}
          />
        </section>
      )}

      <section className="mw-section" style={{ animationDelay: "0.12s", marginBottom: 0 }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <Clock size={15} aria-hidden />
            Activity
          </div>
        </div>
        {activities.length === 0 ? (
          <p className="mw-empty-inline">Activity will appear here as {domainInput.peerName} completes work.</p>
        ) : (
          <div className="mw-glass mw-timeline">
            {activities.slice(0, 5).map((item) => (
              <div key={item.id} className="mw-tl-row">
                <div className="mw-tl-dot" aria-hidden />
                <div>
                  <div className="mw-tl-text">{item.summary ?? item.title}</div>
                  <div className="mw-tl-time">{item.timeLabel || formatRelativeTime(item.occurredAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
