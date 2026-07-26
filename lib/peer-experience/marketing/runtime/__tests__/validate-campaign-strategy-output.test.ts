import { describe, expect, it } from "vitest";

import { validateCampaignStrategyWorkUnitOutput } from "../validate-campaign-strategy-output";

describe("validateCampaignStrategyWorkUnitOutput", () => {
  it("accepts complete strategy output", () => {
    const result = validateCampaignStrategyWorkUnitOutput({
      title: "Launch — Campaign strategy",
      summary: "Summary",
      positioning: "Position as peers",
      messagingPillars: ["Leverage"],
      recommendedChannels: ["LinkedIn"],
      ctaGuidance: "Book a demo",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing messaging pillars", () => {
    const result = validateCampaignStrategyWorkUnitOutput({
      title: "T",
      summary: "S",
      positioning: "P",
      messagingPillars: [],
      recommendedChannels: ["LinkedIn"],
      ctaGuidance: "CTA",
    });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.errors.some((e) => /pillar/i.test(e))).toBe(true);
  });
});
