import type { ReasoningBrainGraph, ReasoningBrainInput } from "./brain-types";
import { resolveIntelligenceLlmPolicy } from "../../llm/intelligence-provider-policy";
import {
  buildDeterministicReasoningGraph,
  executeReasoningViaLlm,
} from "../../llm/execute-reasoning-llm";
import { IntelligenceLlmUnavailableError } from "../../llm/intelligence-llm-errors";

export async function produceReasoningBrainGraph(input: ReasoningBrainInput): Promise<ReasoningBrainGraph> {
  const policy = resolveIntelligenceLlmPolicy({
    peerId: input.peerId,
    llmProvider: input.llmProvider,
  });

  if (policy.mode === "unavailable") {
    throw new IntelligenceLlmUnavailableError(policy.reason ?? "unavailable");
  }

  if (policy.mode === "live_llm") {
    const result = await executeReasoningViaLlm({
      reasoningInput: input,
      llmProvider: input.llmProvider,
      episodeId: input.episodeId,
    });
    return result.graph;
  }

  return buildDeterministicReasoningGraph(input, policy.reason ?? "deterministic_fallback");
}
