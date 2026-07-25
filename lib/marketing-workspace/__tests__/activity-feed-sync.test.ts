import { describe, expect, it } from "vitest";
import {
  createActivity,
  syncActivityFeedWithUnderstanding,
} from "@/lib/marketing-workspace/experience/activity-feed";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";

const partialUnderstanding: MarketingUnderstanding = {
  available: true,
  sparse: true,
  completeness: 50,
  gaps: ["brandPositioning", "competitors"],
  brand: {
    mission: "Help teams grow",
    values: [{ id: "v1", name: "Clarity" }],
    toneOfVoice: { summary: "Confident" },
    keyMessages: [],
  },
  products: [{ id: "p1", name: "Platform" }],
  services: [{ id: "s1", name: "Onboarding" }],
  customerSegments: [{ id: "seg1", name: "SMB", painPoints: [], buyingTriggers: [] }],
  competitors: [],
  goals: [],
  existingContent: [],
  assembledAt: "2026-01-01T00:00:00.000Z",
};

describe("syncActivityFeedWithUnderstanding", () => {
  it("removes resolved gap activities after knowledge is saved", () => {
    const feed = [
      createActivity("gap_detected", "Detected missing information", "Company Dna", {
        relatedObject: "companyDna",
      }),
      createActivity("gap_detected", "Detected missing information", "Products", {
        relatedObject: "products",
      }),
      createActivity(
        "understanding_loaded",
        "Loaded marketing understanding",
        "13% of marketing dimensions covered."
      ),
    ];

    const next = syncActivityFeedWithUnderstanding(feed, partialUnderstanding);

    expect(next.some((item) => item.relatedObject === "companyDna")).toBe(false);
    expect(next.some((item) => item.relatedObject === "products")).toBe(false);
    expect(next.some((item) => item.relatedObject === "brandPositioning")).toBe(true);
    expect(next.find((item) => item.activityType === "understanding_loaded")?.description).toBe(
      "50% of marketing dimensions covered."
    );
  });
});
