import { describe, expect, it } from "vitest";

import {
  CREATIVE_BRIEF_EXCLUDED_CONCERNS,
  CREATIVE_BRIEF_GAPS,
  CREATIVE_BRIEF_MODULE_DESCRIPTIONS,
  CREATIVE_BRIEF_OWNED_MODULES,
  CREATIVE_BRIEF_REQUIRED_SECTIONS,
} from "../ownership";

describe("creative-brief ownership", () => {
  it("declares fifteen owned modules matching creative brief sections", () => {
    expect(CREATIVE_BRIEF_OWNED_MODULES).toEqual([
      "campaignGoal",
      "audience",
      "channel",
      "contentType",
      "tone",
      "cta",
      "messagingPriorities",
      "visualPriorities",
      "requiredAssets",
      "forbiddenClaims",
      "forbiddenWords",
      "requiredDisclaimers",
      "platformConstraints",
      "outputRequirements",
      "approvalRequirements",
    ]);
    expect(CREATIVE_BRIEF_OWNED_MODULES).toHaveLength(15);
  });

  it("requires every owned module on a complete brief", () => {
    expect(CREATIVE_BRIEF_REQUIRED_SECTIONS).toEqual(CREATIVE_BRIEF_OWNED_MODULES);
  });

  it("documents every owned module", () => {
    for (const module of CREATIVE_BRIEF_OWNED_MODULES) {
      expect(CREATIVE_BRIEF_MODULE_DESCRIPTIONS[module]?.length).toBeGreaterThan(0);
    }
  });

  it("lists excluded dependency concerns", () => {
    expect(CREATIVE_BRIEF_EXCLUDED_CONCERNS).toEqual([
      "brandBrain",
      "businessBrain",
      "performance",
      "renderer",
      "publishing",
      "templates",
    ]);
    expect(new Set(CREATIVE_BRIEF_EXCLUDED_CONCERNS).size).toBe(
      CREATIVE_BRIEF_EXCLUDED_CONCERNS.length
    );
  });

  it("does not overlap owned modules with excluded concerns", () => {
    const owned = new Set<string>(CREATIVE_BRIEF_OWNED_MODULES);
    for (const concern of CREATIVE_BRIEF_EXCLUDED_CONCERNS) {
      expect(owned.has(concern)).toBe(false);
    }
  });

  it("aligns gap keys with owned modules for completeness scoring", () => {
    expect(CREATIVE_BRIEF_GAPS).toEqual(CREATIVE_BRIEF_OWNED_MODULES);
    expect(new Set(CREATIVE_BRIEF_GAPS).size).toBe(CREATIVE_BRIEF_GAPS.length);
  });
});
