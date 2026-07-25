"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import ApprovalDeliverableCard from "@/features/studio/emma-workspace/approval/ApprovalDeliverableCard";
import ApprovalPreviewRenderer from "@/features/studio/emma-workspace/approval/ApprovalPreviewRenderer";
import { resolveApprovalConnectionState } from "@/lib/peer-experience/marketing/approval/build-approval-deliverable";
import { buildMarketingContentDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-content-view-model";
import { getContentHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  ApprovalDeliverableContent,
  ApprovalMediaAsset,
} from "@/lib/peer-experience/marketing/approval/types";
import {
  contentStatusClass,
  contentStatusLabel,
} from "../lib/content-status-map";

export type ContentDetailTabProps = {
  peerId: string;
  contentId: string;
  domainInput: MarketingPeerDomainInput;
  onApprove?: (draftId: string) => void;
  onReject?: (draftId: string) => void;
  onSaveContent?: (draftId: string, content: ApprovalDeliverableContent) => void;
  onSaveMedia?: (draftId: string, media: ApprovalMediaAsset[]) => void;
  onFeedback?: (draftId: string, message: string) => void;
  onApproveAndSchedule?: (draftId: string, scheduledAt: string, timezone: string) => void;
  onPublishNow?: (draftId: string) => void;
  onSendForReview?: (draftId: string) => void;
  publishMessage?: string | null;
};

export default function ContentDetailTab({
  peerId,
  contentId,
  domainInput,
  onApprove,
  onReject,
  onSaveContent,
  onSaveMedia,
  onFeedback,
  onApproveAndSchedule,
  onPublishNow,
  onSendForReview,
  publishMessage,
}: ContentDetailTabProps) {
  const vm = buildMarketingContentDetailViewModel({ ...domainInput, contentId });

  if (!vm) {
    return (
      <section className="mw-section">
        <p className="mw-empty-inline">Content not found.</p>
        <Link href={getContentHref(peerId)} className="mw-section-link" style={{ marginTop: 12 }}>
          ← Content library
        </Link>
      </section>
    );
  }

  const draftId = vm.item.draftId;
  const connection = resolveApprovalConnectionState(vm.deliverable.account);
  const statusClass = contentStatusClass(vm.item.status);
  const showApprovalCard =
    vm.item.status === "ready_for_review" ||
    vm.item.status === "approved" ||
    vm.item.status === "draft";

  return (
    <>
      <Link href={getContentHref(peerId)} className="mw-detail-back pg-focus-premium">
        ← Content library
      </Link>

      <section className="mw-section mw-glass mw-detail-hero" style={{ animationDelay: "0.03s" }}>
        <div className="mw-section-title" style={{ marginBottom: 8 }}>
          <FileText size={15} aria-hidden />
          {vm.item.title}
        </div>
        <div className="mw-detail-meta-row">
          <span>{vm.item.channel}</span>
          <span>·</span>
          <span className={statusClass}>{contentStatusLabel(vm.item.status)}</span>
          <span>·</span>
          <span>Created {new Date(vm.createdAt).toLocaleDateString()}</span>
        </div>
        {vm.item.campaign && (
          <p className="mw-kn-helper" style={{ marginTop: 8 }}>
            Project: {vm.item.campaign}
          </p>
        )}
        {vm.item.scheduledAt && (
          <p className="mw-kn-helper">Scheduled: {new Date(vm.item.scheduledAt).toLocaleString()}</p>
        )}
        {vm.item.publishedAt && (
          <p className="mw-kn-helper">Published: {new Date(vm.item.publishedAt).toLocaleString()}</p>
        )}
        {vm.workUnitHref && vm.workUnitTitle && (
          <Link href={vm.workUnitHref} className="mw-section-link" style={{ marginTop: 8 }}>
            Related project: {vm.workUnitTitle}
          </Link>
        )}
      </section>

      <section className="mw-section mw-glass" style={{ padding: 20, animationDelay: "0.06s" }}>
        <div className="mw-modal-label">Preview</div>
        <div className="mw-post-preview">
          <ApprovalPreviewRenderer deliverable={vm.deliverable} />
        </div>
      </section>

      <section className="mw-section mw-glass" style={{ padding: 20 }}>
        <div className="mw-modal-label">Copy</div>
        <p className="mw-detail-copy">
          {vm.deliverable.content.caption ?? vm.deliverable.content.body}
        </p>
        {vm.deliverable.content.hashtags && vm.deliverable.content.hashtags.length > 0 ? (
          <p className="mw-kn-helper" style={{ marginTop: 10 }}>
            {vm.deliverable.content.hashtags.join(" ")}
          </p>
        ) : null}
      </section>

      <section className="mw-section mw-glass" style={{ padding: 20 }}>
        <div className="mw-modal-label">Publication</div>
        <p className="mw-kn-helper">
          Account: {vm.deliverable.account.name}
          {vm.deliverable.account.connected ? " (connected)" : " (not connected)"}
        </p>
        <Link href={vm.reviewHref} className="mw-section-link" style={{ marginTop: 10 }}>
          View in Review queue →
        </Link>
      </section>

      {showApprovalCard && (
        <section className="mw-section mw-glass" style={{ padding: 20 }}>
          <div className="mw-section-title" style={{ marginBottom: 14 }}>
            Actions
          </div>
          <ApprovalDeliverableCard
            deliverable={vm.deliverable}
            connection={connection}
            publishMessage={publishMessage}
            onSaveContent={(content) => onSaveContent?.(draftId, content)}
            onSaveMedia={(media) => onSaveMedia?.(draftId, media)}
            onApprove={() => onApprove?.(draftId)}
            onApproveAndSchedule={(scheduledAt, timezone) =>
              onApproveAndSchedule?.(draftId, scheduledAt, timezone)
            }
            onPublishNow={() => onPublishNow?.(draftId)}
            onFeedback={(message) => onFeedback?.(draftId, message)}
          />
          {vm.item.status === "draft" && onSendForReview && (
            <button
              type="button"
              className="mw-btn-primary pg-focus-premium"
              style={{ marginTop: 12 }}
              onClick={() => onSendForReview(draftId)}
            >
              Send for decision
            </button>
          )}
          {onReject && vm.item.status === "ready_for_review" && (
            <button
              type="button"
              className="mw-btn-review pg-focus-premium"
              style={{ marginTop: 12, marginLeft: 8 }}
              onClick={() => onReject(draftId)}
            >
              Reject
            </button>
          )}
        </section>
      )}

      <section className="mw-section" style={{ marginBottom: 0 }}>
        <div className="mw-section-head">
          <div className="mw-section-title">Performance</div>
          <Link href={vm.performanceHref} className="mw-section-link">
            Open performance
          </Link>
        </div>
        {!vm.performance.hasLiveData ? (
          <p className="mw-empty-inline">{vm.performance.emptyMessage}</p>
        ) : (
          <div className="mw-results-grid">
            {vm.performance.metrics.map((m) => (
              <div key={m.id} className="mw-glass mw-result-card">
                <div className="mw-result-title">{m.label}</div>
                <div className="mw-result-value">{m.value}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
