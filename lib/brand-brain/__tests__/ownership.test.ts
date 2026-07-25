import { describe, expect, it } from "vitest";

import {
  BRAND_BRAIN_EXCLUDED_CONCERNS,
  BRAND_BRAIN_GAPS,
  BRAND_BRAIN_MODULE_DESCRIPTIONS,
  BRAND_BRAIN_OWNED_MODULES,
} from "../ownership";

describe("brand-brain ownership", () => {
  it("declares exactly five owned modules", () => {
    expect(BRAND_BRAIN_OWNED_MODULES).toEqual([
      "identity",
      "visualIdentity",
      "toneOfVoice",
      "creativeRules",
      "assetReferences",
    ]);
  });

  it("documents every owned module", () => {
    for (const module of BRAND_BRAIN_OWNED_MODULES) {
      expect(BRAND_BRAIN_MODULE_DESCRIPTIONS[module]?.length).toBeGreaterThan(0);
    }
  });

  it("lists excluded concerns outside Brand Brain", () => {
    expect(BRAND_BRAIN_EXCLUDED_CONCERNS).toContain("products");
    expect(BRAND_BRAIN_EXCLUDED_CONCERNS).toContain("uploadedAssets");
    expect(BRAND_BRAIN_EXCLUDED_CONCERNS).toContain("performanceMetrics");
    expect(new Set(BRAND_BRAIN_EXCLUDED_CONCERNS).size).toBe(
      BRAND_BRAIN_EXCLUDED_CONCERNS.length
    );
  });

  it("does not overlap owned module keys with excluded concern keys", () => {
    const owned = new Set<string>(BRAND_BRAIN_OWNED_MODULES);
    const excluded = new Set<string>(BRAND_BRAIN_EXCLUDED_CONCERNS);
    for (const key of owned) {
      expect(excluded.has(key)).toBe(false);
    }
  });

  it("defines gap keys for future completeness scoring", () => {
    expect(BRAND_BRAIN_GAPS.length).toBeGreaterThan(0);
    expect(new Set(BRAND_BRAIN_GAPS).size).toBe(BRAND_BRAIN_GAPS.length);
  });
});
