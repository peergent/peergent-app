import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeBrainForWorkflowStep } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import { createDeterministicBrainProvider } from "@/lib/brain/providers/deterministic-provider";
import { createDemoBrainProvider } from "@/lib/brain/demo/demo-provider";
import { InMemoryBrainCacheStore } from "@/lib/brain/cache/store";
import { createPersistentInMemoryRepositories } from "@/lib/brain/persistence/in-memory-persistent-repositories";
import { InMemoryBrainRunRepository } from "@/lib/brain/runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "@/lib/brain/runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "@/lib/brain/runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "@/lib/brain/runtime/repositories/in-memory-idempotency-repository";
import type { BrainRepositoryBundle } from "@/lib/brain/persistence/repository-factory";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { evaluateStrategyContextReadiness } from "@/lib/office/campaign/strategy-context-readiness";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import { mapStrategyPayloadToBrainOutput } from "@/lib/brain/llm/response-validator";
import { executeDeterministicCapability } from "@/lib/brain/providers/deterministic-provider";
import type { BrainCapabilityProvider } from "@/lib/brain/providers/provider-interface";
import {
  assertOpenAiVerifyCreateCampaignInput,
  buildOpenAiVerificationFixture,
  OPENAI_VERIFY_REQUIRED_CREATE_CAMPAIGN_FIELDS,
  printOpenAiVerifySafeMetadata,
} from "./verify-openai-fixture";

const mockLlmComplete = vi.hoisted(() => vi.fn());

function validStrategyPayload() {
  return {
    findings: [
      {
        id: "verify-1",
        label: "Business objective",
        value: "Generate qualified demo requests from Dutch SME decision-makers.",
        confidence: "medium",
      },
    ],
    decisions: [
      {
        id: "dec-verify-1",
        label: "Recommended direction",
        rationale: "Lead with proof and clarity for SME buyers.",
        confidence: "medium",
      },
    ],
    recommendations: [
      {
        id: "rec-verify-1",
        label: "Next step: select channels",
        priority: "high",
      },
    ],
    actionProposals: [
      {
        id: "act-verify-1",
        actionType: "approve_strategy",
        label: "Confirm strategy",
        requiresApproval: true,
      },
    ],
    warnings: [],
  };
}

function createMockLlmProvider(): BrainCapabilityProvider & {
  consumeLastUsage: () => ReturnType<typeof buildLlmUsage> | undefined;
} {
  let lastUsage = buildLlmUsage({
    provider: "openai",
    model: "gpt-verify-mock",
    inputTokens: 42,
    outputTokens: 18,
    latencyMs: 5,
  });

  return {
    id: "llm",
    executeSync: (input) => {
      void input;
      return mapStrategyPayloadToBrainOutput(validStrategyPayload(), {
        capabilityVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
        provenanceRef: "verify-openai-mock",
      });
    },
    execute: async (input) => {
      if (input.capabilityId !== "strategy" || !input.projection) {
        return executeDeterministicCapability(input);
      }
      await mockLlmComplete({ capabilityId: "strategy" });
      lastUsage = buildLlmUsage({
        provider: "openai",
        model: "gpt-verify-mock",
        inputTokens: 42,
        outputTokens: 18,
        latencyMs: 5,
      });
      return mapStrategyPayloadToBrainOutput(validStrategyPayload(), {
        capabilityVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
        provenanceRef: "verify-openai-mock",
      });
    },
    consumeLastUsage: () => {
      const usage = lastUsage;
      lastUsage = undefined;
      return usage;
    },
  };
}

function mockServerRepositories(): BrainRepositoryBundle {
  return {
    storageMode: "persistent_in_memory",
    sync: {
      runs: new InMemoryBrainRunRepository(),
      outputs: new InMemoryBrainOutputRepository(),
      audit: new InMemoryBrainAuditRepository(),
      idempotency: new InMemoryBrainIdempotencyRepository(),
    },
    async: createPersistentInMemoryRepositories(),
    cache: new InMemoryBrainCacheStore(),
    providers: [createMockLlmProvider(), createDeterministicBrainProvider(), createDemoBrainProvider()],
  };
}

vi.mock("@/lib/brain/config/brain-feature-flags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/brain/config/brain-feature-flags")>();
  return {
    ...actual,
    isBrainUseOpenAIEnabled: () => true,
  };
});

vi.mock("@/lib/brain/providers/llm-brain-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/brain/providers/llm-brain-provider")>();
  return {
    ...actual,
    createLlmBrainProvider: () => createMockLlmProvider(),
  };
});

describe("OpenAI verify fixture contract", () => {
  it("lists every required createMarketingCampaignProject string field", () => {
    expect(OPENAI_VERIFY_REQUIRED_CREATE_CAMPAIGN_FIELDS).toEqual([
      "peerId",
      "ownerLabel",
      "name",
      "goalLabel",
      "description",
      "primaryGoalId",
    ]);
  });

  it("builds a valid createMarketingCampaignProject input", () => {
    const { createInput } = buildOpenAiVerificationFixture();
    assertOpenAiVerifyCreateCampaignInput(createInput);
    expect(() => createMarketingCampaignProject(createInput)).not.toThrow();
  });

  it("produces strategy-ready campaign context", () => {
    const { project, domainInput } = buildOpenAiVerificationFixture();
    const ctx = buildCampaignContext({ project, domainInput, locale: "en" });
    expect(evaluateStrategyContextReadiness(ctx).ready).toBe(true);
  });
});

describe("OpenAI verify path (mocked provider)", () => {
  beforeEach(() => {
    mockLlmComplete.mockClear();
  });

  it("reaches live Brain runtime and llm provider selection", async () => {
    const startedMs = Date.now();
    const { project, domainInput } = buildOpenAiVerificationFixture();

    const workflowResult = await executeBrainForWorkflowStep(
      {
        stepId: "strategy_determined",
        peerId: "emma",
        project,
        domainInput,
        locale: "en",
      },
      { repositories: mockServerRepositories() }
    );

    expect(workflowResult).not.toBeNull();
    const result = workflowResult!.result;
    expect(result.run.status).not.toBe("waiting_for_input");
    expect(result.run.usage.providerId).toBe("llm");
    expect(mockLlmComplete).toHaveBeenCalledTimes(1);
    expect(result.output).not.toBeNull();

    const meta = {
      provider: result.run.usage.providerId,
      model: result.run.usage.modelId,
      inputTokens: result.run.usage.inputTokens,
      outputTokens: result.run.usage.outputTokens,
      latencyMs: Date.now() - startedMs,
      validation: result.output ? ("output_present" as const) : ("missing" as const),
      fallback: result.run.usage.providerId !== "llm",
    };
    printOpenAiVerifySafeMetadata(meta);

    expect(meta.provider).toBe("llm");
    expect(meta.fallback).toBe(false);
    expect(meta.validation).toBe("output_present");
  });
});
