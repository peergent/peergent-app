"use client";

import { PgAlcove } from "@/components/design-system";

export type ApprovalMediaLibraryPanelProps = {
  open: boolean;
  onClose: () => void;
};

export default function ApprovalMediaLibraryPanel({
  open,
  onClose,
}: ApprovalMediaLibraryPanelProps) {
  return (
    <PgAlcove open={open} title="Media library" onClose={onClose}>
      <div className="emma-approval-panel">
        <p className="emma-voice">
          Your media library will appear here once it is connected.
        </p>
        <button type="button" className="emma-approval-panel__disabled pg-focus-premium" disabled>
          Browse library (coming soon)
        </button>
      </div>
    </PgAlcove>
  );
}
