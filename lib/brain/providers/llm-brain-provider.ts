import "server-only";

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
import { executeChannelPlanningWithLlmFallback } from "../llm/execute-channel-planning-llm";
import { executeCreativeGenerationWithLlmFallback } from "../llm/execute-creative-generation-llm";
import type { BrainLlmProvider } from "../llm/provider";
import {
  classifyPreLlmSkip,
} from "../llm/failure-categories";
import { markOfficeLlmTrace } from "../integration/office-llm-trace";
import { getOpenAIModel } from "@/lib/ai-runtime/env";

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

    const skipCategory = classifyPreLlmSkip({
      useOpenAI,
      hasProjection: Boolean(input.projection),
      hasExecutionContext: Boolean(input.executionContext && input.companySnapshot),
      llmRegistered: true,
      providerInitiallySelected: "llm",
      hasCustomLlmProvider: Boolean(this.options.llmProvider),
    });

    if (skipCategory) {
      markOfficeLlmTrace("FALLBACK_STARTED", { category: skipCategory, stage: "llm_provider_precheck" });
      this.lastUsage = {
        providerId: "deterministic",
        initialProviderId: "llm",
        finalProviderId: "deterministic",
        fallbackReason: skipCategory,
        modelId: getOpenAIModel(),
        inputTokens: 0,
        outputTokens: 0,
      };
      markOfficeLlmTrace("FALLBACK_COMPLETED", { category: skipCategory, stage: "llm_provider_precheck" });
      return executeDeterministicCapability(input);
    }

    if (useOpenAI && input.capabilityId === "strategy" && input.projection) {
      const result = await executeStrategyWithLlmFallback({
        ...input,
        projection: input.projection,
        llmProvider: this.options.llmProvider,
      });
      if (result.usage) {
        const diag = result.diagnostics;
        this.lastUsage = {
          ...result.usage,
          requestStarted: diag?.requestStarted ?? result.usage.requestStarted,
          validationAttempts: diag?.validationAttempts ?? result.usage.validationAttempts,
          validationRepairCount: diag?.validationRepairCount ?? result.usage.validationRepairCount,
          initialRequestDurationMs:
            diag?.initialRequestDurationMs ?? result.usage.initialRequestDurationMs,
          fallbackDurationMs: diag?.fallbackDurationMs ?? result.usage.fallbackDurationMs,
          businessValidationCategory:
            diag?.businessValidationCategory ?? result.usage.businessValidationCategory,
          businessValidationSubreason:
            diag?.businessValidationSubreason ?? result.usage.businessValidationSubreason,
        };
      } else if (!result.usedLlm) {
        this.lastUsage = {
          providerId: "deterministic",
          initialProviderId: "llm",
          finalProviderId: "deterministic",
          fallbackReason: result.fallbackReason,
          inputTokens: 0,
          outputTokens: 0,
        };
      }
      return result.output;
    }

    if (useOpenAI && input.capabilityId === "channel_planning" && input.projection) {
      const result = await executeChannelPlanningWithLlmFallback({
        ...input,
        projection: input.projection,
        llmProvider: this.options.llmProvider,
      });
      if (result.usage) {
        this.lastUsage = result.usage;
      } else if (!result.usedLlm) {
        this.lastUsage = {
          providerId: "deterministic",
          initialProviderId: "llm",
          finalProviderId: "deterministic",
          fallbackReason: result.fallbackReason,
          inputTokens: 0,
          outputTokens: 0,
        };
      }
      return result.output;
    }

    if (useOpenAI && input.capabilityId === "creative_generation" && input.projection) {
      const result = await executeCreativeGenerationWithLlmFallback({
        ...input,
        projection: input.projection,
        llmProvider: this.options.llmProvider,
      });
      if (result.usage) {
        const diag = result.diagnostics;
        this.lastUsage = {
          ...result.usage,
          upstreamStrategyFound: diag?.upstreamStrategyFound ?? result.usage.upstreamStrategyFound,
          upstreamChannelsFound: diag?.upstreamChannelsFound ?? result.usage.upstreamChannelsFound,
          strategyVersionCompatible:
            diag?.strategyVersionCompatible ?? result.usage.strategyVersionCompatible,
          channelVersionCompatible: diag?.channelVersionCompatible ?? result.usage.channelVersionCompatible,
          selectedChannelCount: diag?.selectedChannelCount ?? result.usage.selectedChannelCount,
          businessValidationCategory:
            diag?.businessValidationCategory ?? result.usage.businessValidationCategory,
          businessValidationSubreason:
            diag?.businessValidationSubreason ?? result.usage.businessValidationSubreason,
          approvedCanonicalChannels:
            diag?.approvedCanonicalChannels ?? result.usage.approvedCanonicalChannels,
          generatedCanonicalChannels:
            diag?.generatedCanonicalChannels ?? result.usage.generatedCanonicalChannels,
          unmatchedChannels: diag?.unmatchedChannels ?? result.usage.unmatchedChannels,
          requestStarted: diag?.requestStarted ?? result.usage.requestStarted,
          validationAttempts: diag?.validationAttempts ?? result.usage.validationAttempts,
          validationRepairCount: diag?.validationRepairCount ?? result.usage.validationRepairCount,
          initialRequestDurationMs:
            diag?.initialRequestDurationMs ?? result.usage.initialRequestDurationMs,
          repairRequestDurationMs:
            diag?.repairRequestDurationMs ?? result.usage.repairRequestDurationMs,
          fallbackDurationMs: diag?.fallbackDurationMs ?? result.usage.fallbackDurationMs,
          timeoutOwner: diag?.timeoutOwner ?? result.usage.timeoutOwner,
          configuredTimeoutMs: diag?.configuredTimeoutMs ?? result.usage.configuredTimeoutMs,
          timeoutAttemptNumber: diag?.timeoutAttemptNumber ?? result.usage.timeoutAttemptNumber,
          responseHeadersReceived:
            diag?.responseHeadersReceived ?? result.usage.responseHeadersReceived,
          responseBodyStarted: diag?.responseBodyStarted ?? result.usage.responseBodyStarted,
        };
      } else if (!result.usedLlm) {
        this.lastUsage = {
          providerId: "deterministic",
          initialProviderId: "llm",
          finalProviderId: "deterministic",
          fallbackReason: result.fallbackReason,
          inputTokens: 0,
          outputTokens: 0,
        };
      }
      return result.output;
    }

    this.lastUsage = {
      providerId: "deterministic",
      initialProviderId: "llm",
      finalProviderId: "deterministic",
      fallbackReason: "llm_not_selected",
      inputTokens: 0,
      outputTokens: 0,
    };
    return executeDeterministicCapability(input);
  }
}

export function createLlmBrainProvider(options?: {
  useOpenAI?: boolean;
  llmProvider?: BrainLlmProvider;
}): LlmBrainCapabilityProvider {
  return new LlmBrainCapabilityProvider(options);
}
