import { describe, expect, it } from "vitest";

import {
  campaignContentTargetKey,
  channelHasConcreteContentTarget,
  isGenericChannelPlaceholderTitle,
} from "../content-target-identity";

describe("campaignContentTargetKey", () => {
  it("normalizes channel and deliverable type", () => {
    expect(campaignContentTargetKey("LinkedIn", "social_post", "")).toBe("linkedin|social_post|");
    expect(campaignContentTargetKey("Email", "email", "")).toBe("email|email|");
    expect(campaignContentTargetKey("Campaign", "campaign_concept", "")).toBe(
      "campaign|campaign_concept|"
    );
  });
});

describe("channelHasConcreteContentTarget", () => {
  it("detects concrete targets per normalized channel", () => {
    const targets = [
      { channel: "LinkedIn", deliverableType: "social_post" },
      { channel: "Email", deliverableType: "email" },
    ];
    expect(channelHasConcreteContentTarget("linkedin", targets)).toBe(true);
    expect(channelHasConcreteContentTarget("Email", targets)).toBe(true);
    expect(channelHasConcreteContentTarget("Instagram", targets)).toBe(false);
  });

  it("ignores generic placeholders in the target list", () => {
    const targets = [{ channel: "LinkedIn", deliverableType: "generic" }];
    expect(channelHasConcreteContentTarget("LinkedIn", targets)).toBe(false);
  });
});

describe("isGenericChannelPlaceholderTitle", () => {
  it("matches planner channel-only fallback titles", () => {
    expect(isGenericChannelPlaceholderTitle("LinkedIn", "LinkedIn deliverable")).toBe(true);
    expect(isGenericChannelPlaceholderTitle("Email", "Email deliverable")).toBe(true);
    expect(isGenericChannelPlaceholderTitle("LinkedIn", "Social post — LinkedIn")).toBe(false);
  });
});
