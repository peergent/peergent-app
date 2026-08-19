import type { BrainEnvironment } from "../domain/environment";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { getOpenAIApiKey } from "@/lib/ai-runtime/env";
import type { BrainLlmProvider } from "./provider";
import type { IntelligenceProviderMode } from "./intelligence-provider-metadata";

export type IntelligenceLlmPolicy = {
  readonly mode: IntelligenceProviderMode;
  readonly allowLlm: boolean;
  readonly allowDeterministicFallback: boolean;
  readonly providerId?: string;
  readonly reason?: string;
};

export function resolveBrainEnvironment(input: {
  peerId?: string;
  environment?: BrainEnvironment;
}): BrainEnvironment {
  if (input.environment) return input.environment;
  if (input.peerId && isDemoPeer(input.peerId)) return "demo";
  if (process.env.NODE_ENV === "test") return "test";
  return "live";
}

/**
 * PX-63B production policy:
 * - live + API key → live_llm (canonical; BRAIN_USE_OPENAI=false blocks explicitly)
 * - live + no key → unavailable (no fake success)
 * - test → deterministic_fallback
 * - demo → deterministic unless BRAIN_USE_OPENAI=true + API key
 */
export function resolveIntelligenceLlmPolicy(input: {
  peerId?: string;
  environment?: BrainEnvironment;
  llmProvider?: BrainLlmProvider;
}): IntelligenceLlmPolicy {
  if (input.llmProvider) {
    return {
      mode: "live_llm",
      allowLlm: true,
      allowDeterministicFallback: false,
      providerId: input.llmProvider.id,
    };
  }

  const environment = resolveBrainEnvironment(input);
  const apiKeyPresent = Boolean(getOpenAIApiKey());
  const explicitlyDisabled = process.env.BRAIN_USE_OPENAI === "false";
  const explicitlyEnabled = process.env.BRAIN_USE_OPENAI === "true";

  if (environment === "test") {
    return {
      mode: "deterministic_fallback",
      allowLlm: false,
      allowDeterministicFallback: true,
      providerId: "deterministic",
      reason: "test_environment",
    };
  }

  if (environment === "demo") {
    if (explicitlyEnabled && apiKeyPresent) {
      return {
        mode: "live_llm",
        allowLlm: true,
        allowDeterministicFallback: false,
        providerId: "openai",
      };
    }
    return {
      mode: "deterministic_fallback",
      allowLlm: false,
      allowDeterministicFallback: true,
      providerId: "deterministic",
      reason: "demo_environment",
    };
  }

  if (explicitlyDisabled) {
    return {
      mode: "unavailable",
      allowLlm: false,
      allowDeterministicFallback: false,
      reason: "llm_explicitly_disabled",
    };
  }

  if (!apiKeyPresent) {
    return {
      mode: "unavailable",
      allowLlm: false,
      allowDeterministicFallback: false,
      reason: "missing_api_key",
    };
  }

  return {
    mode: "live_llm",
    allowLlm: true,
    allowDeterministicFallback: process.env.BRAIN_INTELLIGENCE_ALLOW_DETERMINISTIC_FALLBACK === "true",
    providerId: "openai",
  };
}

/** Strategy/capability LLM gate — live production uses configured OpenAI unless explicitly disabled. */
export function isProductionIntelligenceLlmEnabled(input: {
  environment?: BrainEnvironment;
  peerId?: string;
  override?: boolean;
}): boolean {
  if (input.override !== undefined) return input.override;
  const policy = resolveIntelligenceLlmPolicy(input);
  return policy.allowLlm;
}
