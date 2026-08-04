import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { RunLiveStrategyActionResult } from "./live-strategy-run-action";
import type { LiveStrategyRunServerResult } from "./live-strategy-run-execution";

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Strip to plain JSON-compatible project data for server action transport. */
export function serializeMarketingProjectForAction(
  project: MarketingProject | null
): MarketingProject | null {
  if (!project) return null;
  return jsonClone(project);
}

export function serializeLiveStrategyServerResult(
  result: LiveStrategyRunServerResult
): LiveStrategyRunServerResult {
  return {
    ok: result.ok,
    status: result.status,
    project: serializeMarketingProjectForAction(result.project),
    failureCode: result.failureCode,
    failureMessageSafe: result.failureMessageSafe,
    provider: result.provider,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    fallbackUsed: result.fallbackUsed,
    runId: result.runId,
  };
}

export function serializeRunLiveStrategyActionResult(
  result: RunLiveStrategyActionResult
): RunLiveStrategyActionResult {
  return {
    ok: result.ok,
    status: result.status,
    project: serializeMarketingProjectForAction(result.project),
    failureCode: result.failureCode,
    failureMessageSafe: result.failureMessageSafe,
    provider: result.provider,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    fallbackUsed: result.fallbackUsed,
    runId: result.runId,
    error: result.error,
    traceLastStage: result.traceLastStage,
    traceStages: result.traceStages,
  };
}

export function assertJsonSerializable(value: unknown): void {
  jsonClone(value);
}
