"use client";

import { PgAlcove } from "@/components/design-system";
import type { ApprovalRationale } from "@/lib/peer-experience/marketing/approval/types";

export type ApprovalRationalePanelProps = {
  open: boolean;
  rationale: ApprovalRationale;
  onClose: () => void;
};

export default function ApprovalRationalePanel({
  open,
  rationale,
  onClose,
}: ApprovalRationalePanelProps) {
  return (
    <PgAlcove open={open} title="Why Emma chose this" onClose={onClose}>
      <div className="emma-approval-panel emma-approval-rationale">
        <p className="emma-voice">{rationale.summary}</p>
        {rationale.objective && (
          <>
            <p className="emma-card-label">Objective</p>
            <p className="emma-card-value">{rationale.objective}</p>
          </>
        )}
        {rationale.audience && (
          <>
            <p className="emma-card-label">Audience</p>
            <p className="emma-card-value">{rationale.audience}</p>
          </>
        )}
        {rationale.whyThisCopy && (
          <>
            <p className="emma-card-label">Copy</p>
            <p className="emma-voice emma-voice--muted">{rationale.whyThisCopy}</p>
          </>
        )}
        {rationale.whyThisMedia && (
          <>
            <p className="emma-card-label">Media</p>
            <p className="emma-voice emma-voice--muted">{rationale.whyThisMedia}</p>
          </>
        )}
        {rationale.whyThisTiming && (
          <>
            <p className="emma-card-label">Timing</p>
            <p className="emma-voice emma-voice--muted">{rationale.whyThisTiming}</p>
          </>
        )}
      </div>
    </PgAlcove>
  );
}
