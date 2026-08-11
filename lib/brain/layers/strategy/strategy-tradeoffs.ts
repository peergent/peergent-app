import type { ChannelStrategy, StrategicTradeoff } from "./brain-types";

export function buildStrategicTradeoffs(input: {
  channelStrategy: readonly ChannelStrategy[];
}): StrategicTradeoff[] {
  const selected = input.channelStrategy.filter((c) => c.selected);
  const deferred = input.channelStrategy.filter(
    (c) => !c.selected && /meta|facebook|instagram/i.test(c.channel)
  );
  const primary = selected[0];
  const deferredChannel = deferred[0];

  const tradeoffs: StrategicTradeoff[] = [];

  if (primary && deferredChannel) {
    tradeoffs.push({
      id: "tradeoff-channel-priority",
      decision: `Prioritize ${primary.channel} over ${deferredChannel.channel}`,
      benefit: "Higher intent and better measurement readiness",
      cost: "Less top-of-funnel reach",
      risk: "May limit awareness among cold audiences",
      reason: "Strategy favors measurable intent capture over broad awareness.",
      alternative: `Broad ${deferredChannel.channel} awareness campaign`,
    });
  }

  if (selected.length > 2) {
    tradeoffs.push({
      id: "tradeoff-focus",
      decision: "Limit active channel count to preserve execution quality",
      benefit: "Clearer measurement and faster learning cycles",
      cost: "Some valid channels remain inactive",
      risk: "Missed opportunities on deferred channels",
      reason: "Resource concentration improves strategic clarity.",
      alternative: "Pursue all available channels simultaneously",
    });
  }

  if (tradeoffs.length === 0 && selected.length > 0) {
    tradeoffs.push({
      id: "tradeoff-channel-focus",
      decision: `Focus on ${selected.map((c) => c.channel).join(", ")}`,
      benefit: "Concentrated investment on highest-fit channels",
      cost: "Reduced diversification across channels",
      risk: "Over-reliance on a single acquisition path",
      reason: "Upstream channel intelligence supports focused execution.",
      alternative: "Equal investment across all available channels",
    });
  }

  return tradeoffs;
}
