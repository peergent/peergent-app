import { describe, expect, it } from "vitest";
import { normalizeNeedsYouTitle } from "@/lib/customer-v17/sanitize-v17-customer-text";
import { v17AttentionCtas } from "@/lib/customer-v17/build-v17-cc-attention";

describe("v17 localization sanitization", () => {
  it("normalizes Dutch review titles", () => {
    expect(normalizeNeedsYouTitle("Review campaign plan", "nl")).toBe("Campagneplan beoordelen");
    expect(normalizeNeedsYouTitle("Review marketing strategy", "nl")).toBe(
      "Campagnestrategie beoordelen"
    );
  });

  it("does not duplicate CTA labels when only review exists", () => {
    const ctas = v17AttentionCtas(
      {
        id: "1",
        title: "Campagneplan beoordelen",
        contextLine: "Marketing",
        readinessLine: "klaar",
        reviewHref: "/review/1",
        approveHref: null,
        serviceKey: "marketing",
        peerId: "p1",
      },
      { reviewCta: "Beoordelen", viewCta: "Bekijken", approveCta: "Goedkeuren" }
    );
    expect(ctas.primary.label).toBe("Beoordelen");
    expect(ctas.secondary).toBeNull();
  });
});
