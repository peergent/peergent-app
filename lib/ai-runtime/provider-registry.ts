import type { LLMProvider } from "./provider";
import { defaultOpenAIProvider } from "./openai-provider";

export type ProviderId = "openai" | "anthropic";

const anthropicPlaceholder: LLMProvider = {
  name: "anthropic",
  async generateResponse() {
    throw new Error(
      "Anthropic provider is not configured yet. Set provider to openai or add ANTHROPIC_API_KEY support."
    );
  },
};

const providers: Record<ProviderId, LLMProvider> = {
  openai: defaultOpenAIProvider,
  anthropic: anthropicPlaceholder,
};

export function resolveProvider(providerId?: string): LLMProvider {
  if (providerId === "anthropic") {
    return providers.anthropic;
  }

  return providers.openai;
}

export function registerProvider(id: ProviderId, provider: LLMProvider): void {
  providers[id] = provider;
}

export function listProviders(): ProviderId[] {
  return Object.keys(providers) as ProviderId[];
}
