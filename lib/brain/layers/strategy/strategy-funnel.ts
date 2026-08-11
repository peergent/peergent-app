import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { ChannelStrategy, FunnelStrategy, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

const STAGES = ["awareness", "consideration", "intent", "conversion", "retention", "advocacy"] as const;

export function buildFunnelStrategy(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  channelStrategy: readonly ChannelStrategy[];
  upstreamConfidence: StrategyConfidence;
}): FunnelStrategy {
  const funnelIntel = input.miGraph.funnelIntelligence;
  const gaps = funnelIntel.flatMap((f) => f.gaps);
  const selectedChannels = input.channelStrategy.filter((c) => c.selected);

  const stageObjectives = STAGES.map((stage) => {
    const intel = funnelIntel.find((f) => f.stage.toLowerCase().includes(stage));
    const objective =
      intel?.status === "gap"
        ? `Close gap: ${intel.gaps[0] ?? "Improve stage performance"}`
        : intel?.status === "strong"
          ? `Maintain strength at ${stage}`
          : `Establish measurable progress at ${stage}`;
    return { stage, objective };
  });

  return {
    primaryFunnelModel: "Intent-led B2B acquisition with nurture support",
    stageObjectives,
    channelRoles: selectedChannels.map((c) => ({ channel: c.channel, role: c.role })),
    contentRequirements: [
      "Proof assets for consideration stage",
      "High-intent landing experiences for conversion",
      "Educational content for authority channels",
    ],
    conversionPoints: ["Demo request", "Consultation booking", "Lead form submission"],
    handoffRequirements: ["Sales handoff within 24h for qualified leads", "CRM tagging by funnel stage"],
    measurementPoints: STAGES.map((s) => `${s} stage conversion rate`),
    gapsToSolve: gaps.slice(0, 5),
    confidence: enforceStrategyConfidenceCeiling(input.miGraph.confidence, [input.upstreamConfidence]),
  };
}
