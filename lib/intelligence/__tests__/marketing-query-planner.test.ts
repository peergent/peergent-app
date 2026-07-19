import { describe, expect, it } from "vitest";
import { planMarketingBusinessBrainQuery } from "@/lib/intelligence/retrieval/marketing-query-planner";

describe("planMarketingBusinessBrainQuery", () => {
  it("includes core marketing entity types by default", () => {
    const plan = planMarketingBusinessBrainQuery();

    expect(plan.includeEntityTypes).toEqual(
      expect.arrayContaining([
        "customerSegments",
        "products",
        "services",
        "competitors",
        "knowledgeSources",
        "facts",
      ])
    );
  });

  it("boosts competitors when task hint mentions positioning", () => {
    const plan = planMarketingBusinessBrainQuery("Review competitor positioning");

    expect(plan.includeEntityTypes).toContain("competitors");
    expect(plan.searchTerms.length).toBeGreaterThan(0);
  });
});
