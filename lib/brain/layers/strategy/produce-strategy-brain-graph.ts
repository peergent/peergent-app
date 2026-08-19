import type { StrategyBrainGraph, StrategyBrainInput } from "./brain-types";
import { resolveIntelligenceLlmPolicy } from "../../llm/intelligence-provider-policy";
import {
  buildDeterministicStrategyGraph,
  executeStrategyBrainViaLlm,
} from "../../llm/execute-strategy-brain-llm";
import { IntelligenceLlmUnavailableError } from "../../llm/intelligence-llm-errors";

export async function produceStrategyBrainGraph(input: StrategyBrainInput): Promise<StrategyBrainGraph> {
  const policy = resolveIntelligenceLlmPolicy({
    peerId: input.peerId,
    llmProvider: input.llmProvider,
  });

  if (policy.mode === "unavailable") {
    throw new IntelligenceLlmUnavailableError(policy.reason ?? "unavailable");
  }

  if (policy.mode === "live_llm") {
    const result = await executeStrategyBrainViaLlm({
      strategyInput: input,
      llmProvider: input.llmProvider,
      episodeId: input.episodeId,
    });
    return result.graph;
  }

  return buildDeterministicStrategyGraph(input, policy.reason ?? "deterministic_fallback");
}
