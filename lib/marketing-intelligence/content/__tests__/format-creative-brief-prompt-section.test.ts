import { describe, expect, it } from "vitest";
import type { CreativeBrief } from "@/lib/creative-brief";
import { formatCreativeBriefPromptSection } from "../format-creative-brief-prompt-section";

const minimalBrief: CreativeBrief = {
  id: "brief-internal-1",
  organizationId: "org-1",
  title: "Test",
  status: "ready",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  assemblyTrace: ["internal:trace:should-not-appear"],
  campaignGoal: { summary: "Drive demos" },
  audience: { segmentLabel: "Ops leaders" },
  channel: { channel: "linkedin", placement: "Company page" },
  contentType: "social_post",
  tone: { directive: "Clear and confident", traits: ["Direct"] },
  cta: { primary: "Book a demo" },
  messagingPriorities: {
    primaryMessage: "Delegate to AI colleagues",
    supportingMessages: ["Stay in control"],
    proofPoints: ["Used by 200 teams"],
  },
  visualPriorities: { summary: "Product UI context" },
  requiredAssets: [],
  forbiddenClaims: ["Guaranteed ROI"],
  forbiddenWords: ["revolutionary"],
  requiredDisclaimers: [{ id: "d1", text: "Results vary." }],
  platformConstraints: { maxCharacters: 3000, linkRules: ["Use tracked links only"] },
  outputRequirements: { deliverableSummary: "One LinkedIn post" },
  approvalRequirements: {
    legalReviewRequired: false,
    brandReviewRequired: true,
    notes: "Brand review before publish",
  },
};

describe("formatCreativeBriefPromptSection", () => {
  it("includes delimiters and key creative fields", () => {
    const section = formatCreativeBriefPromptSection(minimalBrief);
    expect(section).toContain("--- Creative Brief Constraints ---");
    expect(section).toContain("Campaign goal: Drive demos");
    expect(section).toContain("Forbidden words");
    expect(section).toContain("- revolutionary");
    expect(section).toContain("Results vary.");
  });

  it("omits empty sections", () => {
    const section = formatCreativeBriefPromptSection({
      ...minimalBrief,
      cta: { primary: "Book a demo" },
      messagingPriorities: { primaryMessage: "Hello" },
      forbiddenClaims: [],
      forbiddenWords: [],
      requiredDisclaimers: [],
      tone: { directive: "Calm" },
    });
    expect(section).not.toContain("Forbidden claims:");
    expect(section).not.toContain("Supporting messages");
  });

  it("does not expose internal ids, evidence or assembly trace", () => {
    const section = formatCreativeBriefPromptSection(minimalBrief);
    expect(section).not.toContain("brief-internal-1");
    expect(section).not.toContain("assemblyTrace");
    expect(section).not.toContain("internal:trace");
    expect(section).not.toContain("org-1");
  });

  it("is deterministic for identical input", () => {
    const a = formatCreativeBriefPromptSection(minimalBrief);
    const b = formatCreativeBriefPromptSection(minimalBrief);
    expect(a).toBe(b);
  });
});
