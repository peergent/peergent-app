import { describe, expect, it, vi, afterEach } from "vitest";
import { AIRuntime } from "@/lib/ai-runtime/ai-runtime";
import { defaultAIRuntime } from "@/lib/ai-runtime";
import type { LLMProvider } from "@/lib/ai-runtime/provider";
import type { LLMGenerateRequest, LLMGenerateResult } from "@/lib/ai-runtime/types";
import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";
import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import { createMarketingBundle } from "@/lib/prompt-builder/__tests__/fixtures";
import { buildPrompt } from "@/lib/prompt-builder";
import type { MarketingPlan } from "@/lib/marketing-intelligence";
import { generateMarketingContentDraft } from "../generate-marketing-content-draft";
import * as featureFlags from "../marketing-feature-flags";
import * as resolveModule from "../resolve-creative-brief-for-content";
import { CREATIVE_BRIEF_PROMPT_DELIMITER_START } from "../format-creative-brief-prompt-section";

const assembledAt = "2026-07-18T10:00:00.000Z";

const activityBase = {
  rationale: { why: "Supports campaign." },
  linkedStrategyItems: [{ type: "campaignIdea" as const, reference: "Launch" }],
  estimatedEffort: "medium" as const,
  expectedImpact: "high" as const,
};

const samplePlan: MarketingPlan = {
  summary: "12-week plan",
  confidence: "high",
  confidenceReason: "Clear strategy",
  basedOnStrategySummary: "Inbound focus",
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [],
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
      scheduledWeek: 5,
      pillar: "Growth",
      ...activityBase,
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

const validDraftJson = {
  planActivityReference: "LinkedIn launch post",
  contentType: "linkedin_post",
  channel: "LinkedIn",
  objective: "Drive awareness",
  targetAudience: "Ops leaders",
  title: "Launch headline",
  body: "Body copy for the launch post.",
  callToAction: "Book a demo",
  keywords: ["launch"],
  rationale: { why: "Calendar slot." },
  sourceReferences: [{ source: "marketing-plan", reference: "LinkedIn launch post" }],
  confidence: "moderate",
  status: "draft",
};

const brandLayer: BrandBrainContextSlice = {
  available: true,
  completeness: 80,
  gaps: [],
  assembledAt,
  snapshot: {
    profile: {
      id: "bp-1",
      organizationId: "org-1",
      name: "Acme",
      status: "active",
      version: 1,
      createdAt: assembledAt,
      updatedAt: assembledAt,
    },
    identity: { keyMessages: ["Hire peers"], tagline: "Peers", valueProposition: "OS" },
    voice: {
      summary: "Clear",
      personalityTraits: [],
      dos: [],
      donts: [],
      forbiddenPhrases: ["revolutionary"],
      preferredCtaPatterns: ["Book a demo"],
      emojiPolicy: "none",
    },
    visualIdentity: { colors: [], typography: [], logoRules: [] },
    creativeRules: { layoutConstraints: [] },
    assetReferences: [],
  },
};

function createContentContextPackage() {
  const understanding: MarketingUnderstandingContextSlice = {
    roleApplicable: true,
    available: true,
    sparse: false,
    completeness: 88,
    gaps: [],
    brand: {
      values: [{ id: "v1", name: "Clarity" }],
      toneOfVoice: { summary: "Confident" },
      keyMessages: ["Hire peers"],
    },
    products: [{ id: "p1", name: "Platform" }],
    services: [],
    customerSegments: [
      {
        id: "seg1",
        name: "Ops leaders",
        painPoints: ["Manual work"],
        buyingTriggers: ["Growth"],
      },
    ],
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt,
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
        fetchedAt: assembledAt,
        freshness: "live",
      },
    ],
    priority: 55,
    loadMode: "lazy",
  };
  bundle.layers["brand-brain"] = {
    key: "brand-brain",
    data: brandLayer,
    sources: [
      {
        id: "brand-brain:org-test-123",
        type: "supabase",
        label: "Brand Brain",
        fetchedAt: assembledAt,
        freshness: "live",
      },
    ],
    priority: 65,
    loadMode: "lazy",
  };

  return assembleContextPackage(bundle, {
    taskHint: "Create draft for LinkedIn launch post",
  });
}

class FixedTextProvider implements LLMProvider {
  readonly name = "fixed-text";

  constructor(private readonly text: string) {}

  async generateResponse(_request: LLMGenerateRequest): Promise<LLMGenerateResult> {
    return {
      text: this.text,
      usage: { inputTokens: 100, outputTokens: 400, totalTokens: 500 },
      model: "mock-model",
      finishReason: "completed",
      latencyMs: 2,
    };
  }
}

