import { describe, expect, it } from "vitest";

import {
  CAMPAIGN_PLANNER_EXCLUDED_CONCERNS,
  CAMPAIGN_PLANNER_GAPS,
  CAMPAIGN_PLANNER_MODULE_DESCRIPTIONS,
  CAMPAIGN_PLANNER_OWNED_MODULES,
  CAMPAIGN_PLANNER_REQUIRED_SECTIONS,
} from "../ownership";

describe("campaign planner ownership", () => {
  it("declares owned planner modules", () => {
    expect(CAMPAIGN_PLANNER_OWNED_MODULES).toEqual([
      "workDecomposition",
      "deterministicSequencing",
      "dependencies",
      "recommendedOwnership",
      "effortBands",
      "approvalPlacement",
      "planGaps",
      "existingWorkMergeInterpretation",
    ]);
    expect(CAMPAIGN_PLANNER_OWNED_MODULES).toHaveLength(8);
  });

  it("requires every owned module", () => {
    expect(CAMPAIGN_PLANNER_REQUIRED_SECTIONS).toEqual(CAMPAIGN_PLANNER_OWNED_MODULES);
  });

  it("documents every owned module", () => {
    for (const module of CAMPAIGN_PLANNER_OWNED_MODULES) {
      expect(CAMPAIGN_PLANNER_MODULE_DESCRIPTIONS[module]?.length).toBeGreaterThan(0);
    }
  });

  it("lists excluded concerns", () => {
    expect(CAMPAIGN_PLANNER_EXCLUDED_CONCERNS).toContain("workUnitPersistence");
    expect(CAMPAIGN_PLANNER_EXCLUDED_CONCERNS).toContain("aiRuntime");
    expect(new Set(CAMPAIGN_PLANNER_EXCLUDED_CONCERNS).size).toBe(
      CAMPAIGN_PLANNER_EXCLUDED_CONCERNS.length
    );
  });

  it("does not overlap owned modules with excluded concerns", () => {
    const owned = new Set<string>(CAMPAIGN_PLANNER_OWNED_MODULES);
    for (const concern of CAMPAIGN_PLANNER_EXCLUDED_CONCERNS) {
      expect(owned.has(concern)).toBe(false);
    }
  });

  it("aligns gap keys with owned modules", () => {
    expect(CAMPAIGN_PLANNER_GAPS).toEqual(CAMPAIGN_PLANNER_OWNED_MODULES);
  });
});
