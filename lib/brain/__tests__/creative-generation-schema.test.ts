import { beforeEach, describe, expect, it } from "vitest";
import { CREATIVE_GENERATION_LLM_JSON_SCHEMA } from "@/lib/brain/llm/json-schema";
import { creativeGenerationPromptBuilder } from "@/lib/brain/prompts/creative-generation-prompt-builder";
import {
  CREATIVE_CHANNEL_IDS,
  CREATIVE_DELIVERABLE_TYPES,
  normalizeCreativeGenerationLlmPayload,
} from "@/lib/brain/llm/creative-generation-contract";
import {
  mapCreativeGenerationPayloadToBrainOutput,
  validateCreativeGenerationLlmPayload,
} from "@/lib/brain/llm/creative-generation-response-validator";
import { BrainLlmClient } from "@/lib/brain/llm/client";
import {
  BrainLlmBusinessValidationError,
  BrainLlmValidationError,
  BrainLlmValidationRetryExhaustedError,
} from "@/lib/brain/llm/errors";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import type { BrainLlmProvider } from "@/lib/brain/llm/provider";
import { executeCreativeGenerationWithLlmFallback } from "@/lib/brain/llm/execute-creative-generation-llm";
import {
  assembleCompanyContextSync,
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  clearDemoWebsiteSnapshots,
  getBrainCapability,
  mapStrategyPayloadToBrainOutput,
  projectBrainContext,
} from "@/lib/brain";
import { mapChannelPlanningPayloadToBrainOutput } from "@/lib/brain/llm/channel-response-validator";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { presentBrainOutputForCampaign } from "@/lib/brain/presentation/campaign-evidence-adapter";

function validDeliverable(overrides: Record<string, unknown> = {}) {
  return {
    id: "del-1",
    deliverableType: "linkedin_carousel",
    channel: "linkedin",
    purpose: "Build awareness among SMB owners",
    targetAudience: "SMB owners",
    objective: "Drive demo requests",
    messageAngle: "Clarity and proof over hype",
    keyPoints: ["AI workspace"],
    callToActionDirection: "Invite to book a demo",
    format: "Carousel — 5 slides",
    reviewStatus: "planned",
    rationale: "LinkedIn fits B2B audience",
    dependencies: ["strategy core message"],
    assumptions: ["Audience active on LinkedIn"],
    provenance: "Approved strategy and channel plan",
    ...overrides,
  };
}

