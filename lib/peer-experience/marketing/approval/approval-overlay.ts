import type {
  ApprovalDeliverableContent,
  ApprovalMediaAsset,
  ApprovalPublishing,
  ApprovalFeedbackEntry,
} from "./types";

/** Persisted approval edits — keyed by draft id in marketing workspace storage. */
export type ApprovalDeliverableOverlay = {
  draftId: string;
  content?: Partial<ApprovalDeliverableContent>;
  media?: ApprovalMediaAsset[];
  publishing?: Partial<ApprovalPublishing>;
  feedback?: ApprovalFeedbackEntry[];
  updatedAt: string;
};

export function mergeApprovalOverlay(
  base: ApprovalDeliverableOverlay | undefined,
  draftId: string,
  patch: Partial<Omit<ApprovalDeliverableOverlay, "draftId" | "updatedAt">>
): ApprovalDeliverableOverlay {
  return {
    draftId,
    content: patch.content ? { ...base?.content, ...patch.content } : base?.content,
    media: patch.media ?? base?.media,
    publishing: patch.publishing
      ? { ...base?.publishing, ...patch.publishing }
      : base?.publishing,
    feedback: patch.feedback ?? base?.feedback,
    updatedAt: new Date().toISOString(),
  };
}
