import { describe, expect, it } from "vitest";

import {
  MARKETING_DECISION_EXCLUDED_CONCERNS,
  MARKETING_DECISION_GAPS,
  MARKETING_DECISION_MODULE_DESCRIPTIONS,
  MARKETING_DECISION_OWNED_MODULES,
} from "../ownership";

describe("marketing-decision ownership", () => {
  it("declares owned decision modules", () => {
    expect(MARKETING_DECISION_OWNED_MODULES).toContain("eligibility");
    expect(MARKETING_DECISION_OWNED_MODULES).toContain("channelRecommendations");
    expect(MARKETING_DECISION_OWNED_MODULES.length).toBeGreaterThan(10);
  });

  it("documents every owned module", () => {
    for (const module of MARKETING_DECISION_OWNED_MODULES) {
      expect(MARKETING_DECISION_MODULE_DESCRIPTIONS[module]?.length).toBeGreaterThan(0);
    }
  });

  it("lists excluded dependency concerns", () => {
    expect(MARKETING_DECISION_EXCLUDED_CONCERNS).toContain("marketingStrategy");
    expect(MARKETING_DECISION_EXCLUDED_CONCERNS).toContain("creativeBrief");
    expect(MARKETING_DECISION_EXCLUDED_CONCERNS).toContain("performanceBrain");
  });

  it("does not overlap owned modules with excluded keys", () => {
    const owned = new Set<string>(MARKETING_DECISION_OWNED_MODULES);
    for (const concern of MARKETING_DECISION_EXCLUDED_CONCERNS) {
      expect(owned.has(concern)).toBe(false);
    }
  });

  it("defines gap keys for missing inputs", () => {
    expect(MARKETING_DECISION_GAPS).toContain("marketingPlan");
    expect(new Set(MARKETING_DECISION_GAPS).size).toBe(MARKETING_DECISION_GAPS.length);
  });
});