function validPayload() {
  return {
    deliverables: [validDeliverable()],
    decisions: [{ id: "dec-1", label: "Lead with LinkedIn", rationale: "Primary B2B channel", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Start with carousel", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "generate_content", label: "Generate planning", requiresApproval: true }],
    warnings: [],
  };
}

describe("creative generation contract alignment", () => {
  it("prompt includes the same enums as the JSON schema", () => {
    const prompt = creativeGenerationPromptBuilder.build({
      context: {
        companyBrandSummary: "Peergent",
        campaignGoal: "Grow demo requests",
        targetAudience: "SMB owners",
        strategySummary: "Focus on clarity",
        approvedChannels: "linkedin, email",
        productsAndServices: "AI workspace",
        usps: "Premium AI colleagues",
        toneOfVoice: "Calm",
        competitorObservations: "None",
        websiteObservations: "Available",
        knownFacts: "None",
        unknowns: "None",
        executionMode: "semi_automatic",
        approvalMode: "semi_automatic",
      },
      locale: "en",
    });

    for (const type of CREATIVE_DELIVERABLE_TYPES) {
      expect(prompt.userPrompt).toContain(type);
    }
    for (const channel of CREATIVE_CHANNEL_IDS) {
      expect(prompt.userPrompt).toContain(channel);
    }
    expect(JSON.stringify(CREATIVE_GENERATION_LLM_JSON_SCHEMA)).toContain("callToActionDirection");
    expect(prompt.userPrompt).toContain("callToActionDirection");
  });

  it("normalizes documented safe aliases before validation", () => {
    const normalized = normalizeCreativeGenerationLlmPayload({
      deliverables: [
        {
          id: "del-1",
          type: "carousel",
          channel: "website_landing",
          purpose: "Explain the offer",
          audience: "SMB owners",
          goal: "Drive demo requests",
          message: "Clarity first",
          key_points: "AI workspace, Human-like colleagues",
          cta: "Book a demo",
          format: "Carousel outline",
          rationale: "Website landing supports conversion",
          provenance: "Approved channels",
        },
      ],
      decisions: [],
      recommendations: [],
      actionProposals: [],
      warnings: [],
    }) as ReturnType<typeof validPayload>;

    expect(normalized.deliverables?.[0]?.deliverableType).toBe("linkedin_carousel");
    expect(normalized.deliverables?.[0]?.channel).toBe("website_landing");
    expect(normalized.deliverables?.[0]?.callToActionDirection).toBe("Book a demo");
    expect(normalized.deliverables?.[0]?.keyPoints).toEqual(["AI workspace", "Human-like colleagues"]);
  });

  it("validates a realistic OpenAI-shaped response", () => {
    expect(() =>
      validateCreativeGenerationLlmPayload(validPayload(), { approvedChannels: ["linkedin"] })
    ).not.toThrow();
  });

  it("fails with exact path for missing required field", () => {
    const payload = validPayload();
    delete (payload.deliverables[0] as { rationale?: string }).rationale;
    try {
      validateCreativeGenerationLlmPayload(payload, { approvedChannels: ["linkedin"] });
      expect.unreachable("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BrainLlmValidationError);
      expect((error as BrainLlmValidationError).issues.some((issue) => issue.includes("deliverables[0].rationale"))).toBe(true);
    }
  });

  it("fails with exact path for invalid enum", () => {
    const payload = validPayload();
    payload.deliverables[0] = validDeliverable({ reviewStatus: "published" });
    try {
      validateCreativeGenerationLlmPayload(payload, { approvedChannels: ["linkedin"] });
      expect.unreachable("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BrainLlmValidationError);
      expect((error as BrainLlmValidationError).issues.some((issue) => issue.includes("deliverables[0].reviewStatus"))).toBe(true);
    }
  });

  it("maps unapproved channel mismatch to business validation", () => {
    const payload = validPayload();
    payload.deliverables[0] = validDeliverable({ channel: "instagram" });
    try {
      validateCreativeGenerationLlmPayload(payload, { approvedChannels: ["linkedin"] });
      expect.unreachable("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BrainLlmBusinessValidationError);
      expect((error as BrainLlmBusinessValidationError).issues.some((issue) => issue.includes("deliverables[0].channel"))).toBe(true);
    }
  });
});

describe("creative generation validation retry", () => {
  it("allows one repair retry and then succeeds", async () => {
    let calls = 0;
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => {
        calls += 1;
        const payload = calls === 1 ? { deliverables: [] } : validPayload();
        return {
          rawText: JSON.stringify(payload),
          usage: buildLlmUsage({
            provider: "openai",
            model: "gpt-test",
            inputTokens: 120,
            outputTokens: 80,
            latencyMs: 10,
          }),
        };
      },
    };

    const client = new BrainLlmClient(provider);
    const result = await client.completeWithValidationRetry(
      {
        capabilityId: "creative_generation",
        capabilityVersion: "1.0.0",
        systemPrompt: "system",
        userPrompt: "user",
        jsonSchema: CREATIVE_GENERATION_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
        contextHash: "hash",
      },
      (parsed) => validateCreativeGenerationLlmPayload(parsed, { approvedChannels: ["linkedin"] }),
      { maxRepairAttempts: 1 }
    );

    expect(calls).toBe(2);
    expect(result.attemptCount).toBe(2);
    expect(result.validationRepairCount).toBe(1);
    expect(result.response.usage.inputTokens).toBe(120);
  });

  it("makes at most one repair retry before failing", async () => {
    let calls = 0;
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => {
        calls += 1;
        return {
          rawText: JSON.stringify({ deliverables: [] }),
          usage: buildLlmUsage({
            provider: "openai",
            model: "gpt-test",
            inputTokens: 90,
            outputTokens: 20,
            latencyMs: 8,
          }),
        };
      },
    };

    const client = new BrainLlmClient(provider);
    await expect(
      client.completeWithValidationRetry(
        {
          capabilityId: "creative_generation",
          capabilityVersion: "1.0.0",
          systemPrompt: "system",
          userPrompt: "user",
          jsonSchema: CREATIVE_GENERATION_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
          contextHash: "hash",
        },
        (parsed) => validateCreativeGenerationLlmPayload(parsed, { approvedChannels: ["linkedin"] }),
        { maxRepairAttempts: 1 }
      )
    ).rejects.toBeInstanceOf(BrainLlmValidationRetryExhaustedError);

    expect(calls).toBe(2);
  });
});

describe("creative generation fallback diagnostics", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
  });

  it("preserves failed LLM usage and upstream diagnostics after schema failure", async () => {
    const peergentInput = {
      peerId: "demo" as const,
      ownerLabel: "Emma",
      name: "Peergent",
      goalLabel: "Demo requests",
      description: "More demo requests from SMB owners.",
      primaryGoalId: "generate_leads" as const,
      targetAudience: "SMB owners",
      setupMode: "automatic" as const,
      approvalMode: "approval_before_publication" as const,
    };
    const orgId = "org-schema-fallback";
    const project = createMarketingCampaignProject(peergentInput);
    const campaignContext = {
      ...buildCampaignContextFromCreateInput(project, peergentInput, "en"),
      brandContext: {
        brandName: "Peergent",
        productsAndServices: ["AI marketing colleagues"],
        targetAudience: "SMB owners",
      },
      stepApprovals: {
        strategy_determined: "approved" as const,
        channels_selected: "approved" as const,
      },
      contextVersion: 2,
    };
    const profile = buildPeergentCompanyProfile("en");
    const assembly = assembleCompanyContextSync({
      organizationId: orgId,
      companyProfile: { ...profile, organizationId: orgId },
      websiteSnapshot: buildDemoWebsiteSnapshotSync({ organizationId: orgId, url: "https://peergent.com" }),
      campaignContext,
      marketingUnderstanding: null,
      corrections: [],
    });
    const strategyOutput = mapStrategyPayloadToBrainOutput(
      {
        findings: [{ id: "s1", label: "Objective", value: "Grow demos", confidence: "medium" }],
        decisions: [],
        recommendations: [],
        actionProposals: [],
        warnings: [],
      },
      {
        capabilityVersion: getBrainCapability("strategy").version,
        generatedAt: "2026-08-01T00:00:00.000Z",
        provenanceRef: "test",
      }
    );
    const channelOutput = mapChannelPlanningPayloadToBrainOutput(
      {
        findings: [{ id: "c1", label: "Channel: linkedin", value: "Selected", confidence: "medium" }],
        decisions: [],
        recommendations: [],
        actionProposals: [],
        warnings: [],
      },
      {
        capabilityVersion: getBrainCapability("channel_planning").version,
        generatedAt: "2026-08-01T00:00:00.000Z",
        provenanceRef: "test",
      }
    );
    const execCtx = buildCapabilityExecutionContext({
      assembly,
      request: {
        organizationId: orgId,
        peerId: "demo",
        capabilityId: "creative_generation",
        actorId: "test",
        campaignContext,
        locale: "en",
      },
      upstreamOutputs: { strategy: strategyOutput, channel_planning: channelOutput },
    });
    const def = getBrainCapability("creative_generation");
    const projected = projectBrainContext({
      fullSnapshot: assembly.brainSnapshot,
      companySnapshot: assembly.companySnapshot,
      requiredSlices: def.requiredContext,
      optionalSlices: def.optionalContext,
    });

    let calls = 0;
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => {
        calls += 1;
        return {
          rawText: JSON.stringify({ deliverables: [], decisions: [], recommendations: [], actionProposals: [], warnings: [] }),
          usage: buildLlmUsage({
            provider: "openai",
            model: "gpt-test",
            inputTokens: 150,
            outputTokens: 60,
            latencyMs: 12,
          }),
        };
      },
    };

    const result = await executeCreativeGenerationWithLlmFallback({
      context: {
        organizationId: orgId,
        peerId: "demo",
        capabilityId: "creative_generation",
        actorId: "test",
        environment: "live",
      },
      snapshot: projected.snapshot,
      capabilityId: "creative_generation",
      companySnapshot: assembly.companySnapshot,
      executionContext: execCtx,
      projection: projected.projection,
      llmProvider: provider,
    });

    expect(calls).toBe(2);
    expect(result.fallbackReason).toBe("schema_validation_failed");
    expect(result.usage?.requestStarted).toBe(true);
    expect(result.usage?.inputTokens).toBe(150);
    expect(result.usage?.outputTokens).toBe(60);
    expect(result.diagnostics?.requestStarted).toBe(true);
    expect(result.diagnostics?.upstreamStrategyFound).toBe(true);
    expect(result.diagnostics?.upstreamChannelsFound).toBe(true);
    expect(result.diagnostics?.selectedChannelCount).toBeGreaterThan(0);
  });

  it("maps successful output to readable deliverable evidence", () => {
    const output = mapCreativeGenerationPayloadToBrainOutput(validPayload(), {
      capabilityVersion: "1.0.0",
      generatedAt: "2026-08-01T00:00:00.000Z",
      provenanceRef: "test",
    });
    const presented = presentBrainOutputForCampaign({
      output,
      title: "Deliverables",
      locale: "en",
    });
    const text = presented.sections.flatMap((section) => section.items).join("\n");
    expect(text).toMatch(/LinkedIn carousel plan/);
    expect(text).toMatch(/Key points/);
    expect(text).toMatch(/CTA direction/);
    expect(text).not.toMatch(/id: del-/);
  });
});
