import type {
  AudienceStrategy,
  CampaignObjective,
  ChannelStrategy,
  OpportunitySelection,
  StrategyConfidence,
} from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildCampaignObjectives(input: {
  opportunitySelections: readonly OpportunitySelection[];
  channelStrategy: readonly ChannelStrategy[];
  audienceStrategy: readonly AudienceStrategy[];
  timeHorizon?: string;
  upstreamConfidence: StrategyConfidence;
}): CampaignObjective[] {
  const selectedOpps = input.opportunitySelections.filter((o) => o.status === "selected");
  const selectedChannels = input.channelStrategy.filter((c) => c.selected);
  const primaryAudience =
    input.audienceStrategy.find((a) => a.priority === "primary")?.segment ?? "Primary audience";
  const horizon = input.timeHorizon ?? "90 days";

  const objectives: CampaignObjective[] = selectedOpps.slice(0, 3).map((opp, i) => ({
    id: `camp-obj-${opp.opportunityId}`,
    objective: opp.title,
    audience: [primaryAudience],
    channelRole: selectedChannels[i]?.role ?? selectedChannels[0]?.role ?? "acquisition",
    businessOutcome: opp.expectedImpact,
    successMetric: "Qualified leads and pipeline contribution",
    priority: i === 0 ? "high" : "medium",
    timeHorizon: horizon,
    dependencies: [...opp.dependency],
    confidence: enforceStrategyConfidenceCeiling(opp.confidence, [input.upstreamConfidence]),
  }));

  if (objectives.length === 0 && selectedChannels[0]) {
    objectives.push({
      id: "camp-obj-default",
      objective: `Capture demand via ${selectedChannels[0].channel}`,
      audience: [primaryAudience],
      channelRole: selectedChannels[0].role,
      businessOutcome: "Pipeline growth from high-intent channels",
      successMetric: "Qualified leads",
      priority: "high",
      timeHorizon: horizon,
      dependencies: [],
      confidence: enforceStrategyConfidenceCeiling(selectedChannels[0].confidence, [input.upstreamConfidence]),
    });
  }

  return objectives;
}
