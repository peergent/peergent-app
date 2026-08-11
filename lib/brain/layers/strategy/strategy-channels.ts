import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { AudienceStrategy, ChannelStrategy, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

const ROLE_MAP: Record<string, string> = {
  search: "primary acquisition",
  google: "demand capture",
  linkedin: "authority",
  seo: "long-term compounding acquisition",
  email: "nurture",
  meta: "top-of-funnel reach",
  facebook: "top-of-funnel reach",
  instagram: "brand building",
};

function inferRole(channel: string, funnelRole: string): string {
  const key = channel.toLowerCase();
  for (const [k, role] of Object.entries(ROLE_MAP)) {
    if (key.includes(k)) return role;
  }
  return funnelRole || "support";
}

export function buildChannelStrategy(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  audienceStrategy: readonly AudienceStrategy[];
  upstreamConfidence: StrategyConfidence;
  maxSelected?: number;
}): ChannelStrategy[] {
  const max = input.maxSelected ?? 4;
  const sorted = [...input.miGraph.channelIntelligence].sort((a, b) => {
    const score = (c: typeof a) =>
      (c.intentFit === "high" ? 3 : c.intentFit === "medium" ? 2 : 1) +
      (c.measurementQuality === "high" ? 2 : 1);
    return score(b) - score(a);
  });

  const primaryAudience =
    input.audienceStrategy.find((a) => a.priority === "primary")?.segment ??
    input.audienceStrategy[0]?.segment ??
    "Primary audience";

  return sorted.map((ch, index) => {
    const selected = index < max && ch.intentFit !== "low";
    const deferred = !selected && /meta|facebook|instagram/i.test(ch.channel);
    return {
      channel: ch.channel,
      role: inferRole(ch.channel, ch.funnelRole),
      priority: selected ? (index === 0 ? "high" : "medium") : deferred ? "low" : "low",
      selected,
      objective: selected
        ? ch.intentFit === "high"
          ? "Capture high-intent demand"
          : "Build authority and support conversion"
        : deferred
          ? "Deferred — insufficient budget and measurement readiness"
          : "Not selected for current strategic focus",
      funnelStage: ch.funnelRole,
      audience: [primaryAudience],
      paidOrOrganic:
        ch.organicOrPaid === "paid"
          ? "paid"
          : ch.organicOrPaid === "organic"
            ? "organic"
            : ch.organicOrPaid === "both"
              ? "both"
              : "none",
      investmentLevel: selected ? (index === 0 ? "high" : "medium") : "low",
      measurementApproach:
        ch.measurementQuality === "high"
          ? "Direct conversion and pipeline attribution"
          : "Directional engagement and assisted conversion tracking",
      reason: selected
        ? `${ch.channel} fits ${ch.intentFit} intent with ${ch.measurementQuality} measurement quality.`
        : deferred
          ? "Broad reach channel deferred to preserve budget for intent capture."
          : "Lower strategic priority versus selected channel mix.",
      dependencies: [],
      risks: ch.risks.slice(0, 3),
      confidence: enforceStrategyConfidenceCeiling(ch.confidence, [input.upstreamConfidence]),
      evidenceIds: ch.evidenceIds,
    };
  });
}
