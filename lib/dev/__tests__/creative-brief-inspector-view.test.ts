import { describe, expect, it } from "vitest";

import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import { emptyBrandBrainContextSlice } from "@/lib/intelligence/types/brand-brain-context-slice";
import {
  presentCreativeBriefInspectorView,
  tryAssembleDevCreativeBrief,
} from "@/lib/dev/creative-brief-inspector-view";
import { buildDevMarketingDecisionSourceFromContextPackage } from "@/lib/dev/marketing-decision-inspector-view";
import type { ContextPackage } from "@/lib/intelligence";

const assembledAt = "2026-07-20T12:00:00.000Z";

const basePackage: ContextPackage = {
  version: "2.0",
  traceId: "trace-1",
  scope: {
    organization: { organizationId: "org-1", organizationName: "Acme", slug: "acme" },
    peer: {
      peerId: "peer-1",
      role: "Marketing",
      name: "Emma",
      objective: "Grow",
      website: null,
      status: "active",
    },
    actor: { userId: "user-1", membershipRole: "owner" },
    sessionId: "session-1",
    requestedAt: assembledAt,
  },
  slices: {
    marketingUnderstanding: {
      roleApplicable: true,
      available: true,
      sparse: false,
      completeness: 85,
      gaps: [],
      brand: { values: [], toneOfVoice: {}, keyMessages: [] },
      products: [],
      services: [],
      customerSegments: [{ id: "s1", name: "Founders", painPoints: [], buyingTriggers: [] }],
      competitors: [],
      goals: [],
      existingContent: [],
      assembledAt,
    },
    companyDna: {
      available: true,
      values: [],
      toneOfVoice: {},
      riskProfile: { tolerance: "balanced" },
      decisionPrinciples: [],
    },
    businessBrain: {
      available: true,
      products: [],
      services: [],
      customerSegments: [],
      competitors: [],
      internalProcesses: [],
      knowledgeSources: [],
      facts: [],
    },
  },
  meta: {
    completeness: 80,
    loadedLayers: [],
    missingLayers: [],
    warnings: [],
    sources: [],
    assembledAt,
    cacheHits: [],
  },
};

const brandComplete: BrandBrainContextSlice = {
  available: true,
  completeness: 80,
  gaps: [],
  assembledAt,
  snapshot: {
    identity: { keyMessages: ["Primary message"], tagline: "Tag" },
    voice: {
      summary: "Clear",
      preferredCtaPatterns: ["Book a demo"],
      personalityTraits: [],
      dos: [],
      donts: [],
      forbiddenPhrases: [],
      emojiPolicy: "none",
    },
    visualIdentity: { colors: [], typography: [], logoRules: [] },
    creativeRules: { layoutConstraints: [] },
    assetReferences: [],
  },
};

function decisionFromDev(controls: {
  objective: string;
  requestedChannelId?: string;
  requestedContentTypeId?: string;
}) {
  const built = buildDevMarketingDecisionSourceFromContextPackage({
    contextPackage: {
      ...basePackage,
      slices: { ...basePackage.slices, brandBrain: brandComplete },
    },
    controls,
  });
  const source = {
    ...built.source,
    planActivity: {
      title: "Dev activity",
      contentType: "linkedin_post",
      channel: "LinkedIn",
    },
    responsibilityPolicy: {
      responsibilities: [
        {
          category: "linkedin",
          enabled: true,
          approvalPolicy: "fully_automatic",
          autonomyLevel: "autonomous",
        },
      ],
    },
  };
  return assembleMarketingDecision(source);
}

describe("creative brief inspector view", () => {
  it("creates brief when decision permits generation", () => {
    const decision = decisionFromDev({ objective: "Launch validation" });
    const result = tryAssembleDevCreativeBrief({
      decision,
      brand: brandComplete,
      controls: { objective: "Launch validation" },
      assembledAt,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const view = presentCreativeBriefInspectorView({ brief: result.brief, brand: brandComplete });
      expect(view?.available).toBe(true);
      expect(view?.rawJson).not.toContain("channelRecommendations");
    }
  });

  it("shows safe failure for manual-only decision", () => {
    const built = buildDevMarketingDecisionSourceFromContextPackage({
      contextPackage: basePackage,
      controls: { objective: "Manual test" },
    });
    const source = {
      ...built.source,
      planActivity: {
        title: "Dev activity",
        contentType: "linkedin_post",
        channel: "LinkedIn",
      },
      responsibilityPolicy: {
        responsibilities: [
          {
            category: "linkedin",
            enabled: true,
            approvalPolicy: "approval_required",
            autonomyLevel: "manual",
          },
        ],
      },
    };
    const decision = assembleMarketingDecision(source);
    const result = tryAssembleDevCreativeBrief({
      decision,
      brand: brandComplete,
      controls: { objective: "Manual test" },
      assembledAt,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const view = presentCreativeBriefInspectorView({
        brief: null,
        failure: result.failure,
      });
      expect(view?.available).toBe(false);
      expect(view?.failure?.code).toContain("MANUAL");
    }
  });

  it("warns on partial brand with draft status", () => {
    const decision = decisionFromDev({ objective: "Partial brand" });
    const partialBrand = {
      ...emptyBrandBrainContextSlice(assembledAt),
      snapshot: { identity: { keyMessages: [] } },
    };
    const result = tryAssembleDevCreativeBrief({
      decision,
      brand: partialBrand,
      controls: { objective: "Partial brand" },
      assembledAt,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const view = presentCreativeBriefInspectorView({
        brief: result.brief,
        brand: partialBrand,
      });
      expect(view?.status).toBe("draft");
      expect(view?.reviewWarnings.length).toBeGreaterThan(0);
    }
  });

  it("preserves forbidden words and handles empty lists", () => {
    const decision = {
      ...decisionFromDev({ objective: "Compliance" }),
      forbiddenWords: ["banned"],
      forbiddenClaims: ["Guaranteed win"],
    };
    const result = tryAssembleDevCreativeBrief({
      decision,
      brand: brandComplete,
      controls: { objective: "Compliance" },
      assembledAt,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const view = presentCreativeBriefInspectorView({ brief: result.brief });
      expect(view?.forbiddenWords).toContain("banned");
      expect(view?.forbiddenClaims).toContain("Guaranteed win");
      expect(view?.disclaimers).toEqual([]);
    }
  });
});
