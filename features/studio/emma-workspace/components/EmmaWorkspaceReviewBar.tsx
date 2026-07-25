"use client";

import { Info } from "lucide-react";
import { DRAFT_REVIEW_ACTION_LABELS } from "@/lib/peer-experience";
import { cn } from "@/lib/ui/cn";

export type EmmaWorkspaceReviewBarProps = {
  draftId: string;
  disabled?: boolean;
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  className?: string;
};

export default function EmmaWorkspaceReviewBar({
  draftId,
  disabled,
  onApprove,
  onReject,
  className,
}: EmmaWorkspaceReviewBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Review actions"
      className={cn("emma-review-bar", className)}
    >
      <div className="emma-review-bar__inner">
        <div className="emma-review-bar__context">
          <p className="emma-review-bar__mode">Review Mode</p>
          <p className="emma-review-bar__hint">
            You&apos;re reviewing content
            <Info size={14} aria-hidden className="emma-review-bar__info" />
          </p>
        </div>

        <div className="emma-review-bar__actions">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onApprove(draftId)}
            aria-label={`${DRAFT_REVIEW_ACTION_LABELS.approve}, approve draft`}
            className="emma-review-bar__approve pg-focus-premium"
          >
            <span aria-hidden>✓</span>
            {DRAFT_REVIEW_ACTION_LABELS.approve}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onReject(draftId)}
            aria-label={`${DRAFT_REVIEW_ACTION_LABELS.reject}, send draft back for edits`}
            className="emma-review-bar__reject pg-focus-premium"
          >
            {DRAFT_REVIEW_ACTION_LABELS.reject}
          </button>
        </div>
      </div>
    </div>
  );
}
