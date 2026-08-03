import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assembleCompanyContextSync,
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  clearDemoWebsiteSnapshots,
  createBrainRuntime,
  createLlmBrainProvider,
  getBrainCapability,
  isBrainUseOpenAIEnabled,
  mapStrategyPayloadToBrainOutput,
  projectBrainContext,
  resetDefaultBrainRuntime,
  resetPromptContextCache,
  selectBrainProvider,
  strategyPromptBuilder,
  validateStrategyLlmPayload,
  evaluateReadinessGate,
} from "@/lib/brain";
import { missingCriticalFieldsFromAssembly } from "@/lib/brain/runtime/readiness-gate";
import { createBrainRepositories } from "@/lib/brain/persistence/repository-factory";
import { InMemoryBrainRunRepository } from "@/lib/brain/runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "@/lib/brain/runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "@/lib/brain/runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "@/lib/brain/runtime/repositories/in-memory-idempotency-repository";
import { createPersistentInMemoryRepositories } from "@/lib/brain/persistence/in-memory-persistent-repositories";
import { InMemoryBrainCacheStore } from "@/lib/brain/cache/store";
import { createDeterministicBrainProvider } from "@/lib/brain/providers/deterministic-provider";
import { createDemoBrainProvider } from "@/lib/brain/demo/demo-provider";
import { buildStrategyProjectedContext } from "@/lib/brain/prompts/projected-context";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { createBrainLlmClient } from "@/lib/brain/llm/client";
import { BrainLlmError, BrainLlmParseError, BrainLlmValidationError } from "@/lib/brain/llm/errors";
import { parseJsonResponse } from "@/lib/brain/llm/response";
import { withLlmRetry } from "@/lib/brain/llm/retry";
import {
  buildPromptCacheKey,
  getCachedPromptContext,
  setCachedPromptContext,
} from "@/lib/brain/llm/prompt-cache";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import type { BrainLlmProvider } from "@/lib/brain/llm/provider";
import type { BrainLlmRequest } from "@/lib/brain/llm/types";
import { OpenAIBrainLlmProvider } from "@/lib/brain/llm/openai-provider";
import { createLlmRequest } from "@/lib/brain/llm/request";
import { STRATEGY_LLM_JSON_SCHEMA } from "@/lib/brain/llm/json-schema";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { CustomerCorrection } from "@/lib/brain/company/corrections";

const readinessCorrection: CustomerCorrection = {
  id: "corr-readiness",
  organizationId: "org-readiness",
  fieldKey: "positioning",
  action: "edit",
  correctedValue: "AI workforce operating system for growing teams",
  correctedAt: "2026-08-01T00:00:00.000Z",
  correctedBy: "test",
  source: "customer_confirmed",
};

const sampleMarketingUnderstanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 88,
  gaps: [],
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

function validStrategyPayload() {
  return {
    findings: [
      {
        id: "strategy-1",
        label: "Business objective",
        value: "Grow qualified demo requests from SMB owners.",
        confidence: "medium",
      },
      {
        id: "strategy-2",
        label: "Campaign objective",
        value: "More demo requests from SMB owners.",
        confidence: "medium",
      },
    ],
    decisions: [
      {
        id: "dec-strategy-1",
        label: "Recommended direction",
        rationale: "Focus on clarity and proof for SMB decision makers.",
        confidence: "medium",
      },
    ],
    recommendations: [
      {
        id: "rec-strategy-1",
        label: "Next step: select channels",
        priority: "high",
      },
    ],
    actionProposals: [
      {
        id: "act-strategy-1",
        actionType: "approve_strategy",
        label: "Confirm strategy",
        requiresApproval: true,
      },
    ],
    warnings: [],
  };
}

function strategyAssembly(orgId: string) {
  const profile = buildPeergentCompanyProfile("en");
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: orgId,
    url: "https://peergent.com",
  });
  const project = createMarketingCampaignProject(peergentInput);
  const campaignContext = buildCampaignContextFromCreateInput(project, peergentInput, "en");
  return assembleCompanyContextSync({
    organizationId: orgId,
    companyProfile: { ...profile, organizationId: orgId },
    websiteSnapshot: website,
    campaignContext,
    marketingUnderstanding: sampleMarketingUnderstanding,
    corrections: [readinessCorrection],
  });
}

function mockLlmProvider(
  handler: (request: BrainLlmRequest) => Promise<{ rawText: string; usage: ReturnType<typeof buildLlmUsage> }>
): BrainLlmProvider {
  return {
    id: "openai",
    complete: handler,
  };
}

