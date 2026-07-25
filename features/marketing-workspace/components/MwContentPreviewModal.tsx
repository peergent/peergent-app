"use client";

import ApprovalPreviewRenderer from "@/features/studio/emma-workspace/approval/ApprovalPreviewRenderer";
import type { ApprovalDeliverable } from "@/lib/peer-experience/marketing/approval/types";
import MwModal from "./MwModal";

export type MwContentPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  deliverable: ApprovalDeliverable | null;
};

export default function MwContentPreviewModal({
  open,
  onClose,
  deliverable,
}: MwContentPreviewModalProps) {
  if (!deliverable) return null;

  return (
    <MwModal open={open} onClose={onClose} title="Preview" subtitle="Exactly how this looks in context.">
      <div className="mw-post-preview">
        <ApprovalPreviewRenderer deliverable={deliverable} />
      </div>
    </MwModal>
  );
}
