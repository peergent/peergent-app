import type { CapabilityExecutionContext, CapabilityExecutionResult } from "./execution-context";
import { executeStrategyWithGraph } from "../strategy/execute-strategy-with-graph";

/** Deterministic campaign strategy — consumes ReasoningGraph when available. */
export function executeStrategy(ctx: CapabilityExecutionContext): CapabilityExecutionResult {
  return executeStrategyWithGraph(ctx);
}
