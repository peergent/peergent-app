import type { BrainCapabilityProvider } from "./provider-interface";
import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CompanySnapshot } from "../company/snapshot";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import type { BrainUsageMetadata } from "../runtime/run-lifecycle";
import type { BrainContextProjection } from "../providers/token-strategy";
import { isBrainUseOpenAIEnabled } from "../config/brain-feature-flags";
import { executeDeterministicCapability } from "./deterministic-provider";
import { executeStrategyWithLlmFallback } from "../llm/execute-strategy-llm";
import type { BrainLlmProvider } from "../llm/provider";

type ProviderInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  capabilityId: BrainCapabilityId;
  companySnapshot?: CompanySnapshot;
  executionContext?: CapabilityExecutionContext;
  projection?: BrainContextProjection;
};

/** Brain capability provider — routes strategy through LLM when enabled, else deterministic. */
export class LlmBrainCapabilityProvider implements BrainCapabilityProvider {
  readonly id = "llm";
  private lastUsage: BrainUsageMetadata | undefined;

  constructor(
    private readonly options: {
      useOpenAI?: boolean;
      llmProvider?: BrainLlmProvider;
    } = {}
  ) {}

  consumeLastUsage(): BrainUsageMetadata | undefined {
    const usage = this.lastUsage;
    this.lastUsage = undefined;
    return usage;
  }

  executeSync(input: ProviderInput): BrainStructuredOutput {
    return executeDeterministicCapability(input);
  }

  async execute(input: ProviderInput): Promise<BrainStructuredOutput> {
    this.lastUsage = undefined;
    const useOpenAI = this.options.useOpenAI ?? isBrainUseOpenAIEnabled();

    if (useOpenAI && input.capabilityId === "strategy" && input.projection) {
      const result = await executeStrategyWithLlmFallback({
        ...input,
        projection: input.projection,
        llmProvider: this.options.llmProvider,
      });
      if (result.usage) this.lastUsage = result.usage;
      return result.output;
    }

    return executeDeterministicCapability(input);
  }
}

export function createLlmBrainProvider(options?: {
  useOpenAI?: boolean;
  llmProvider?: BrainLlmProvider;
}): LlmBrainCapabilityProvider {
  return new LlmBrainCapabilityProvider(options);
}

export function isBrainProviderWithUsage(
  provider: BrainCapabilityProvider
): provider is BrainCapabilityProvider & { consumeLastUsage(): BrainUsageMetadata | undefined } {
  return typeof (provider as LlmBrainCapabilityProvider).consumeLastUsage === "function";
}
