import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import type { BrainSource } from "./types";

/** Maps persisted capability IDs to presentation layer sources. */
export function capabilityToBrainSource(capabilityId: string): BrainSource {
  const map: Record<string, BrainSource> = {
    strategy: "strategy",
    channel_planning: "planning",
    campaign_planning: "planning",
    creative_generation: "creative",
    optimization: "optimization",
    research: "research",
    marketing_intelligence: "marketing_intelligence",
    validation: "validation",
  };
  return map[capabilityId] ?? "reasoning";
}

export function isPersistedCampaignCapability(
  id: string
): id is Extract<
  BrainCapabilityId,
  "strategy" | "channel_planning" | "campaign_planning" | "creative_generation"
> {
  return (
    id === "strategy" ||
    id === "channel_planning" ||
    id === "campaign_planning" ||
    id === "creative_generation"
  );
}
