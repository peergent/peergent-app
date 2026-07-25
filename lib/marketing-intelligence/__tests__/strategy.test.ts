import { describe, expect, it } from "vitest";
import { validateResponse, structuredJsonMaxLength } from "@/lib/ai-runtime/response-validator";
import { assessStrategyReadiness } from "@/lib/marketing-intelligence/strategy/assess-strategy-readiness";
import { parseMarketingStrategyResponse } from "@/lib/marketing-intelligence/strategy/parse-marketing-strategy-response";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";

const sampleUnderstanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 88,
  gaps: ["existingContent"],
  brand: {
    mission: "Help teams grow",
    values: [{ id: "v1", name: "Clarity" }],
    toneOfVoice: { summary: "Confident" },
    positioningStatement: "AI employees for growing teams",
    keyMessages: ["Hire peers, not tools"],
  },
  products: [{ id: "p1", name: "Platform" }],
  services: [{ id: "s1", name: "Onboarding" }],
  customerSegments: [
    {
      id: "seg1",
      name: "SMB founders",
      painPoints: ["Limited time"],
      buyingTriggers: ["Growth pressure"],
    },
  ],
  competitors: [{ id: "c1", name: "Rival Co", strengths: [], weaknesses: [], differentiators: [] }],
  goals: [{ id: "g1", title: "Increase inbound", status: "active", priority: 1 }],
  existingContent: [],
  assembledAt: "2026-01-01T00:00:00.000Z",
};

const sampleRationale = {
  why: "SMB founders show growth pressure as a buying trigger in customer segments.",
  basedOn: ["business-brain", "marketing-understanding"],
};

const sampleStrategyJson = {
  summary: "Focus on inbound demand from SMB founders via thought leadership.",
  confidence: "high",
  confidenceReason: "Strong segment and positioning context available.",
  targetAudiences: [
    { segment: "SMB founders", priority: "primary", rationale: sampleRationale },
  ],
  positioningRecommendations: [
    {
      recommendation: "Lead with AI employee positioning vs tool sprawl.",
      rationale: {
        why: "Brand positioning emphasizes hiring peers, not tools.",
        basedOn: ["marketing-understanding", "company-dna"],
      },
    },
  ],
  contentPillars: [
    {
      name: "Growth efficiency",
      themes: ["Time savings", "Team leverage"],
      rationale: sampleRationale,
    },
  ],
  campaignIdeas: [
    {
      name: "Founder playbook series",
      objective: "Drive inbound leads",
      channels: ["LinkedIn", "Blog"],
      rationale: sampleRationale,
    },
  ],
  seoOpportunities: [
    {
      topic: "AI employees for SMB",
      intent: "Informational",
      rationale: sampleRationale,
    },
  ],
  socialMediaStrategy: [
    {
      platform: "LinkedIn",
      approach: "Founder-led thought leadership",
      contentFocus: ["Pain points", "Case patterns"],
      rationale: sampleRationale,
    },
  ],
  customerJourneyRecommendations: [
    {
      stage: "Awareness",
      recommendation: "Publish segment-specific pain point content",
      rationale: sampleRationale,
    },
  ],
  leadGenerationOpportunities: [
    {
      opportunity: "Inbound from content",
      tactic: "Gated founder playbook",
      rationale: sampleRationale,
    },
  ],
  marketingPriorities: [
    { priority: 1, title: "Define content pillars", rationale: sampleRationale },
  ],
  knowledgeGaps: ["existingContent"],
};

describe("assessStrategyReadiness", () => {
  it("marks unavailable understanding as not ready", () => {
    const result = assessStrategyReadiness(undefined);
    expect(result.ready).toBe(false);
    expect(result.maxConfidence).toBe("low");
  });

  it("caps confidence when understanding is sparse", () => {
    const result = assessStrategyReadiness({
      ...sampleUnderstanding,
      completeness: 30,
      sparse: true,
      gaps: ["products", "services"],
    });
    expect(result.maxConfidence).toBe("low");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("allows high confidence for complete understanding", () => {
    const result = assessStrategyReadiness(sampleUnderstanding);
    expect(result.ready).toBe(true);
    expect(result.maxConfidence).toBe("high");
  });
});

describe("parseMarketingStrategyResponse", () => {
  it("parses valid strategy JSON with rationale on every section", () => {
    const result = parseMarketingStrategyResponse(JSON.stringify(sampleStrategyJson));

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.strategy.targetAudiences).toHaveLength(1);
    expect(result.strategy.contentPillars[0]?.rationale.basedOn).toContain("business-brain");
    expect(result.strategy.marketingPriorities[0]?.rationale.why).toContain("SMB");
  });

  it("rejects responses where all recommendations lack valid rationale", () => {
    const invalid = {
      summary: "Strategy summary",
      confidence: "moderate",
      confidenceReason: "Limited context",
      targetAudiences: [
        {
          segment: "SMB founders",
          priority: "primary",
          rationale: { why: "Because.", basedOn: [] },
        },
      ],
      positioningRecommendations: [],
      contentPillars: [],
      campaignIdeas: [],
      seoOpportunities: [],
      socialMediaStrategy: [],
      customerJourneyRecommendations: [],
      leadGenerationOpportunities: [],
      marketingPriorities: [],
      knowledgeGaps: [],
    };

    const result = parseMarketingStrategyResponse(JSON.stringify(invalid));
    expect(result.success).toBe(false);
  });

  it("rejects non-JSON responses", () => {
    const result = parseMarketingStrategyResponse("Not JSON at all");
    expect(result.success).toBe(false);
  });

  it("fails when AI runtime truncates structured JSON before parsing", () => {
    const fullJson = JSON.stringify({
      ...sampleStrategyJson,
      summary: `${sampleStrategyJson.summary} ${"Additional strategic context. ".repeat(400)}`,
    });
    expect(fullJson.length).toBeGreaterThan(8000);

    const truncated = validateResponse(fullJson).text;
    expect(truncated.length).toBeLessThan(fullJson.length);
    expect(parseMarketingStrategyResponse(truncated).success).toBe(false);

    const preserved = validateResponse(fullJson, {
      maxLength: structuredJsonMaxLength(4096),
    }).text;
    expect(preserved).toBe(fullJson);
    expect(parseMarketingStrategyResponse(preserved).success).toBe(true);
  });
});
