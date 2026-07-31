"use client";

import { useState } from "react";
import { cn } from "@/lib/ui/cn";
import { PgFocusedMode, PgTextarea } from "@/components/design-system";
import type { ContentCopy, ContentItem } from "@/lib/office/content/types";

/**
 * §4.4 Review as a *mode change*, not a destination and not a generic modal.
 * The work itself is dominant; everything else in the product is hidden.
 *
 * "Ask for changes", never "Reject" — you do not reject a colleague's work.
 */

export type ContentReviewModeProps = {
  item: ContentItem | null;
  copy: ContentCopy;
  /** Position in the queue, e.g. "2 of 3". */
  positionLabel?: string | null;
  onExit: () => void;
  onApprove: (itemId: string) => void;
  onAskForChanges: (itemId: string, notes: string) => void;
};

export default function ContentReviewMode({
  item,
  copy,
  positionLabel,
  onExit,
  onApprove,
  onAskForChanges,
}: ContentReviewModeProps) {
  const [askingForChanges, setAskingForChanges] = useState(false);
  const [notes, setNotes] = useState("");

  function exit() {
    setAskingForChanges(false);
    setNotes("");
    onExit();
  }

  const actionButton = cn(
    "pg-focus-premium inline-flex min-h-9 items-center rounded-[var(--pg-radius-sm)]",
    "px-4 text-sm font-medium transition"
  );

  return (
    <PgFocusedMode
      open={item !== null}
      onExit={exit}
      title={copy.reviewTitle}
      positionLabel={positionLabel}
      testId="content-review-mode"
      footer={
        item ? (
          askingForChanges ? (
            <div className="flex flex-col gap-[var(--pg-space-3)]">
              <PgTextarea
                label={copy.askForChangesCta}
                placeholder={copy.changesPlaceholder}
                hint={copy.changesHint}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
              />
              <div className="flex flex-wrap items-center gap-[var(--pg-space-2)]">
                <button
                  type="button"
                  disabled={notes.trim().length === 0}
                  onClick={() => {
                    onAskForChanges(item.id, notes.trim());
                    exit();
                  }}
                  className={cn(
                    actionButton,
                    "bg-[var(--pg-color-accent)] text-[var(--pg-color-text-inverse)]",
                    "hover:bg-[var(--pg-color-accent-hover)]",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  {copy.askForChangesCta}
                </button>
                <button
                  type="button"
                  onClick={() => setAskingForChanges(false)}
                  className={cn(
                    actionButton,
                    "border border-[var(--pg-color-border)]",
                    "text-[var(--pg-color-text-secondary)]"
                  )}
                >
                  {copy.cancelCta}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-[var(--pg-space-2)]">
              <button
                type="button"
                onClick={() => {
                  onApprove(item.id);
                  exit();
                }}
                className={cn(
                  actionButton,
                  "bg-[var(--pg-color-accent)] text-[var(--pg-color-text-inverse)]",
                  "hover:bg-[var(--pg-color-accent-hover)]"
                )}
                data-testid="content-review-approve"
              >
                {copy.approveCta}
              </button>
              <button
                type="button"
                onClick={() => setAskingForChanges(true)}
                className={cn(
                  actionButton,
                  "border border-[var(--pg-color-border)]",
                  "text-[var(--pg-color-text-secondary)]",
                  "hover:text-[var(--pg-color-text-primary)]"
                )}
                data-testid="content-review-ask-changes"
              >
                {copy.askForChangesCta}
              </button>
            </div>
          )
        ) : null
      }
    >
      {item ? (
        <article className="pg-measure mx-auto flex flex-col gap-[var(--pg-space-4)]">
          <div className="flex flex-wrap items-baseline gap-[var(--pg-space-3)]">
            {item.channelLabel ? (
              <span className="pg-label">{item.channelLabel}</span>
            ) : null}
            {item.campaignTitle ? (
              <span className="pg-label">{item.campaignTitle}</span>
            ) : null}
          </div>

          <h3 className="pg-display pg-display--sm">{item.title}</h3>

          {/* The work itself — rendered as it will appear. */}
          {item.preview ? (
            <p className="pg-voice whitespace-pre-wrap">{item.preview}</p>
          ) : null}
        </article>
      ) : null}
    </PgFocusedMode>
  );
}
