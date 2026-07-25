"use client";

import { DRAFT_REVIEW_ACTION_LABELS } from "@/lib/peer-experience";
import { cn } from "@/lib/ui/cn";

export type PgReviewBarProps = {
  draftId: string;
  disabled?: boolean;
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  className?: string;
};

/**
 * Sticky review actions — must remain mounted for entire review state.
 * Design System v1.0: 64px desktop, 72px mobile, role=toolbar.
 */
export default function PgReviewBar({
  draftId,
  disabled,
  onApprove,
  onReject,
  className,
}: PgReviewBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Review actions"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t",
        "border-[var(--pg-color-border)] bg-[var(--pg-color-canvas)]/95 backdrop-blur-sm",
        "pb-[max(0px,env(safe-area-inset-bottom))] lg:left-[var(--pg-nav-width)]",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[var(--pg-container-content)] flex-wrap items-center gap-2",
          "min-h-16 px-4 py-3 md:min-h-[64px] md:px-8",
          "max-md:min-h-[72px]"
        )}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => onApprove(draftId)}
          aria-label={`${DRAFT_REVIEW_ACTION_LABELS.approve}, approve draft`}
          className={cn(
            "pg-focus-premium min-h-[44px] rounded-[var(--pg-radius-md)] px-5",
            "text-sm font-medium text-[var(--pg-color-text-inverse)]",
            "bg-[var(--pg-color-accent)] transition hover:bg-[var(--pg-color-accent-hover)]",
            "active:scale-[0.98] active:bg-[var(--pg-color-accent-pressed)]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {DRAFT_REVIEW_ACTION_LABELS.approve}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onReject(draftId)}
          aria-label={`${DRAFT_REVIEW_ACTION_LABELS.reject}, send draft back for edits`}
          className={cn(
            "pg-focus-premium min-h-[44px] rounded-[var(--pg-radius-md)] border px-5",
            "border-[var(--pg-color-border)] text-sm font-medium",
            "text-[var(--pg-color-text-primary)] transition",
            "hover:bg-[var(--pg-color-accent-muted)] disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {DRAFT_REVIEW_ACTION_LABELS.reject}
        </button>
      </div>
    </div>
  );
}
