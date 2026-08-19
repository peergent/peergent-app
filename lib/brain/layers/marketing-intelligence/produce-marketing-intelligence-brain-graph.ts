import type {
  MarketingIntelligenceBrainGraph,
  MarketingIntelligenceBrainInput,
} from "./brain-types";
import { resolveIntelligenceLlmPolicy } from "../../llm/intelligence-provider-policy";
import {
  buildDeterministicMarketingIntelligenceGraph,
  executeMarketingIntelligenceViaLlm,
} from "../../llm/execute-marketing-intelligence-llm";
import { IntelligenceLlmUnavailableError } from "../../llm/intelligence-llm-errors";

export async function produceMarketingIntelligenceBrainGraph(
  input: MarketingIntelligenceBrainInput
): Promise<MarketingIntelligenceBrainGraph> {
  const policy = resolveIntelligenceLlmPolicy({
    peerId: input.peerId,
    llmProvider: input.llmProvider,
  });

  if (policy.mode === "unavailable") {
    throw new IntelligenceLlmUnavailableError(policy.reason ?? "unavailable");
  }

  if (policy.mode === "live_llm") {
    const result = await executeMarketingIntelligenceViaLlm({
      miInput: input,
      llmProvider: input.llmProvider,
      episodeId: input.episodeId,
    });
    return result.graph;
  }

  return buildDeterministicMarketingIntelligenceGraph(input, policy.reason ?? "deterministic_fallback");
}
