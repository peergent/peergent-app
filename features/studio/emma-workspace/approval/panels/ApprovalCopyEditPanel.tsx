"use client";

import { useEffect, useState } from "react";
import { PgAlcove } from "@/components/design-system";
import type { ApprovalDeliverableContent } from "@/lib/peer-experience/marketing/approval/types";

export type ApprovalCopyEditPanelProps = {
  open: boolean;
  content: ApprovalDeliverableContent;
  onClose: () => void;
  onSave: (content: ApprovalDeliverableContent) => void;
};

export default function ApprovalCopyEditPanel({
  open,
  content,
  onClose,
  onSave,
}: ApprovalCopyEditPanelProps) {
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    if (open) setDraft(content);
  }, [open, content]);

  return (
    <PgAlcove open={open} title="Edit copy" onClose={onClose}>
      <div className="emma-approval-panel">
        <label className="emma-approval-panel__field">
          <span>Headline</span>
          <input
            type="text"
            value={draft.headline ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
            className="emma-approval-panel__input pg-focus-premium"
          />
        </label>
        <label className="emma-approval-panel__field">
          <span>Caption</span>
          <textarea
            value={draft.caption ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
            rows={5}
            className="emma-approval-panel__textarea pg-focus-premium"
          />
        </label>
        <label className="emma-approval-panel__field">
          <span>Hashtags (space-separated)</span>
          <input
            type="text"
            value={(draft.hashtags ?? []).join(" ")}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                hashtags: e.target.value.split(/\s+/).filter(Boolean),
              }))
            }
            className="emma-approval-panel__input pg-focus-premium"
          />
        </label>
        <label className="emma-approval-panel__field">
          <span>First comment</span>
          <textarea
            value={draft.firstComment ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, firstComment: e.target.value }))}
            rows={2}
            className="emma-approval-panel__textarea pg-focus-premium"
          />
        </label>
        <label className="emma-approval-panel__field">
          <span>Call to action</span>
          <input
            type="text"
            value={draft.callToAction ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, callToAction: e.target.value }))}
            className="emma-approval-panel__input pg-focus-premium"
          />
        </label>
        <label className="emma-approval-panel__field">
          <span>Destination URL</span>
          <input
            type="url"
            value={draft.destinationUrl ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, destinationUrl: e.target.value }))}
            className="emma-approval-panel__input pg-focus-premium"
          />
        </label>
        <div className="emma-approval-panel__actions">
          <button type="button" className="emma-approval-panel__cancel pg-focus-premium" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="emma-approval-panel__save pg-focus-premium"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Save changes
          </button>
        </div>
      </div>
    </PgAlcove>
  );
}
