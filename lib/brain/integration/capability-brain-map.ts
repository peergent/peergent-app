/**
 * PX-53 — bidirectional capability ↔ ProjectBrainId mapping for dependency reuse.
 */

import type { BrainCapabilityId } from "../capabilities/registry";
import type { ProjectBrainId } from "../project-engine/types";
import { PRIMARY_CAPABILITY_FOR_BRAIN } from "./brain-capability-map";

/** Primary brain that owns a capability's durable episode output. */
export const CAPABILITY_PRIMARY_BRAIN: Readonly<
  Partial<Record<BrainCapabilityId, ProjectBrainId>>
> = {
  company_understanding: "company",
  brand_understanding: "company",
  website_understanding: "research",
  market_understanding: "marketing_intelligence",
  competitor_understanding: "research",
  strategy: "strategy",
  channel_planning: "planning",
  campaign_planning: "planning",
  creative_generation: "creative",
  validation: "validation",
  memory: "memory",
  execution: "execution",
  performance_interpretation: "learning",
  optimization: "learning",
};

export function primaryBrainForCapability(
  capabilityId: BrainCapabilityId
): ProjectBrainId | null {
  return CAPABILITY_PRIMARY_BRAIN[capabilityId] ?? null;
}

/** Capabilities whose durable output may seed downstream dependency resolution. */
export function capabilitiesOwnedByBrain(
  brainId: ProjectBrainId
): readonly BrainCapabilityId[] {
  const primary = PRIMARY_CAPABILITY_FOR_BRAIN[brainId];
  const owned = (Object.entries(CAPABILITY_PRIMARY_BRAIN) as [BrainCapabilityId, ProjectBrainId][])
    .filter(([, owner]) => owner === brainId)
    .map(([capabilityId]) => capabilityId);
  if (primary && !owned.includes(primary)) {
    return [primary, ...owned];
  }
  return owned;
}
