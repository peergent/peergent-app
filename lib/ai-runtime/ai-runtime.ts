import type { PromptPackage } from "@/lib/prompt-builder";
import type { LLMProvider } from "./provider";
import { defaultOpenAIProvider } from "./openai-provider";
import { validateResponse } from "./response-validator";
import type { AIResponse, AIRuntimeOptions } from "./types";
import {
  DEFAULT_AI_MAX_TOKENS,
  DEFAULT_AI_TEMPERATURE,
} from "./types";

export type AIRuntimeConfig = {
  provider?: LLMProvider;
};

export class AIRuntime {
  private readonly provider: LLMProvider;

  constructor(config: AIRuntimeConfig = {}) {
    this.provider = config.provider ?? defaultOpenAIProvider;
  }

  /** Single public responsibility: execute a prompt against the configured provider. */
  async execute(
    promptPackage: PromptPackage,
    options: AIRuntimeOptions = {}
  ): Promise<AIResponse> {
    return this.generateFromPromptPackage(promptPackage, options);
  }

  async generateFromPromptPackage(
    promptPackage: PromptPackage,
    options: AIRuntimeOptions = {}
  ): Promise<AIResponse> {
    const providerResult = await this.provider.generateResponse({
      systemPrompt: promptPackage.systemPrompt,
      taskPrompt: promptPackage.taskPrompt,
      temperature: options.temperature ?? DEFAULT_AI_TEMPERATURE,
      maxTokens: options.maxTokens ?? DEFAULT_AI_MAX_TOKENS,
      model: options.model,
    });

    const validated = validateResponse(
      providerResult.text,
      options.responseValidation
    );

    const metadata = {
      provider: this.provider.name,
      model: providerResult.model,
      finishReason: providerResult.finishReason,
      latencyMs: providerResult.latencyMs,
      usage: providerResult.usage,
      generatedAt: new Date().toISOString(),
      promptTraceId: promptPackage.metadata.traceId,
      peerRole: promptPackage.metadata.peerRole,
    };

    if (!validated.success) {
      return { text: "", providerResult, validated, metadata };
    }

    return { text: validated.text, providerResult, validated, metadata };
  }
}

export const defaultAIRuntime = new AIRuntime();

export async function execute(
  promptPackage: PromptPackage,
  options: AIRuntimeOptions = {}
): Promise<AIResponse> {
  return defaultAIRuntime.execute(promptPackage, options);
}

/** @deprecated Use execute() */
export async function generateAIResponse(
  promptPackage: PromptPackage,
  options: AIRuntimeOptions = {}
): Promise<AIResponse> {
  return defaultAIRuntime.execute(promptPackage, options);
}
