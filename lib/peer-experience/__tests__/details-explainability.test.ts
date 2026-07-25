import { describe, expect, it } from "vitest";
import { presentExplainability } from "@/lib/peer-experience/marketing/details-explainability";

describe("presentExplainability", () => {
  it("maps explainability to human presentation without artifact enums", () => {
    const presentation = presentExplainability({
      artifact: "strategy",
      title: "Marketing strategy",
      reasoning: "I focused on audiences with the highest conversion potential.",
      evidence: ["SMB segment priority", "Product-led positioning"],
      sourceReferences: ["marketing-understanding", "company-dna"],
      confidence: "high",
    });

    expect(presentation.summary).toContain("conversion potential");
    expect(presentation.confidenceLabel).toBe("High confidence");
    expect(JSON.stringify(presentation)).not.toContain("ready_to_publish");
    expect(presentation.supportingPoints[0]).toContain("Marketing Understanding");
  });
});