describe("generateMarketingContentDraft creative brief integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps legacy task prompt when feature flag is disabled", async () => {
    vi.spyOn(featureFlags, "isMarketingCreativeBriefPromptEnabled").mockReturnValue(false);
    const resolveSpy = vi.spyOn(resolveModule, "resolveCreativeBriefForContent");

    const contextPackage = createContentContextPackage();
    const legacyPrompt = buildPrompt(contextPackage, {
      taskHint: "Create a draft linkedin_post for plan activity \"LinkedIn launch post\".",
      outputFormat: "marketing-content-draft",
      marketingPlan: samplePlan,
      planActivityReference: "LinkedIn launch post",
    });

    const executeSpy = vi.spyOn(defaultAIRuntime, "execute").mockImplementation(
      (promptPackage, options) =>
        new AIRuntime({
          provider: new FixedTextProvider(JSON.stringify(validDraftJson)),
        }).execute(promptPackage, options)
    );

    const result = await generateMarketingContentDraft({
      contextPackage,
      plan: samplePlan,
      planActivityReference: "LinkedIn launch post",
    });

    expect(resolveSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(executeSpy).toHaveBeenCalledOnce();
    const passedPrompt = executeSpy.mock.calls[0][0];
    expect(passedPrompt.taskPrompt).toBe(legacyPrompt.taskPrompt);
    expect(passedPrompt.taskPrompt).not.toContain(CREATIVE_BRIEF_PROMPT_DELIMITER_START);
  });

  it("appends Creative Brief section when flag is enabled and brief resolves", async () => {
    vi.spyOn(featureFlags, "isMarketingCreativeBriefPromptEnabled").mockReturnValue(true);

    const contextPackage = createContentContextPackage();
    const executeSpy = vi.spyOn(defaultAIRuntime, "execute").mockImplementation(
      (promptPackage, options) =>
        new AIRuntime({
          provider: new FixedTextProvider(JSON.stringify(validDraftJson)),
        }).execute(promptPackage, options)
    );

    const result = await generateMarketingContentDraft({
      contextPackage,
      plan: samplePlan,
      planActivityReference: "LinkedIn launch post",
    });

    expect(result.success).toBe(true);
    const passedPrompt = executeSpy.mock.calls[0][0];
    expect(passedPrompt.taskPrompt).toContain(CREATIVE_BRIEF_PROMPT_DELIMITER_START);
    expect(passedPrompt.taskPrompt).toContain("Forbidden words");
    expect(passedPrompt.taskPrompt).not.toContain("assemblyTrace");
    expect(result.success && result.warnings.some((w) => w.includes("Creative brief used"))).toBe(
      true
    );
  });

  it("still generates content when brief resolution falls back", async () => {
    vi.spyOn(featureFlags, "isMarketingCreativeBriefPromptEnabled").mockReturnValue(true);
    vi.spyOn(resolveModule, "resolveCreativeBriefForContent").mockReturnValue({
      status: "legacy_fallback",
      fallbackReason: "Marketing decision blocked.",
      warnings: ["Creative Brief unavailable: blocked."],
    });

    const contextPackage = createContentContextPackage();
    vi.spyOn(defaultAIRuntime, "execute").mockImplementation((promptPackage, options) =>
      new AIRuntime({
        provider: new FixedTextProvider(JSON.stringify(validDraftJson)),
      }).execute(promptPackage, options)
    );

    const result = await generateMarketingContentDraft({
      contextPackage,
      plan: samplePlan,
      planActivityReference: "LinkedIn launch post",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.warnings.some((w) => w.includes("legacy fallback"))).toBe(true);
    }
  });

  it("preserves explicit task hint over brief recommendations in the user task line", async () => {
    vi.spyOn(featureFlags, "isMarketingCreativeBriefPromptEnabled").mockReturnValue(true);

    const contextPackage = createContentContextPackage();
    const executeSpy = vi.spyOn(defaultAIRuntime, "execute").mockImplementation(
      (promptPackage, options) =>
        new AIRuntime({
          provider: new FixedTextProvider(JSON.stringify(validDraftJson)),
        }).execute(promptPackage, options)
    );

    const explicitHint = "Write a short teaser emphasizing customer proof only.";
    await generateMarketingContentDraft({
      contextPackage,
      plan: samplePlan,
      planActivityReference: "LinkedIn launch post",
      taskHint: explicitHint,
    });

    expect(executeSpy.mock.calls[0][0].taskPrompt).toContain(explicitHint);
  });
});
