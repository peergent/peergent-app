import { describe, expect, it } from "vitest";

import {
  CAMPAIGN_EXCLUDED_CONCERNS,
  CAMPAIGN_GAPS,
  CAMPAIGN_IDENTITY_FIELDS,
  CAMPAIGN_MODULE_DESCRIPTIONS,
  CAMPAIGN_OWNED_MODULES,
  CAMPAIGN_REQUIRED_SECTIONS,
} from "../ownership";

describe("campaign ownership", () => {
  it("declares six owned modules matching campaign sections", () => {
    expect(CAMPAIGN_OWNED_MODULES).toEqual([
      "goal",
      "audience",
      "execution",
      "references",
      "performance",
      "workforce",
    ]);
    expect(CAMPAIGN_OWNED_MODULES).toHaveLength(6);
  });

  it("requires every owned module on a complete campaign", () => {
    expect(CAMPAIGN_REQUIRED_SECTIONS).toEqual(CAMPAIGN_OWNED_MODULES);
  });

  it("documents identity fields separately from owned modules", () => {
    expect(CAMPAIGN_IDENTITY_FIELDS).toEqual([
      "id",
      "organizationId",
      "name",
      "description",
    ]);
    for (const field of CAMPAIGN_IDENTITY_FIELDS) {
      expect(CAMPAIGN_OWNED_MODULES as readonly string[]).not.toContain(field);
    }
  });

  it("documents every owned module", () => {
    for (const module of CAMPAIGN_OWNED_MODULES) {
      expect(CAMPAIGN_MODULE_DESCRIPTIONS[module]?.length).toBeGreaterThan(0);
    }
  });

  it("lists excluded dependency concerns", () => {
    expect(CAMPAIGN_EXCLUDED_CONCERNS).toEqual([
      "brandBrain",
      "businessBrain",
      "marketingUnderstanding",
      "creativeBriefContents",
      "marketingDecisionContents",
      "assets",
      "generatedContentBodies",
      "renderer",
      "publishing",
      "contextEngine",
      "promptBuilder",
      "aiRuntime",
      "storage",
    ]);
    expect(new Set(CAMPAIGN_EXCLUDED_CONCERNS).size).toBe(
      CAMPAIGN_EXCLUDED_CONCERNS.length
    );
  });

  it("does not overlap owned modules with excluded concerns", () => {
    const owned = new Set<string>(CAMPAIGN_OWNED_MODULES);
    for (const concern of CAMPAIGN_EXCLUDED_CONCERNS) {
      expect(owned.has(concern)).toBe(false);
    }
  });

  it("aligns gap keys with owned modules for completeness scoring", () => {
    expect(CAMPAIGN_GAPS).toEqual(CAMPAIGN_OWNED_MODULES);
    expect(new Set(CAMPAIGN_GAPS).size).toBe(CAMPAIGN_GAPS.length);
  });
});
