import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("OfficeDeliverableReviewModal", () => {
  it("uses Vision feedback modal instead of window.prompt", () => {
    const source = readFileSync(
      "features/office/deliverable/OfficeDeliverableReviewModal.tsx",
      "utf8"
    );
    expect(source.includes("window.prompt")).toBe(false);
    expect(source.includes("OfficeDeliverableFeedbackModal")).toBe(true);
  });
});
