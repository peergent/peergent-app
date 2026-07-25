import { describe, expect, it } from "vitest";
import { buildStudioAnnouncement } from "@/lib/studio/build-studio-announcement";

describe("buildStudioAnnouncement", () => {
  it("prioritises archive context", () => {
    expect(
      buildStudioAnnouncement({
        workPlaneState: "document",
        archiveLabel: "Strategy",
        presenceLine: "I'm here",
      })
    ).toBe("Archive: Strategy");
  });

  it("announces review state for screen readers", () => {
    expect(
      buildStudioAnnouncement({
        workPlaneState: "review",
        presenceLine: "I've left something here",
      })
    ).toBe("Draft ready for your review");
  });
});
