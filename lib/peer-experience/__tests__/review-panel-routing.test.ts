import { describe, expect, it } from "vitest";
import type { DeliverableViewModel } from "@/lib/peer-experience";
import {
  detailPanelTitle,
  isDeliverableInReview,
  resolveDetailPanelTarget,
  shouldOpenDetailInInspector,
} from "@/lib/peer-experience/marketing/review-panel-routing";

const reviewableDraft: DeliverableViewModel = {
  kind: "content",
  draftId: "d1",
  title: "LinkedIn post",
  channel: "linkedin",
  body: "Hello",
  reviewStatusLabel: "Awaiting your review",
  reviewable: true,
};

const approvedDraft: DeliverableViewModel = {
  ...reviewableDraft,
  reviewable: false,
  reviewStatusLabel: "Approved",
};

describe("review-panel-routing", () => {
  it("detects active review state", () => {
    expect(isDeliverableInReview(reviewableDraft)).toBe(true);
    expect(isDeliverableInReview(approvedDraft)).toBe(false);
    expect(isDeliverableInReview({ kind: "empty", title: "", message: "" })).toBe(false);
  });

  it("routes detail panels to inspector during review", () => {
    expect(shouldOpenDetailInInspector(true)).toBe(true);
    expect(shouldOpenDetailInInspector(false)).toBe(false);
    expect(resolveDetailPanelTarget(true)).toBe("inspector");
    expect(resolveDetailPanelTarget(false)).toBe("slide-over");
  });

  it("uses human panel titles", () => {
    expect(detailPanelTitle("plan")).toBe("Campaign plan");
    expect(detailPanelTitle("explainability")).toBe("Why did Maya decide this?");
  });
});