describe("Project Brain Sprint 7 — LLM layer", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    resetDefaultBrainRuntime();
    resetPromptContextCache();
    vi.unstubAllEnvs();
  });

  describe("feature flag", () => {
    it("defaults OpenAI routing to off", () => {
      expect(isBrainUseOpenAIEnabled()).toBe(false);
    });

    it("respects BRAIN_USE_OPENAI=true", () => {
      vi.stubEnv("BRAIN_USE_OPENAI", "true");
      expect(isBrainUseOpenAIEnabled()).toBe(true);
    });

    it("allows explicit override without env", () => {
      expect(isBrainUseOpenAIEnabled(true)).toBe(true);
      expect(isBrainUseOpenAIEnabled(false)).toBe(false);
    });
  });

  describe("provider selection", () => {
    it("selects llm provider first in live when registered", () => {
      const llm = createLlmBrainProvider({ useOpenAI: true });
      const selection = selectBrainProvider({
        environment: "live",
        capabilityId: "strategy",
        providers: [llm, createDeterministicBrainProvider(), createDemoBrainProvider()],
      });
      expect(selection.provider.id).toBe("llm");
      expect(selection.providerClass).toBe("live");
    });

    it("registers llm provider in live factory when flag enabled", () => {
      vi.stubEnv("BRAIN_USE_OPENAI", "true");
      const bundle = createBrainRepositories({ environment: "live" });
      expect(bundle.providers.some((p) => p.id === "llm")).toBe(true);
    });

    it("does not register llm provider when flag disabled", () => {
      const bundle = createBrainRepositories({ environment: "live" });
      expect(bundle.providers.some((p) => p.id === "llm")).toBe(false);
    });
  });

  describe("prompt building and projection", () => {
    it("builds Emma strategy prompts from projected slices only", () => {
      const assembly = strategyAssembly("org-llm-test");
      const def = getBrainCapability("strategy");
      const projected = projectBrainContext({
        fullSnapshot: assembly.brainSnapshot,
        companySnapshot: assembly.companySnapshot,
        requiredSlices: def.requiredContext,
        optionalSlices: def.optionalContext,
      });
      const execCtx = buildCapabilityExecutionContext({
        assembly,
        request: {
          organizationId: assembly.companySnapshot.organizationId,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          campaignContext: buildCampaignContextFromCreateInput(
            createMarketingCampaignProject(peergentInput),
            peergentInput,
            "en"
          ),
          locale: "en",
        },
      });
      const context = buildStrategyProjectedContext({
        snapshot: projected.snapshot,
        companySnapshot: assembly.companySnapshot,
        executionContext: execCtx,
        projection: projected.projection,
      });
      const prompts = strategyPromptBuilder.build({ context, locale: "en" });
      expect(prompts.systemPrompt).toMatch(/Emma/i);
      expect(prompts.systemPrompt).not.toMatch(/ChatGPT/i);
      expect(prompts.userPrompt).toContain("Company profile:");
      expect(prompts.userPrompt).not.toMatch(/run history|audit|internal id/i);
    });
  });

  describe("prompt cache", () => {
    it("misses then hits on same context hash", () => {
      const key = buildPromptCacheKey({
        capabilityId: "strategy",
        capabilityVersion: "1.0.0",
        contextHash: "ctx-abc",
      });
      expect(getCachedPromptContext(key)).toBeNull();
      setCachedPromptContext(key, { systemPrompt: "sys", userPrompt: "user" });
      expect(getCachedPromptContext(key)?.systemPrompt).toBe("sys");
    });
  });

  describe("response parsing and validation", () => {
    it("parses strict JSON and strips markdown fences", () => {
      const parsed = parseJsonResponse("```json\n{\"ok\":true}\n```");
      expect(parsed).toEqual({ ok: true });
    });

    it("throws on malformed JSON", () => {
      expect(() => parseJsonResponse("not json")).toThrow(BrainLlmParseError);
    });

    it("validates required strategy fields", () => {
      const payload = validStrategyPayload();
      expect(() =>
        validateStrategyLlmPayload(payload, {
          capabilityVersion: "1.0.0",
          knownCompetitors: [],
        })
      ).not.toThrow();
    });

    it("rejects unsupported percentages", () => {
      const payload = validStrategyPayload();
      payload.findings[0]!.value = "Expect 42% lift in conversions.";
      expect(() =>
        validateStrategyLlmPayload(payload, {
          capabilityVersion: "1.0.0",
          knownCompetitors: [],
        })
      ).toThrow(BrainLlmValidationError);
    });

    it("rejects invented competitors when none known", () => {
      const payload = validStrategyPayload();
      payload.findings.push({
        id: "strategy-x",
        label: "Competitor landscape",
        value: "Acme Corp is the main rival.",
        confidence: "high",
      });
      expect(() =>
        validateStrategyLlmPayload(payload, {
          capabilityVersion: "1.0.0",
          knownCompetitors: [],
        })
      ).toThrow(BrainLlmValidationError);
    });

    it("maps validated payload to BrainStructuredOutput", () => {
      const payload = validStrategyPayload();
      validateStrategyLlmPayload(payload, {
        capabilityVersion: "1.0.0",
        knownCompetitors: [],
      });
      const output = mapStrategyPayloadToBrainOutput(payload, {
        capabilityVersion: "1.0.0",
        generatedAt: "2026-08-01T00:00:00.000Z",
        provenanceRef: "llm:strategy:test",
      });
      expect(output.capabilityId).toBe("strategy");
      expect(output.findings.length).toBeGreaterThan(0);
      expect(output.findings[0]?.provenance.length).toBeGreaterThan(0);
    });
  });

  describe("retry policy", () => {
    it("retries retryable HTTP errors with backoff", async () => {
      let attempts = 0;
      const result = await withLlmRetry(
        async () => {
          attempts += 1;
          if (attempts < 2) {
            throw new BrainLlmError("provider_error", "Rate limited", {
              retryable: true,
              statusCode: 429,
            });
          }
          return "ok";
        },
        { maxAttempts: 3, baseDelayMs: 1 }
      );
      expect(result).toBe("ok");
      expect(attempts).toBe(2);
    });

    it("does not retry validation failures", async () => {
      let attempts = 0;
      await expect(
        withLlmRetry(async () => {
          attempts += 1;
          throw new BrainLlmValidationError("bad output");
        })
      ).rejects.toThrow(BrainLlmValidationError);
      expect(attempts).toBe(1);
    });
  });

  describe("OpenAI provider (mocked)", () => {
    it("uses Responses API shape and records usage", async () => {
      const fetchImpl = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          model: "gpt-test",
          output_text: JSON.stringify(validStrategyPayload()),
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
      })) as unknown as typeof fetch;

      const provider = new OpenAIBrainLlmProvider({
        apiKey: "test-key",
        fetchImpl,
        baseUrl: "https://api.openai.com/v1/responses",
      });

      const response = await provider.complete(
        createLlmRequest({
          capabilityId: "strategy",
          capabilityVersion: "1.0.0",
          systemPrompt: "sys",
          userPrompt: "user",
          jsonSchema: STRATEGY_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
          contextHash: "ctx-test",
        })
      );

      expect(fetchImpl).toHaveBeenCalledOnce();
      const [, init] = fetchImpl.mock.calls[0]!;
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body));
      expect(body.instructions).toBe("sys");
      expect(body.text?.format?.type).toBe("json_object");
      expect(response.usage.inputTokens).toBe(100);
      expect(response.usage.outputTokens).toBe(50);
      expect(response.usage.estimatedCostCents).toBeGreaterThanOrEqual(0);
    });

    it("marks timeout as retryable", async () => {
      const fetchImpl = vi.fn(async (_url, init) => {
        const signal = init?.signal as AbortSignal | undefined;
        signal?.dispatchEvent(new Event("abort"));
        throw Object.assign(new Error("Aborted"), { name: "AbortError" });
      }) as unknown as typeof fetch;

      const provider = new OpenAIBrainLlmProvider({
        apiKey: "test-key",
        fetchImpl,
        timeoutMs: 5,
      });

      await expect(
        provider.complete(
          createLlmRequest({
            capabilityId: "strategy",
            capabilityVersion: "1.0.0",
            systemPrompt: "sys",
            userPrompt: "user",
            jsonSchema: {},
            contextHash: "ctx-test",
          })
        )
      ).rejects.toMatchObject({ code: "timeout", retryable: true });
    });
  });

  describe("LLM client validation retry", () => {
    it("retries once on validation failure then succeeds", async () => {
      let calls = 0;
      const provider = mockLlmProvider(async () => {
        calls += 1;
        const payload =
          calls === 1
            ? { findings: [], decisions: [], recommendations: [], actionProposals: [], warnings: [] }
            : validStrategyPayload();
        return {
          rawText: JSON.stringify(payload),
          usage: buildLlmUsage({
            provider: "openai",
            model: "gpt-test",
            inputTokens: 10,
            outputTokens: 20,
            latencyMs: 5,
          }),
        };
      });

      const client = createBrainLlmClient(provider);
      const { result } = await client.completeWithValidationRetry(
        createLlmRequest({
          capabilityId: "strategy",
          capabilityVersion: "1.0.0",
          systemPrompt: "sys",
          userPrompt: "user",
          jsonSchema: {},
          contextHash: "ctx-test",
        }),
        (parsed) =>
          validateStrategyLlmPayload(parsed, {
            capabilityVersion: "1.0.0",
            knownCompetitors: [],
          })
      );

      expect(calls).toBe(2);
      expect(result.findings?.length).toBeGreaterThan(0);
    });
  });

  describe("capability provider fallback", () => {
    it("falls back to deterministic when LLM fails", async () => {
      const assembly = strategyAssembly("org-fallback");
      const def = getBrainCapability("strategy");
      const projected = projectBrainContext({
        fullSnapshot: assembly.brainSnapshot,
        companySnapshot: assembly.companySnapshot,
        requiredSlices: def.requiredContext,
        optionalSlices: def.optionalContext,
      });
      const execCtx = buildCapabilityExecutionContext({
        assembly,
        request: {
          organizationId: assembly.companySnapshot.organizationId,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          campaignContext: buildCampaignContextFromCreateInput(
            createMarketingCampaignProject(peergentInput),
            peergentInput,
            "en"
          ),
          locale: "en",
        },
      });

      const failingProvider = mockLlmProvider(async () => {
        throw new BrainLlmError("provider_error", "503", { retryable: false, statusCode: 503 });
      });

      const llm = createLlmBrainProvider({ useOpenAI: true, llmProvider: failingProvider });
      const result = await llm.execute({
        context: {
          organizationId: assembly.companySnapshot.organizationId,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          environment: "live",
        },
        snapshot: projected.snapshot,
        capabilityId: "strategy",
        companySnapshot: assembly.companySnapshot,
        executionContext: execCtx,
        projection: projected.projection,
      });

      expect(result.capabilityId).toBe("strategy");
      expect(result.findings.length).toBeGreaterThan(0);
      expect(llm.consumeLastUsage()).toBeUndefined();
    });

    it("records usage when LLM succeeds", async () => {
      const assembly = strategyAssembly("org-usage");
      const def = getBrainCapability("strategy");
      const projected = projectBrainContext({
        fullSnapshot: assembly.brainSnapshot,
        companySnapshot: assembly.companySnapshot,
        requiredSlices: def.requiredContext,
        optionalSlices: def.optionalContext,
      });
      const execCtx = buildCapabilityExecutionContext({
        assembly,
        request: {
          organizationId: assembly.companySnapshot.organizationId,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          campaignContext: buildCampaignContextFromCreateInput(
            createMarketingCampaignProject(peergentInput),
            peergentInput,
            "en"
          ),
          locale: "en",
        },
      });

      const okProvider = mockLlmProvider(async () => ({
        rawText: JSON.stringify(validStrategyPayload()),
        usage: buildLlmUsage({
          provider: "openai",
          model: "gpt-test",
          inputTokens: 200,
          outputTokens: 80,
          latencyMs: 12,
        }),
      }));

      const llm = createLlmBrainProvider({ useOpenAI: true, llmProvider: okProvider });
      await llm.execute({
        context: {
          organizationId: assembly.companySnapshot.organizationId,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          environment: "live",
        },
        snapshot: projected.snapshot,
        capabilityId: "strategy",
        companySnapshot: assembly.companySnapshot,
        executionContext: execCtx,
        projection: projected.projection,
      });

      const usage = llm.consumeLastUsage();
      expect(usage?.inputTokens).toBe(200);
      expect(usage?.outputTokens).toBe(80);
      expect(usage?.estimatedCostCents).toBeGreaterThanOrEqual(0);
    });
  });

  describe("runtime integration", () => {
    it("passes strategy readiness gate with campaign assembly", () => {
      const assembly = strategyAssembly("org-readiness-check");
      const dimensionScores = Object.fromEntries(
        assembly.readiness.scores.map((s) => [s.dimension, s.score])
      ) as Record<string, number>;
      const gate = evaluateReadinessGate({
        capabilityId: "strategy",
        overallScore: assembly.readiness.overallScore,
        dimensionScores: dimensionScores as never,
        missingCriticalFields: missingCriticalFieldsFromAssembly("strategy", assembly.missingInformation),
        assemblyState: assembly.state,
      });
      expect(gate.ok).toBe(true);
    });

    it("routes strategy through LLM and persists usage on run", async () => {
      const orgId = "org-llm-runtime-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      const okProvider = mockLlmProvider(async () => ({
        rawText: JSON.stringify(validStrategyPayload()),
        usage: buildLlmUsage({
          provider: "openai",
          model: "gpt-test",
          inputTokens: 300,
          outputTokens: 120,
          latencyMs: 20,
        }),
      }));

      const runtime = createBrainRuntime({
        runRepository: new InMemoryBrainRunRepository(),
        outputRepository: new InMemoryBrainOutputRepository(),
        auditRepository: new InMemoryBrainAuditRepository(),
        idempotencyRepository: new InMemoryBrainIdempotencyRepository(),
        asyncRepositories: createPersistentInMemoryRepositories(),
        storageMode: "persistent_in_memory",
        cache: new InMemoryBrainCacheStore(),
        providers: [
          createLlmBrainProvider({ useOpenAI: true, llmProvider: okProvider }),
          createDeterministicBrainProvider(),
        ],
        assembleContext: (request) => strategyAssembly(request.organizationId),
      });

      const result = await runtime.executeRun({
        organizationId: orgId,
        peerId: "peer-marketing",
        capabilityId: "strategy",
        actorId: "test",
        environment: "live",
        campaignContext: buildCampaignContextFromCreateInput(
          createMarketingCampaignProject(peergentInput),
          peergentInput,
          "en"
        ),
      });

      expect(result.run.status).not.toBe("waiting_for_input");
      expect(result.output?.capabilityId).toBe("strategy");
      expect(result.run.usage?.inputTokens).toBe(300);
      expect(result.run.usage?.outputTokens).toBe(120);
      expect(result.run.usage?.estimatedCostCents).toBeGreaterThanOrEqual(0);
    });

    it("keeps non-strategy capabilities on deterministic path", async () => {
      const orgId = "org-llm-other-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
      const llmCalls: string[] = [];
      const okProvider = mockLlmProvider(async (req) => {
        llmCalls.push(req.capabilityId);
        return {
          rawText: JSON.stringify(validStrategyPayload()),
          usage: buildLlmUsage({
            provider: "openai",
            model: "gpt-test",
            inputTokens: 1,
            outputTokens: 1,
            latencyMs: 1,
          }),
        };
      });

      const runtime = createBrainRuntime({
        runRepository: new InMemoryBrainRunRepository(),
        outputRepository: new InMemoryBrainOutputRepository(),
        auditRepository: new InMemoryBrainAuditRepository(),
        idempotencyRepository: new InMemoryBrainIdempotencyRepository(),
        asyncRepositories: createPersistentInMemoryRepositories(),
        storageMode: "persistent_in_memory",
        cache: new InMemoryBrainCacheStore(),
        providers: [
          createLlmBrainProvider({ useOpenAI: true, llmProvider: okProvider }),
          createDeterministicBrainProvider(),
        ],
        assembleContext: (request) => strategyAssembly(request.organizationId),
      });

      await runtime.executeRun({
        organizationId: orgId,
        peerId: "peer-marketing",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "live",
      });

      expect(llmCalls).toHaveLength(0);
    });
  });

  describe("executeStrategyWithLlmFallback direct", () => {
    it("uses deterministic when OpenAI disabled on provider", async () => {
      const assembly = strategyAssembly("org-direct");
      const def = getBrainCapability("strategy");
      const projected = projectBrainContext({
        fullSnapshot: assembly.brainSnapshot,
        companySnapshot: assembly.companySnapshot,
        requiredSlices: def.requiredContext,
        optionalSlices: def.optionalContext,
      });
      const execCtx = buildCapabilityExecutionContext({
        assembly,
        request: {
          organizationId: assembly.companySnapshot.organizationId,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          campaignContext: buildCampaignContextFromCreateInput(
            createMarketingCampaignProject(peergentInput),
            peergentInput,
            "en"
          ),
          locale: "en",
        },
      });

      const llmCalls: string[] = [];
      const okProvider = mockLlmProvider(async () => {
        llmCalls.push("called");
        return {
          rawText: JSON.stringify(validStrategyPayload()),
          usage: buildLlmUsage({
            provider: "openai",
            model: "gpt-test",
            inputTokens: 1,
            outputTokens: 1,
            latencyMs: 1,
          }),
        };
      });

      const llm = createLlmBrainProvider({ useOpenAI: false, llmProvider: okProvider });
      const result = await llm.execute({
        context: {
          organizationId: assembly.companySnapshot.organizationId,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          environment: "live",
        },
        snapshot: projected.snapshot,
        capabilityId: "strategy",
        companySnapshot: assembly.companySnapshot,
        executionContext: execCtx,
        projection: projected.projection,
      });

      expect(llmCalls).toHaveLength(0);
      expect(result.findings.length).toBeGreaterThan(0);
    });
  });
});
