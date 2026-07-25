"use client";

import { useState } from "react";
import { PgAlcove } from "@/components/design-system";

export type ApprovalSchedulePanelProps = {
  open: boolean;
  timezone: string;
  onClose: () => void;
  onConfirm: (scheduledAt: string, timezone: string) => void;
};

export default function ApprovalSchedulePanel({
  open,
  timezone: initialTz,
  onClose,
  onConfirm,
}: ApprovalSchedulePanelProps) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [timezone, setTimezone] = useState(initialTz);

  return (
    <PgAlcove open={open} title="Approve & schedule" onClose={onClose}>
      <div className="emma-approval-panel">
        <label className="emma-approval-panel__field">
          <span>Publish date & time</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="emma-approval-panel__input pg-focus-premium"
            required
          />
        </label>
        <label className="emma-approval-panel__field">
          <span>Timezone</span>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
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
            disabled={!scheduledAt}
            onClick={() => {
              onConfirm(new Date(scheduledAt).toISOString(), timezone);
              onClose();
            }}
          >
            Approve & schedule
          </button>
        </div>
      </div>
    </PgAlcove>
  );
}
