import { describe, expect, it } from "vitest";

import {
  CREATIVE_BRIEF_OWNED_MODULES,
  CREATIVE_BRIEF_REQUIRED_SECTIONS,
} from "../ownership";
import type { CreativeBrief, CreativeBriefContextSlice } from "../types";

export const FIXTURE_CREATIVE_BRIEF: CreativeBrief = {
  id: "brief-1",
  organizationId: "org-1",
  title: "Q3 LinkedIn launch",
  status: "ready",
  version: 1,
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-02T12:00:00.000Z",
  campaignGoal: {
    summary: "Drive qualified demo requests from ops leaders.",
    objective: "Pipeline",
    successMetric: "20 MQLs",
    deadline: "2026-09-30",
  },
  audience: {
    segmentLabel: "Mid-market ops leaders",
    description: "Teams evaluating AI workforce tools",
    painPoints: ["Manual qualification"],
    buyingTriggers: ["Headcount freeze"],
  },
  channel: {
    channel: "linkedin",
    placement: "Company page + employee advocacy",
  },
  contentType: "social_post",
  tone: {
    directive: "Confident and consultative",
    traits: ["Direct", "Credible"],
    avoid: ["Hype"],
  },
  cta: {
    primary: "Book a demo",
    url: "https://example.com/demo",
  },
  messagingPriorities: {
    primaryMessage: "Delegate work to AI colleagues",
    supportingMessages: ["Peers stay in the loop"],
    proofPoints: ["Used by 200+ teams"],
    rankOrder: ["primaryMessage", "proofPoints"],
  },
  visualPriorities: {
    summary: "Product UI with human team context",
    mustInclude: ["Logo mark"],
    mustAvoid: ["Stock handshakes"],
    referenceAssetIds: ["asset-ui-hero"],
  },
  requiredAssets: [
    {
      id: "ra-1",
      role: "logo",
      assetId: "asset-logo-primary",
      required: true,
    },
  ],
  forbiddenClaims: ["Guaranteed ROI"],
  forbiddenWords: ["revolutionary", "disrupt"],
  requiredDisclaimers: [
    {
      id: "d-1",
      text: "Results vary by team.",
      placement: "caption",
    },
  ],
  platformConstraints: {
    maxCharacters: 3000,
    maxHashtags: 5,
    aspectRatio: "1:1",
    linkRules: ["Use tracked demo link only"],
  },
  outputRequirements: {
    deliverableSummary: "One LinkedIn post + two variant hooks",
    variants: ["Hook A", "Hook B"],
    fileFormats: ["text/markdown"],
    accessibilityNotes: "Alt text for any image reference",
  },
  approvalRequirements: {
    legalReviewRequired: false,
    brandReviewRequired: true,
    requiredReviewers: ["marketing-lead"],
    notes: "Brand review before scheduling",
  },
};

describe("creative-brief types", () => {
  it("includes every required section on a complete brief fixture", () => {
    for (const section of CREATIVE_BRIEF_REQUIRED_SECTIONS) {
      expect(FIXTURE_CREATIVE_BRIEF).toHaveProperty(section);
    }
    expect(CREATIVE_BRIEF_REQUIRED_SECTIONS).toHaveLength(
      CREATIVE_BRIEF_OWNED_MODULES.length
    );
  });

  it("treats nested collections as readonly at runtime via serialization", () => {
    const serialized = JSON.stringify(FIXTURE_CREATIVE_BRIEF);
    const parsed = JSON.parse(serialized) as CreativeBrief;

    expect(parsed.forbiddenWords).toEqual(["revolutionary", "disrupt"]);
    expect(parsed.messagingPriorities.supportingMessages).toEqual([
      "Peers stay in the loop",
    ]);
    expect(parsed).toEqual(FIXTURE_CREATIVE_BRIEF);
  });

  it("serializes and deserializes without losing section structure", () => {
    const roundTrip = JSON.parse(
      JSON.stringify(FIXTURE_CREATIVE_BRIEF)
    ) as CreativeBrief;

    for (const key of CREATIVE_BRIEF_OWNED_MODULES) {
      expect(roundTrip[key]).toBeDefined();
    }
    expect(roundTrip.channel.channel).toBe("linkedin");
    expect(roundTrip.approvalRequirements.brandReviewRequired).toBe(true);
  });

  it("accepts a partial context slice for future engine projection", () => {
    const slice: CreativeBriefContextSlice = {
      available: false,
      completeness: 40,
      gaps: ["visualPriorities", "requiredAssets"],
      brief: {
        id: FIXTURE_CREATIVE_BRIEF.id,
        organizationId: FIXTURE_CREATIVE_BRIEF.organizationId,
        campaignGoal: FIXTURE_CREATIVE_BRIEF.campaignGoal,
        audience: FIXTURE_CREATIVE_BRIEF.audience,
      },
      assembledAt: "2026-07-10T00:00:00.000Z",
    };

    expect(slice.gaps).toContain("visualPriorities");
    expect(slice.brief.campaignGoal?.summary).toContain("demo requests");
  });

  it("does not embed dependency domains in the brief type shape", () => {
    const keys = Object.keys(FIXTURE_CREATIVE_BRIEF);
    expect(keys).not.toContain("brandBrain");
    expect(keys).not.toContain("businessBrain");
    expect(keys).not.toContain("renderer");
    expect(keys).not.toContain("templates");
  });
});
