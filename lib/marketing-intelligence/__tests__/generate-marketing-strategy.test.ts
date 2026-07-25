import { describe, expect, it, vi, afterEach } from "vitest";
import { AIRuntime } from "@/lib/ai-runtime/ai-runtime";
import { defaultAIRuntime, structuredJsonMaxLength } from "@/lib/ai-runtime";
import type { LLMProvider } from "@/lib/ai-runtime/provider";
import type { LLMGenerateRequest, LLMGenerateResult } from "@/lib/ai-runtime/types";
import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";
import { createMarketingBundle } from "@/lib/prompt-builder/__tests__/fixtures";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import { generateMarketingStrategy } from "@/lib/marketing-intelligence/strategy/generate-marketing-strategy";
import { MARKETING_STRATEGY_DEFAULT_MAX_TOKENS } from "@/lib/marketing-intelligence/strategy/build-strategy-task-prompt";

const sampleRationale = {
  why: "SMB founders show growth pressure as a buying trigger in customer segments.",
  basedOn: ["business-brain", "marketing-understanding"] as const,
};

const sampleStrategyPayload = {
  summary: "Focus on inbound demand from SMB founders via thought leadership.",
  confidence: "high" as const,
  confidenceReason: "Strong segment and positioning context available.",
  targetAudiences: [
    {
      segment: "SMB founders",
      priority: "primary" as const,
      rationale: sampleRationale,
    },
  ],
  positioningRecommendations: [
    {
      recommendation: "Lead with AI employee positioning vs tool sprawl.",
      rationale: {
        why: "Brand positioning emphasizes hiring peers, not tools.",
        basedOn: ["marketing-understanding", "company-dna"] as const,
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

function buildLongStrategyJson(): string {
  const payload = {
    ...sampleStrategyPayload,
    summary: `${sampleStrategyPayload.summary} ${"Additional strategic context. ".repeat(400)}`,
  };
  const json = JSON.stringify(payload);
  expect(json.length).toBeGreaterThan(8000);
  return json;
}

function createMarketingContextPackage() {
  const understanding: MarketingUnderstandingContextSlice = {
    roleApplicable: true,
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
    competitors: [
      { id: "c1", name: "Rival Co", strengths: [], weaknesses: [], differentiators: [] },
    ],
    goals: [{ id: "g1", title: "Increase inbound", status: "active", priority: 1 }],
    existingContent: [],
    assembledAt: "2026-01-01T00:00:00.000Z",
  };

  const bundle = createMarketingBundle();
  bundle.layers["marketing-understanding"] = {
    key: "marketing-understanding",
    data: understanding,
    sources: [
      {
        id: "marketing:understanding",
        type: "derived",
        label: "Marketing Understanding",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        freshness: "live",
      },
    ],
    priority: 55,
    loadMode: "lazy",
  };

  return assembleContextPackage(bundle, {
    taskHint:
      "Develop a comprehensive marketing strategy based on the verified Marketing Understanding.",
  });
}

class FixedTextProvider implements LLMProvider {
  readonly name = "fixed-text";

  constructor(private readonly text: string) {}

  async generateResponse(_request: LLMGenerateRequest): Promise<LLMGenerateResult> {
    return {
      text: this.text,
      usage: { inputTokens: 100, outputTokens: 2200, totalTokens: 2300 },
      model: "mock-model",
      finishReason: "completed",
      latencyMs: 4,
    };
  }
}

describe("generateMarketingStrategy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("wires token-aligned response validation and returns a parsed strategy for long JSON", async () => {
    const longJsonText = buildLongStrategyJson();
    const contextPackage = createMarketingContextPackage();

    const executeSpy = vi.spyOn(defaultAIRuntime, "execute").mockImplementation(
      (promptPackage, options) =>
        new AIRuntime({ provider: new FixedTextProvider(longJsonText) }).execute(
          promptPackage,
          options
        )
    );

    const result = await generateMarketingStrategy({ contextPackage });

    expect(executeSpy).toHaveBeenCalledOnce();
    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ peerRole: "Marketing" }),
      }),
      expect.objectContaining({
        maxTokens: MARKETING_STRATEGY_DEFAULT_MAX_TOKENS,
        temperature: 0.35,
        responseValidation: {
          maxLength: structuredJsonMaxLength(MARKETING_STRATEGY_DEFAULT_MAX_TOKENS),
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.aiResponse.providerResult.text).toBe(longJsonText);
    expect(result.aiResponse.text).toBe(longJsonText);
    expect(result.aiResponse.text.length).toBeGreaterThan(8000);
    expect(
      result.aiResponse.validated.warnings.some((warning) => warning.includes("truncated"))
    ).toBe(false);

    expect(result.strategy.summary).toContain("Focus on inbound demand from SMB founders");
    expect(result.strategy.targetAudiences).toHaveLength(1);
    expect(result.strategy.marketingPriorities).toHaveLength(1);
    expect(result.strategy.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
