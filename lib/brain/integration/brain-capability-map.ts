/**
 * PX-50 — maps ProjectBrainId → primary BrainRuntime capability for production adapter.
 */

import type { BrainCapabilityId } from "../capabilities/registry";
import type { ProjectBrainId } from "../project-engine/types";

export const PRIMARY_CAPABILITY_FOR_BRAIN: Readonly<
  Partial<Record<ProjectBrainId, BrainCapabilityId>>
> = {
  company: "company_understanding",
  research: "competitor_understanding",
  reasoning: "market_understanding",
  marketing_intelligence: "market_understanding",
  strategy: "strategy",
  planning: "channel_planning",
  creative: "creative_generation",
  validation: "validation",
  execution: "execution",
  learning: "optimization",
};

export function primaryCapabilityForBrain(
  brainId: ProjectBrainId
): BrainCapabilityId | null {
  return PRIMARY_CAPABILITY_FOR_BRAIN[brainId] ?? null;
}
