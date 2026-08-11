import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { StrategicProblem, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildStrategicProblems(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  projectObjective?: string;
  upstreamConfidence: StrategyConfidence;
}): StrategicProblem[] {
  const problems: StrategicProblem[] = [];
  const funnelGaps = input.miGraph.funnelIntelligence.flatMap((f) => f.gaps ?? []);
  const topGap = funnelGaps[0];
  if (topGap) {
    problems.push({
      id: "strat-problem-funnel",
      title: "Funnel gap limits conversion efficiency",
      description: topGap,
      businessImpact: "high",
      marketingImpact: "Marketing spend may not convert without addressing this stage gap.",
      evidenceIds: ["mi-funnel"],
      confidence: enforceStrategyConfidenceCeiling("medium", [input.upstreamConfidence]),
      urgency: "high",
      dependencies: [],
    });
  }

  const channelIntel = [...input.miGraph.channelIntelligence].sort(
    (a, b) => (a.intentFit === "high" ? -1 : 0) - (b.intentFit === "high" ? -1 : 0)
  );
  const lowIntentHeavy =
    channelIntel.filter((c) => c.intentFit === "low").length >
    channelIntel.filter((c) => c.intentFit === "high").length;
  if (lowIntentHeavy && channelIntel.some((c) => c.intentFit === "high")) {
    problems.push({
      id: "strat-problem-channel-intent",
      title: "Lead generation skews toward low-intent channels",
      description:
        "Current channel mix may over-index on awareness traffic while high-intent demand capture remains underused.",
      businessImpact: "high",
      marketingImpact: "CAC may rise and lead quality may suffer without rebalancing toward intent channels.",
      evidenceIds: ["mi-channels"],
      confidence: enforceStrategyConfidenceCeiling("medium", [input.upstreamConfidence]),
      urgency: "high",
      dependencies: ["strat-problem-funnel"],
    });
  }

  const reasoningRisk = input.reasoningGraph.risks[0];
  if (reasoningRisk) {
    problems.push({
      id: "strat-problem-reasoning-risk",
      title: "Upstream reasoning risk",
      description: reasoningRisk.description,
      businessImpact: reasoningRisk.severity === "critical" ? "critical" : "medium",
      marketingImpact: "Strategic choices must account for this risk when allocating channels and messaging.",
      evidenceIds: [reasoningRisk.id],
      confidence: enforceStrategyConfidenceCeiling(reasoningRisk.confidence, [input.upstreamConfidence]),
      urgency: reasoningRisk.likelihood === "high" ? "high" : "medium",
      dependencies: [],
    });
  }

  if (problems.length === 0) {
    const objective =
      input.projectObjective ?? input.miGraph.businessContext.projectObjective ?? "Achieve marketing goals";
    problems.push({
      id: "strat-problem-objective",
      title: "Achieve project objective with available intelligence",
      description: objective,
      businessImpact: "medium",
      marketingImpact: "Marketing must align channel and audience choices to the stated objective.",
      evidenceIds: input.miGraph.evidence.slice(0, 2).map((e) => e.id),
      confidence: enforceStrategyConfidenceCeiling("low", [input.upstreamConfidence]),
      urgency: "medium",
      dependencies: [],
    });
  }

  return problems;
}
