import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { AudienceStrategy, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildAudienceStrategy(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  upstreamConfidence: StrategyConfidence;
}): AudienceStrategy[] {
  const segments = [...input.miGraph.audienceIntelligence].sort(
    (a, b) => (b.intentLevel === "high" ? 1 : 0) - (a.intentLevel === "high" ? 1 : 0)
  ); // intentLevel is MarketingPriority on audience segments
  if (segments.length === 0) return [];

  return segments.slice(0, 4).map((seg, index) => {
    const priority =
      index === 0 ? "primary" : index === 1 ? "secondary" : index === 2 ? "deprioritized" : "future";
    return {
      segment: seg.segment,
      priority,
      whySelected:
        priority === "primary"
          ? "Highest intent and marketing fit from upstream audience intelligence."
          : priority === "secondary"
            ? "Supports primary audience with adjacent demand."
            : priority === "deprioritized"
              ? "Lower immediate ROI — preserve focus on higher-intent segments."
              : "Future expansion audience once core segments convert reliably.",
      businessValue: seg.importance === "critical" || seg.importance === "high" ? "High revenue potential" : "Supporting pipeline",
      marketingFit: seg.messageSensitivity || "Aligns with available channels and messaging themes.",
      intentLevel: seg.intentLevel,
      messageImplication: seg.primaryMotivation || "Emphasize outcomes relevant to this segment.",
      channelImplication: seg.preferredChannels?.[0] ?? "Prioritize channels where this segment is reachable.",
      evidenceIds: seg.evidenceIds ?? [],
      confidence: enforceStrategyConfidenceCeiling(seg.confidence ?? "medium", [input.upstreamConfidence]),
    };
  });
}
