import { describe, expect, it } from "vitest";

import {
  CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS,
  CAMPAIGN_EXECUTOR_GAPS,
  CAMPAIGN_EXECUTOR_MODULE_DESCRIPTIONS,
  CAMPAIGN_EXECUTOR_OWNED_MODULES,
  CAMPAIGN_EXECUTOR_REQUIRED_SECTIONS,
} from "../ownership";

describe("campaign executor ownership", () => {
  it("declares owned executor modules", () => {
    expect(CAMPAIGN_EXECUTOR_OWNED_MODULES).toEqual([
      "planToOperationTranslation",
      "operationOrdering",
      "idempotency",
      "executionRestrictions",
      "ownerAssignmentProposals",
      "dependencyLinkProposals",
      "campaignTargetStatusProposals",
    ]);
    expect(CAMPAIGN_EXECUTOR_OWNED_MODULES).toHaveLength(7);
  });

  it("requires every owned module", () => {
    expect(CAMPAIGN_EXECUTOR_REQUIRED_SECTIONS).toEqual(CAMPAIGN_EXECUTOR_OWNED_MODULES);
  });

  it("documents every owned module", () => {
    for (const module of CAMPAIGN_EXECUTOR_OWNED_MODULES) {
      expect(CAMPAIGN_EXECUTOR_MODULE_DESCRIPTIONS[module]?.length).toBeGreaterThan(0);
    }
  });

  it("lists excluded concerns", () => {
    expect(CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS).toContain("workUnitPersistence");
    expect(CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS).toContain("hooks");
    expect(new Set(CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS).size).toBe(
      CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS.length
    );
  });

  it("does not overlap owned modules with excluded concerns", () => {
    const owned = new Set<string>(CAMPAIGN_EXECUTOR_OWNED_MODULES);
    for (const concern of CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS) {
      expect(owned.has(concern)).toBe(false);
    }
  });

  it("aligns gap keys with owned modules", () => {
    expect(CAMPAIGN_EXECUTOR_GAPS).toEqual(CAMPAIGN_EXECUTOR_OWNED_MODULES);
  });
});
