import { beforeEach, describe, expect, it, vi } from "vitest";
import { creativeGenerationPromptBuilder } from "@/lib/brain/prompts/creative-generation-prompt-builder";
import {
  CREATIVE_GENERATION_CAPABILITY_TIMEOUT_MS,
  CREATIVE_GENERATION_CLIENT_ACTION_TIMEOUT_MS,
  CREATIVE_GENERATION_MAX_OUTPUT_TOKENS,
  CREATIVE_GENERATION_PROVIDER_TIMEOUT_MS,
  CREATIVE_GENERATION_SERVER_ACTION_TIMEOUT_MS,
  createCreativeGenerationLlmRequest,
} from "@/lib/brain/llm/creative-generation-llm-config";
import {
  CREATIVE_GENERATION_MAX_DELIVERABLES,
  CREATIVE_GENERATION_MIN_DELIVERABLES,
} from "@/lib/brain/llm/creative-generation-contract";
import { CREATIVE_GENERATION_LLM_JSON_SCHEMA } from "@/lib/brain/llm/json-schema";
import { BrainLlmClient } from "@/lib/brain/llm/client";
import { BrainLlmTimeoutError } from "@/lib/brain/llm/errors";
import { withLlmRetry } from "@/lib/brain/llm/retry";
import { OpenAIBrainLlmProvider } from "@/lib/brain/llm/openai-provider";
import { executeCreativeGenerationWithLlmFallback } from "@/lib/brain/llm/execute-creative-generation-llm";
import type { BrainLlmProvider } from "@/lib/brain/llm/provider";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
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

