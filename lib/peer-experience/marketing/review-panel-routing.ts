import type { DeliverableContentViewModel, DeliverableViewModel } from "../types";
import type { DetailSlideOverKind } from "../types";

export function isDeliverableInReview(
  deliverable: DeliverableViewModel
): deliverable is DeliverableContentViewModel & { reviewable: true } {
  return deliverable.kind === "content" && deliverable.reviewable;
}

/** During review, supporting context opens in inspector — not full-screen slide-over. */
export function shouldOpenDetailInInspector(isReviewActive: boolean): boolean {
  return isReviewActive;
}

export type DetailPanelTarget = "inspector" | "slide-over";

export function resolveDetailPanelTarget(
  isReviewActive: boolean
): DetailPanelTarget {
  return shouldOpenDetailInInspector(isReviewActive) ? "inspector" : "slide-over";
}

export function detailPanelTitle(kind: DetailSlideOverKind): string {
  switch (kind) {
    case "business-context":
      return "Business context";
    case "strategy":
      return "Marketing strategy";
    case "plan":
      return "Campaign plan";
    case "explainability":
      return "Why did Maya decide this?";
  }
}
