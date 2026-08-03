import type { BrainLlmProvider } from "./provider";
import { OpenAIBrainLlmProvider } from "./openai-provider";

const providers = new Map<string, BrainLlmProvider>();

export function registerBrainLlmProvider(provider: BrainLlmProvider): void {
  providers.set(provider.id, provider);
}

export function getBrainLlmProvider(id: string): BrainLlmProvider | null {
  return providers.get(id) ?? null;
}

export function getDefaultBrainLlmProvider(): BrainLlmProvider {
  const openai = providers.get("openai") ?? new OpenAIBrainLlmProvider();
  if (!providers.has("openai")) {
    registerBrainLlmProvider(openai);
  }
  return openai;
}

export function resetBrainLlmProviderRegistry(): void {
  providers.clear();
}
