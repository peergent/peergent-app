import { describe, expect, it } from "vitest";
import { formatWriteNextActionLabel } from "@/lib/peer-experience/marketing/format-contextual-action-label";
import { buildMayaPresenceLine } from "@/lib/peer-experience/marketing/maya-copy";
import { resolveWorkPlaneState } from "@/lib/peer-experience/marketing/resolve-work-plane-state";

describe("formatWriteNextActionLabel", () => {
  it("uses week-two phrasing for scheduled content", () => {
    expect(formatWriteNextActionLabel("LinkedIn launch post", 2)).toBe(
      "Next up: write the week-two linkedin launch post"
    );
  });
});

describe("buildMayaPresenceLine", () => {
  it("returns human presence for write_next, not task metadata", () => {
    const line = buildMayaPresenceLine({
      kind: "write_next",
      planActivityReference: "Post",
      title: "LinkedIn launch post",
      scheduledWeek: 2,
    });
    expect(line).toBe("I'm here when you're ready.");
    expect(line).not.toContain("week");
  });
});

describe("resolveWorkPlaneState", () => {
  it("maps reviewable content to review", () => {
    expect(
      resolveWorkPlaneState({
        kind: "content",
        draftId: "d1",
        title: "Post",
        channel: "linkedin",
        body: "Hi",
        reviewStatusLabel: "Awaiting your review",
        reviewable: true,
      })
    ).toBe("review");
  });

  it("maps working empty deliverable to working", () => {
    expect(
      resolveWorkPlaneState({
        kind: "empty",
        title: "Post",
        message: "Writing",
        working: true,
      })
    ).toBe("working");
  });
});