describe("creative generation timeout policy", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
  });

  it("requests a bounded number of deliverables in the prompt", () => {
    const prompt = creativeGenerationPromptBuilder.build({
      context: {
        companyBrandSummary: "Peergent",
        campaignGoal: "Grow demo requests",
        targetAudience: "SMB owners",
        strategySummary: "Focus on clarity",
        approvedChannels: "linkedin, google_ads, email, blog, seo, instagram, meta_ads, landing_page",
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

    expect(prompt.userPrompt).toContain(`${CREATIVE_GENERATION_MIN_DELIVERABLES}–${CREATIVE_GENERATION_MAX_DELIVERABLES}`);
    expect(prompt.userPrompt).toMatch(/not one per channel/i);
  });

  it("does not force eight deliverables when eight channels are approved", () => {
    expect(CREATIVE_GENERATION_MAX_DELIVERABLES).toBeLessThan(8);
    expect(JSON.stringify(CREATIVE_GENERATION_LLM_JSON_SCHEMA)).toContain('"maxItems":5');
  });

  it("applies capability-specific output token budget", () => {
    const request = createCreativeGenerationLlmRequest({
      capabilityId: "creative_generation",
      capabilityVersion: "1.0.0",
      systemPrompt: "system",
      userPrompt: "user",
      jsonSchema: CREATIVE_GENERATION_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
      contextHash: "hash",
    });

    expect(request.maxOutputTokens).toBe(CREATIVE_GENERATION_MAX_OUTPUT_TOKENS);
    expect(request.maxOutputTokens).toBeLessThan(4096);
    expect(request.timeoutMs).toBe(CREATIVE_GENERATION_PROVIDER_TIMEOUT_MS);
  });

  it("records timeout owner from provider abort controller", async () => {
    const fetchImpl = vi.fn(async (_url, init) => {
      const signal = init?.signal as AbortSignal | undefined;
      signal?.dispatchEvent(new Event("abort"));
      throw Object.assign(new Error("Aborted"), { name: "AbortError" });
    }) as unknown as typeof fetch;

    const provider = new OpenAIBrainLlmProvider({
      apiKey: "test-key",
      fetchImpl,
      timeoutMs: 12,
    });

    await expect(
      provider.complete(
        {
          capabilityId: "creative_generation",
          capabilityVersion: "1.0.0",
          systemPrompt: "sys",
          userPrompt: "user",
          jsonSchema: {},
          contextHash: "ctx",
          timeoutMs: 12,
        },
        { attemptNumber: 1 }
      )
    ).rejects.toMatchObject({
      timeoutDiagnostics: {
        timeoutOwner: "openai_provider_abort_controller",
        configuredTimeoutMs: 12,
        attemptNumber: 1,
        responseHeadersReceived: false,
        responseBodyStarted: false,
      },
    });
  });

  it("does not retry request timeouts at the HTTP layer", async () => {
    let calls = 0;
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => {
        calls += 1;
        throw new BrainLlmTimeoutError("OpenAI request timed out.", {
          timeoutOwner: "openai_provider_abort_controller",
          configuredTimeoutMs: 75_000,
          attemptNumber: calls,
          requestStartedAt: new Date().toISOString(),
          requestAbortedAt: new Date().toISOString(),
          responseHeadersReceived: false,
          responseBodyStarted: false,
        });
      },
    };

    const client = new BrainLlmClient(provider);
    await expect(
      client.complete(
        createCreativeGenerationLlmRequest({
          capabilityId: "creative_generation",
          capabilityVersion: "1.0.0",
          systemPrompt: "system",
          userPrompt: "user",
          jsonSchema: {},
          contextHash: "hash",
        }),
        { maxHttpRetries: 3 }
      )
    ).rejects.toBeInstanceOf(BrainLlmTimeoutError);

    expect(calls).toBe(1);
  });

  it("does not trigger validation repair after request timeout", async () => {
    let calls = 0;
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => {
        calls += 1;
        throw new BrainLlmTimeoutError("OpenAI request timed out.", {
          timeoutOwner: "openai_provider_abort_controller",
          configuredTimeoutMs: 75_000,
          attemptNumber: 1,
          requestStartedAt: new Date().toISOString(),
          requestAbortedAt: new Date().toISOString(),
          responseHeadersReceived: false,
          responseBodyStarted: false,
        });
      },
    };

    const client = new BrainLlmClient(provider);
    await expect(
      client.completeWithValidationRetry(
        createCreativeGenerationLlmRequest({
          capabilityId: "creative_generation",
          capabilityVersion: "1.0.0",
          systemPrompt: "system",
          userPrompt: "user",
          jsonSchema: CREATIVE_GENERATION_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
          contextHash: "hash",
        }),
        () => {
          throw new Error("should not validate");
        },
        { maxRepairAttempts: 1 }
      )
    ).rejects.toBeInstanceOf(BrainLlmTimeoutError);

    expect(calls).toBe(1);
  });

  it("keeps outer timeouts larger than provider timeout", () => {
    expect(CREATIVE_GENERATION_CAPABILITY_TIMEOUT_MS).toBeGreaterThan(
      CREATIVE_GENERATION_PROVIDER_TIMEOUT_MS
    );
    expect(CREATIVE_GENERATION_SERVER_ACTION_TIMEOUT_MS).toBeGreaterThan(
      CREATIVE_GENERATION_CAPABILITY_TIMEOUT_MS
    );
    expect(CREATIVE_GENERATION_CLIENT_ACTION_TIMEOUT_MS).toBeGreaterThan(
      CREATIVE_GENERATION_SERVER_ACTION_TIMEOUT_MS
    );
  });

  it("succeeds when response completes before timeout", async () => {
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => ({
        rawText: JSON.stringify({
          deliverables: [
            {
              id: "d1",
              deliverableType: "linkedin_carousel",
              channel: "linkedin",
              purpose: "Awareness",
              targetAudience: "SMB owners",
              objective: "Drive demos",
              messageAngle: "Clarity first",
              keyPoints: ["AI workspace"],
              callToActionDirection: "Book a demo",
              format: "Carousel — 5 slides",
              reviewStatus: "planned",
              rationale: "Primary B2B channel",
              dependencies: [],
              assumptions: [],
              provenance: "Approved strategy",
            },
          ],
          decisions: [],
          recommendations: [],
          actionProposals: [],
          warnings: [],
        }),
        usage: buildLlmUsage({
          provider: "openai",
          model: "gpt-test",
          inputTokens: 120,
          outputTokens: 80,
          latencyMs: 900,
        }),
      }),
    };

    const client = new BrainLlmClient(provider);
    const result = await client.complete(
      createCreativeGenerationLlmRequest({
        capabilityId: "creative_generation",
        capabilityVersion: "1.0.0",
        systemPrompt: "system",
        userPrompt: "user",
        jsonSchema: CREATIVE_GENERATION_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
        contextHash: "hash",
      }),
      { maxHttpRetries: 1 }
    );

    expect(result.usage.inputTokens).toBe(120);
  });

  it("preserves upstream diagnostics on timeout fallback", async () => {
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
    const orgId = "org-timeout-fallback";
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
      complete: async () => {
        throw new BrainLlmTimeoutError("OpenAI request timed out.", {
          timeoutOwner: "openai_provider_abort_controller",
          configuredTimeoutMs: CREATIVE_GENERATION_PROVIDER_TIMEOUT_MS,
          attemptNumber: 1,
          requestStartedAt: new Date().toISOString(),
          requestAbortedAt: new Date().toISOString(),
          responseHeadersReceived: false,
          responseBodyStarted: false,
        });
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

    expect(result.fallbackReason).toBe("request_timeout");
    expect(result.usage?.requestStarted).toBe(true);
    expect(result.usage?.inputTokens).toBe(0);
    expect(result.usage?.validationRepairCount).toBe(0);
    expect(result.usage?.upstreamStrategyFound).toBe(true);
    expect(result.usage?.timeoutOwner).toBe("openai_provider_abort_controller");

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
    expect(devDiagnostics.timeoutOwner).toBe("openai_provider_abort_controller");
  });
});

describe("withLlmRetry timeout behavior", () => {
  it("does not perform identical HTTP retries after timeout", async () => {
    let calls = 0;
    await expect(
      withLlmRetry(async () => {
        calls += 1;
        throw new BrainLlmTimeoutError("OpenAI request timed out.", {
          timeoutOwner: "openai_provider_abort_controller",
          configuredTimeoutMs: 75_000,
          attemptNumber: calls,
          requestStartedAt: new Date().toISOString(),
          requestAbortedAt: new Date().toISOString(),
          responseHeadersReceived: false,
          responseBodyStarted: false,
        });
      }, { maxAttempts: 3 })
    ).rejects.toBeInstanceOf(BrainLlmTimeoutError);

    expect(calls).toBe(1);
  });
});
