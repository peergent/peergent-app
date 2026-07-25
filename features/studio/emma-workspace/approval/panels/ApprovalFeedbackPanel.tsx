"use client";

import { useState } from "react";
import { PgAlcove } from "@/components/design-system";

export type ApprovalFeedbackPanelProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
};

export default function ApprovalFeedbackPanel({
  open,
  onClose,
  onSubmit,
}: ApprovalFeedbackPanelProps) {
  const [message, setMessage] = useState("");

  return (
    <PgAlcove open={open} title="Give feedback" onClose={onClose}>
      <div className="emma-approval-panel">
        <label className="emma-approval-panel__field">
          <span>What should Emma change?</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="emma-approval-panel__textarea pg-focus-premium"
            placeholder="Be specific — Emma will keep your media and copy intact while revising."
          />
        </label>
        <div className="emma-approval-panel__actions">
          <button type="button" className="emma-approval-panel__cancel pg-focus-premium" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="emma-approval-panel__save pg-focus-premium"
            disabled={!message.trim()}
            onClick={() => {
              onSubmit(message.trim());
              setMessage("");
              onClose();
            }}
          >
            Send feedback
          </button>
        </div>
      </div>
    </PgAlcove>
  );
}
