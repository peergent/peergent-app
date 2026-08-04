import { describe, expect, it } from "vitest";
import {
  dedupeEvidenceItems,
  evidenceItemKey,
  normalizeEvidenceItem,
} from "@/lib/brain/presentation/dedupe-evidence-items";
import { presentBrainOutputForCampaign } from "@/lib/brain/presentation/campaign-evidence-adapter";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";

describe("dedupeEvidenceItems", () => {
  it("removes exact duplicates case-insensitively", () => {
    const items = dedupeEvidenceItems([
      "Deliverable plan must not contain final generated copy.",
      "deliverable plan must not contain final generated copy.",
      "Unique note",
    ]);
    expect(items).toEqual([
      "Deliverable plan must not contain final generated copy.",
      "Unique note",
    ]);
  });

  it("collapses whitespace when comparing duplicates", () => {
    const items = dedupeEvidenceItems([
      "Same   message",
      "same message",
    ]);
    expect(items).toEqual(["Same   message"]);
  });

  it("produces stable React keys per section index", () => {
    expect(evidenceItemKey("warnings", 0)).toBe("warnings-0");
    expect(evidenceItemKey("warnings", 1)).toBe("warnings-1");
    expect(evidenceItemKey("warnings", 0)).not.toBe(evidenceItemKey("warnings", 1));
  });

  it("normalizes text for comparison", () => {
    expect(normalizeEvidenceItem("  Hello   World  ")).toBe("hello world");
  });
});

describe("creative generation evidence presentation", () => {
  function outputWithDuplicatePlanningWarnings(): BrainStructuredOutput {
    const message = "Deliverable plan must not contain final generated copy.";
    return {
      capabilityId: "creative_generation",
      capabilityVersion: getBrainCapability("creative_generation").version,
      generatedAt: "2026-08-01T00:00:00.000Z",
      findings: [
        {
          id: "del-1",
          label: "Deliverable 1",
          value: JSON.stringify({ deliverableType: "linkedin_carousel", channel: "linkedin" }),
          confidence: "medium",
          provenance: [{ kind: "assumption", refId: "test" }],
        },
      ],
      decisions: [],
      recommendations: [],
      actionProposals: [],
      executionResults: [],
      warnings: [
        { id: "q-1", code: "generated_copy_in_plan", message, provenance: [{ kind: "assumption", refId: "q" }] },
        { id: "q-2", code: "generated_copy_in_plan", message, provenance: [{ kind: "assumption", refId: "q" }] },
      ],
      errors: [],
    };
  }

  it("maps internal planning warnings to a single customer note", () => {
    const presentation = presentBrainOutputForCampaign({
      title: "Deliverables",
      output: outputWithDuplicatePlanningWarnings(),
      locale: "en",
    });
    const warnings = presentation.sections.find((section) => section.id === "warnings");
    expect(warnings?.items).toHaveLength(1);
    expect(warnings?.items[0]).toContain("plans and directions");
    expect(warnings?.items[0]).not.toContain("Deliverable plan must not contain");
  });
});
