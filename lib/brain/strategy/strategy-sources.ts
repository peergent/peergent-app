import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import type { ResearchGraph } from "../layers/research/types";
import type { ReasoningGraph, ReasoningNode } from "../layers/reasoning/types";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence/types";

export type StrategySourceBundle = {
  marketingIntelligence: MarketingIntelligenceGraph | null;
  reasoning: ReasoningGraph | null;
  research: ResearchGraph | null;
  legacy: CapabilityExecutionContext["upstreamOutputs"];
};

export function resolveStrategySources(ctx: CapabilityExecutionContext): StrategySourceBundle {
  return {
    marketingIntelligence: ctx.marketingIntelligenceGraph ?? null,
    reasoning: ctx.reasoningGraph ?? null,
    research: ctx.researchGraph ?? null,
    legacy: ctx.upstreamOutputs,
  };
}

export function pickReasoningNode(
  graph: ReasoningGraph | null,
  matcher: (node: ReasoningNode) => boolean
): ReasoningNode | undefined {
  if (!graph) return undefined;
  const pools = [
    ...graph.businessModel,
    ...graph.marketPosition,
    ...graph.customerModel,
    ...graph.competitiveLandscape,
    ...graph.strengths,
    ...graph.weaknesses,
  ];
  return pools.find(matcher);
}

export function reasoningConfidenceToBrain(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.45) return "medium";
  return "low";
}

export function miConfidenceToBrain(confidence: number): "low" | "medium" | "high" {
  return reasoningConfidenceToBrain(confidence);
}
