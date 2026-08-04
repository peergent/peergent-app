import { beforeEach, describe, expect, it } from "vitest";
import {
  detectFinalCopyInText,
  detectUnsupportedNumericClaim,
  validateCreativeGenerationBusinessRules,
} from "@/lib/brain/llm/creative-generation-business-validation";
import {
  channelMatchesApprovedSelection,
  normalizeCreativeChannelId,
} from "@/lib/brain/llm/creative-generation-contract";
import { validateCreativeGenerationLlmPayload } from "@/lib/brain/llm/creative-generation-response-validator";
import { BrainLlmBusinessValidationError, BrainLlmValidationRetryExhaustedError } from "@/lib/brain/llm/errors";
import { BrainLlmClient } from "@/lib/brain/llm/client";
import { CREATIVE_GENERATION_LLM_JSON_SCHEMA } from "@/lib/brain/llm/json-schema";
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
import { extractBrainDevDiagnostics } from "@/lib/brain/integration/brain-dev-diagnostics";
import type { BrainRunResult } from "@/lib/brain/runtime/run-result";

function validDeliverable(overrides: Record<string, unknown> = {}) {
  return {
    id: "del-1",
    deliverableType: "linkedin_carousel",
    channel: "linkedin",
    purpose: "Build awareness among SMB owners",
    targetAudience: "SMB owners",
    objective: "Drive demo requests",
    messageAngle: "Benadruk regionale installatie en één aanspreekpunt",
    keyPoints: ["Snelheid", "Lokale service"],
    callToActionDirection: "CTA-richting: plan een adviesgesprek",
    format: "Carousel — 5 slides",
    reviewStatus: "planned",
    rationale: "LinkedIn fits B2B audience",
    dependencies: [],
    assumptions: ["Audience active on LinkedIn"],
    provenance: "Approved strategy and channel plan",
    ...overrides,
  };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    deliverables: [validDeliverable()],
    decisions: [{ id: "dec-1", label: "Lead with LinkedIn", rationale: "Primary B2B channel", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Start with carousel", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "generate_content", label: "Generate planning", requiresApproval: true }],
    warnings: [],
    ...overrides,
  };
}

describe("creative generation business validation", () => {
  it("preserves exact business-validation issue path and code", () => {
    const payload = validPayload();
    payload.deliverables = [
      validDeliverable({ channel: "instagram" }),
      validDeliverable({ id: "del-2", channel: "meta_ads", purpose: "Retargeting plan" }),
    ];
    try {
      validateCreativeGenerationLlmPayload(payload, { approvedChannels: ["linkedin", "google_ads"] });
      expect.unreachable("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BrainLlmBusinessValidationError);
      const businessError = error as BrainLlmBusinessValidationError;
      expect(businessError.structuredIssues[0]?.code).toBe("unapproved_channel");
      expect(businessError.structuredIssues[0]?.path).toBe("deliverables[0].channel");
      expect(businessError.structuredIssues[0]?.actual).toBe("instagram");
      expect(businessError.structuredIssues[0]?.expected).toContain("linkedin");
    }
  });

  it("fails unapproved channel with specific code", () => {
    const issues = validateCreativeGenerationBusinessRules(validPayload(), { approvedChannels: ["email"] });
    expect(issues.some((issue) => issue.code === "unapproved_channel")).toBe(true);
  });

  it("passes approved canonical channel", () => {
    expect(() =>
      validateCreativeGenerationLlmPayload(validPayload(), { approvedChannels: ["linkedin"] })
    ).not.toThrow();
  });

  it("normalizes safe channel aliases before validation", () => {
    const payload = validPayload({
      deliverables: [validDeliverable({ channel: "google_search" })],
    });
    expect(() =>
      validateCreativeGenerationLlmPayload(payload, { approvedChannels: ["google_ads"] })
    ).not.toThrow();
    expect(normalizeCreativeChannelId("linkedin_organic")).toBe("linkedin");
    expect(channelMatchesApprovedSelection("website_landing", ["landing_page"])).toBe(true);
  });

  it("rejects arbitrary channel aliases", () => {
    expect(normalizeCreativeChannelId("tiktok")).toBeNull();
    const payload = validPayload({
      deliverables: [validDeliverable({ channel: "tiktok" })],
    });
    expect(() => validateCreativeGenerationLlmPayload(payload, { approvedChannels: ["linkedin"] })).toThrow();
  });

  it("allows planning-level message direction without final-copy flag", () => {
    expect(
      detectFinalCopyInText("Benadruk regionale installatie en één aanspreekpunt", "deliverables[0].messageAngle")
    ).toBeNull();
    expect(
      detectFinalCopyInText("CTA-richting: plan een adviesgesprek", "deliverables[0].callToActionDirection")
    ).toBeNull();
    expect(
      detectFinalCopyInText("Kernpunten: snelheid, lokale service, ontzorging", "deliverables[0].keyPoints")
    ).toBeNull();
  });

  it("rejects full publish-ready copy", () => {
    const finishedEmail = [
      "Dear Alex,",
      "We help SMB owners simplify marketing with AI colleagues that feel calm and premium.",
      "Our workspace keeps strategy, channels, and deliverables in one place.",
      "Book a demo this week and we will map your first campaign together.",
    ].join("\n");
    expect(detectFinalCopyInText(finishedEmail, "deliverables[0].messageAngle")?.code).toBe("final_copy_detected");
  });

  it("allows harmless counts and order numbers", () => {
    const payload = validPayload({
      deliverables: [validDeliverable({ format: "Carousel — 5 slides, sequence 2" })],
    });
    const issues = validateCreativeGenerationBusinessRules(payload, { approvedChannels: ["linkedin"] });
    expect(issues.some((issue) => issue.code === "unsupported_numeric_claim")).toBe(false);
  });

  it("rejects unsupported performance claims", () => {
    expect(
      detectUnsupportedNumericClaim("Verwacht 30% meer leads binnen 60 dagen", "deliverables")?.code
    ).toBe("unsupported_numeric_claim");
    expect(
      detectUnsupportedNumericClaim("ROAS 4.5 na launch", "deliverables")?.code
    ).toBe("unsupported_performance_claim");
    expect(detectUnsupportedNumericClaim("Focus op CTR in planning", "deliverables")).toBeNull();
  });

  it("fails missing rationale specifically", () => {
    const payload = validPayload({
      deliverables: [validDeliverable({ rationale: "" })],
    });
    const issues = validateCreativeGenerationBusinessRules(payload, { approvedChannels: ["linkedin"] });
    expect(issues.some((issue) => issue.code === "missing_rationale" && issue.path.endsWith(".rationale"))).toBe(
      true
    );
  });

  it("fails missing provenance specifically", () => {
    const payload = validPayload({
      deliverables: [validDeliverable({ provenance: "  " })],
    });
    const issues = validateCreativeGenerationBusinessRules(payload, { approvedChannels: ["linkedin"] });
    expect(issues.some((issue) => issue.code === "missing_provenance")).toBe(true);
  });

  it("fails duplicate deliverables specifically", () => {
    const payload = validPayload({
      deliverables: [
        validDeliverable({ purpose: "Same purpose" }),
        validDeliverable({ id: "del-2", purpose: "same purpose" }),
      ],
    });
    const issues = validateCreativeGenerationBusinessRules(payload, { approvedChannels: ["linkedin"] });
    expect(issues.some((issue) => issue.code === "duplicate_deliverable")).toBe(true);
  });
});

describe("creative generation business validation retry + diagnostics", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
  });

  it("sends exact issue list to one repair retry", async () => {
    let secondPrompt = "";
    let calls = 0;
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async (request) => {
        calls += 1;
        if (calls === 2) secondPrompt = request.userPrompt;
        const payload =
          calls === 1
            ? validPayload({ deliverables: [validDeliverable({ channel: "instagram" })] })
            : validPayload();
        return {
          rawText: JSON.stringify(payload),
          usage: buildLlmUsage({
            provider: "openai",
            model: "gpt-test",
            inputTokens: 100,
            outputTokens: 50,
            latencyMs: 10,
          }),
        };
      },
    };

    const client = new BrainLlmClient(provider);
    await client.completeWithValidationRetry(
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
    expect(secondPrompt).toContain("[unapproved_channel]");
    expect(secondPrompt).toContain("deliverables[0].channel");
  });

  it("occurs at most once before deterministic fallback", async () => {
    let calls = 0;
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => {
        calls += 1;
        return {
          rawText: JSON.stringify(validPayload({ deliverables: [validDeliverable({ channel: "instagram" })] })),
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

  it("preserves upstream diagnostics and tokens through business-validation fallback", async () => {
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
    const orgId = "org-business-fallback";
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

    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => ({
        rawText: JSON.stringify(validPayload({ deliverables: [validDeliverable({ channel: "instagram" })] })),
        usage: buildLlmUsage({
          provider: "openai",
          model: "gpt-test",
          inputTokens: 150,
          outputTokens: 60,
          latencyMs: 12,
        }),
      }),
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

    expect(result.fallbackReason).toBe("business_validation_failed");
    expect(result.usage?.requestStarted).toBe(true);
    expect(result.usage?.inputTokens).toBe(150);
    expect(result.usage?.upstreamStrategyFound).toBe(true);
    expect(result.usage?.upstreamChannelsFound).toBe(true);
    expect(result.usage?.businessValidationSubreason).toBe("unapproved_channel");
    expect(result.usage?.approvedCanonicalChannels).toContain("linkedin");
    expect(result.usage?.generatedCanonicalChannels).toContain("instagram");

    const runResult = {
      run: {
        capabilityId: "creative_generation",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        usage: result.usage ?? {},
      },
      cacheHit: false,
    } as BrainRunResult;
    const devDiagnostics = extractBrainDevDiagnostics(runResult);
    expect(devDiagnostics.upstreamStrategyFound).toBe(true);
    expect(devDiagnostics.upstreamChannelsFound).toBe(true);
    expect(devDiagnostics.businessValidationSubreason).toBe("unapproved_channel");
  });
});
