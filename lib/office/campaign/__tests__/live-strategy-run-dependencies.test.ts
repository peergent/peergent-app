import { describe, expect, it } from "vitest";
import { getOptionalCapabilityDependencies } from "@/lib/brain/capabilities/capability-dependencies";

describe("strategy dependency policy", () => {
  it("treats website_understanding as optional for strategy", () => {
    expect(getOptionalCapabilityDependencies("strategy")).toContain("website_understanding");
  });
});
