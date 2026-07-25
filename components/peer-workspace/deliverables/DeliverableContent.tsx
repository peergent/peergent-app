"use client";

import type {
  DeliverableContentViewModel,
  DeliverableReviewContextAction,
  DetailSlideOverKind,
} from "@/lib/peer-experience";
import { cn } from "@/lib/ui/cn";

type DeliverableContentProps = {
  deliverable: DeliverableContentViewModel;
  contextActions?: DeliverableReviewContextAction[];
  onOpenInspector?: (kind: DetailSlideOverKind) => void;
};

export default function DeliverableContent({
  deliverable,
  contextActions = [],
  onOpenInspector,
}: DeliverableContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pg-color-text-tertiary)]">
        <span className="rounded-full border border-[var(--pg-color-border)] px-2.5 py-1 capitalize">
          {deliverable.channel}
        </span>
        <span>{deliverable.reviewStatusLabel}</span>
      </div>

      <h3 className="text-xl font-semibold leading-snug text-[var(--pg-color-text-primary)]">
        {deliverable.title}
      </h3>

      {deliverable.targetAudience && (
        <p className="text-sm text-[var(--pg-color-text-secondary)]">
          Audience: {deliverable.targetAudience}
        </p>
      )}

      <div className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-[var(--pg-color-text-secondary)]">
        {deliverable.body}
      </div>

      {deliverable.callToAction && (
        <p className="text-sm font-medium text-[var(--pg-color-accent)]">
          Call to action: {deliverable.callToAction}
        </p>
      )}

      {deliverable.rationale && (
        <p className="text-xs leading-relaxed text-[var(--pg-color-text-tertiary)]">
          {deliverable.rationale}
        </p>
      )}

      {deliverable.reviewable && contextActions.length > 0 && onOpenInspector && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--pg-color-divider)] pt-4">
          {contextActions.map((action) => (
            <button
              key={action.kind}
              type="button"
              onClick={() => onOpenInspector(action.kind)}
              className={cn(
                "pg-focus-premium rounded-[var(--pg-radius-md)] px-3 py-1.5 text-sm font-medium",
                "text-[var(--pg-color-accent)] transition hover:bg-[var(--pg-color-accent-muted)]"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
