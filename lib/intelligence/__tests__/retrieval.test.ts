import { describe, expect, it } from "vitest";
import { planBusinessBrainQuery } from "@/lib/intelligence/retrieval/query-planner";
import { rankFacts } from "@/lib/intelligence/retrieval/fact-ranker";
import type { BusinessFact } from "@/lib/business-brain";

describe("planBusinessBrainQuery", () => {
  it("includes sales-default entities for Sales role", () => {
    const plan = planBusinessBrainQuery("Sales");
    expect(plan.includeEntityTypes).toContain("competitors");
    expect(plan.includeEntityTypes).toContain("customerSegments");
  });

  it("boosts competitors when task mentions competitor", () => {
    const plan = planBusinessBrainQuery("Custom", "Compare us vs competitor Acme");
    expect(plan.includeEntityTypes).toContain("competitors");
  });
});

describe("rankFacts", () => {
  it("ranks high-importance verified facts first", () => {
    const facts: BusinessFact[] = [
      {
        id: "1",
        businessBrainId: "b",
        subject: "A",
        predicate: "is",
        value: "low",
        confidence: "low",
        verified: false,
        importance: "low",
        lastUpdated: "2026-01-01",
        metadata: {},
        sortOrder: 0,
        createdAt: "2026-01-01",
      },
      {
        id: "2",
        businessBrainId: "b",
        subject: "B",
        predicate: "is",
        value: "high",
        confidence: "high",
        verified: true,
        importance: "high",
        lastUpdated: "2026-01-01",
        metadata: {},
        sortOrder: 1,
        createdAt: "2026-01-01",
      },
    ];

    const ranked = rankFacts(facts, []);
    expect(ranked[0]?.id).toBe("2");
  });
});
