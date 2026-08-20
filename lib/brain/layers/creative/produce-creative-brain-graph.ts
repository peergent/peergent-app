/**
 * PX-64 — Creative Brain production entry: live LLM in production, deterministic in test.
 */

import type { CreativeBrainInput } from "./build-creative-graph";
import type { CreativeGraph } from "./types";
import { resolveIntelligenceLlmPolicy } from "../../llm/intelligence-provider-policy";
import {
  buildDeterministicCreativeGraph,
  executeCreativeBrainViaLlm,
} from "../../llm/execute-creative-brain-llm";
import { IntelligenceLlmUnavailableError } from "../../llm/intelligence-llm-errors";

export async function produceCreativeBrainGraph(input: CreativeBrainInput): Promise<CreativeGraph> {
  const policy = resolveIntelligenceLlmPolicy({
    peerId: input.peerId,
    llmProvider: input.llmProvider,
  });

  if (policy.mode === "unavailable") {
    throw new IntelligenceLlmUnavailableError(policy.reason ?? "unavailable");
  }

  if (policy.mode === "live_llm") {
    const result = await executeCreativeBrainViaLlm({
      creativeInput: input,
      llmProvider: input.llmProvider,
      episodeId: input.episodeId,
    });
    return result.graph;
  }

  return buildDeterministicCreativeGraph(input, policy.reason ?? "deterministic_fallback");
}
