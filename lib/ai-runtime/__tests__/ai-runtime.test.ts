import { describe, expect, it, vi } from "vitest";
import { AIRuntime } from "../ai-runtime";
import { OpenAIProvider } from "../openai-provider";
import { MissingApiKeyError } from "../errors";
import { validateResponse } from "../response-validator";
import type { LLMProvider } from "../provider";
import type { LLMGenerateRequest, LLMGenerateResult } from "../types";
import { buildPromptPackage } from "@/lib/prompt-builder";
import { createTestBundle } from "@/lib/prompt-builder/__tests__/fixtures";

class MockProvider implements LLMProvider {
  readonly name = "mock";

  constructor(private readonly result: LLMGenerateResult) {}

  async generateResponse(_request: LLMGenerateRequest): Promise<LLMGenerateResult> {
    return this.result;
  }
}

const SAMPLE_PROMPT = buildPromptPackage(createTestBundle(), {
  taskHint: "Draft a helpful reply",
});

describe("AI runtime", () => {
  it("builds a validated response from a PromptPackage", async () => {
    const runtime = new AIRuntime({
      provider: new MockProvider({
        text: "Here is a concise peer response.",
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        model: "mock-model",
        finishReason: "completed",
        latencyMs: 12,
      }),
    });

    const response = await runtime.generateFromPromptPackage(SAMPLE_PROMPT);

    expect(response.text).toBe("Here is a concise peer response.");
    expect(response.validated.success).toBe(true);
    expect(response.metadata.provider).toBe("mock");
    expect(response.metadata.usage.totalTokens).toBe(30);
  });

  it("uses provider abstraction without coupling to OpenAI", async () => {
    const generate = vi.fn(async () => ({
      text: "Provider abstraction works.",
      usage: {},
      model: "mock-model",
      finishReason: "completed",
      latencyMs: 5,
    }));

    const runtime = new AIRuntime({
      provider: {
        name: "custom",
        generateResponse: generate,
      },
    });

    await runtime.generateFromPromptPackage(SAMPLE_PROMPT);

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: SAMPLE_PROMPT.systemPrompt,
        taskPrompt: SAMPLE_PROMPT.taskPrompt,
        temperature: 0.4,
      })
    );
  });

  it("throws a missing API key error", async () => {
    const provider = new OpenAIProvider(undefined, "https://example.com/v1/responses");

    await expect(
      provider.generateResponse({
        systemPrompt: "system",
        taskPrompt: "task",
      })
    ).rejects.toBeInstanceOf(MissingApiKeyError);
  });
});

describe("validateResponse", () => {
  it("rejects empty responses", () => {
    const result = validateResponse("   ");

    expect(result.success).toBe(false);
    expect(result.warnings).toContain("Response was empty or malformed.");
  });

  it("accepts successful responses and strips markdown fences", () => {
    const result = validateResponse("```markdown\nHello peer\n```");

    expect(result.success).toBe(true);
    expect(result.text).toBe("Hello peer");
    expect(result.warnings[0]).toContain("markdown");
  });
});
