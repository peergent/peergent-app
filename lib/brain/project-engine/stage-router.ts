/**
 * Stage router — maps project lifecycle states to brains and capability ids.
 */

import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import type { CampaignExecutionStage } from "@/lib/peer-experience/marketing/campaign-execution/campaign-run-types";
import type { ProjectBrainId, ProjectLifecycleState } from "./types";

export const STATE_TO_BRAIN: Readonly<Partial<Record<ProjectLifecycleState, ProjectBrainId>>> = {
  researching: "research",
  strategizing: "strategy",
  planning: "planning",
  generating: "creative",
  validating: "validation",
  publishing: "execution",
  learning: "learning",
};

export const BRAIN_TO_CAPABILITIES: Readonly<Record<ProjectBrainId, readonly BrainCapabilityId[]>> = {
  research: ["company_understanding", "website_understanding", "competitor_understanding"],
  reasoning: ["market_understanding"],
  marketing_intelligence: ["market_understanding", "competitor_understanding"],
  strategy: ["strategy"],
  planning: ["channel_planning", "campaign_planning"],
  creative: ["creative_generation"],
  validation: ["strategy"],
  memory: ["memory"],
  execution: ["creative_generation"],
  learning: ["performance_interpretation", "optimization"],
};

export const PROJECT_STATE_TO_RUN_STAGE: Readonly<
  Partial<Record<ProjectLifecycleState, CampaignExecutionStage>>
> = {
  created: "pending",
  collecting_context: "pending",
  researching: "research",
  strategizing: "strategy",
  planning: "planning",
  generating: "creative",
  validating: "validation",
  waiting_for_approval: "campaign_approval",
  ready_to_publish: "executive_briefing",
  publishing: "publication",
  monitoring: "publication",
  learning: "memory_update",
  complete: "completed",
  failed: "pending",
};

export const RUN_STAGE_TO_PROJECT_STATE: Readonly<
  Partial<Record<CampaignExecutionStage, ProjectLifecycleState>>
> = {
  pending: "collecting_context",
  research: "researching",
  reasoning: "researching",
  marketing_intelligence: "researching",
  strategy: "strategizing",
  planning: "planning",
  creative: "generating",
  validation: "validating",
  scheduling: "ready_to_publish",
  executive_briefing: "waiting_for_approval",
  campaign_approval: "waiting_for_approval",
  publication: "publishing",
  memory_update: "learning",
  completed: "complete",
};

export function brainForState(state: ProjectLifecycleState): ProjectBrainId | null {
  return STATE_TO_BRAIN[state] ?? null;
}

export function capabilitiesForBrain(brainId: ProjectBrainId): readonly BrainCapabilityId[] {
  return BRAIN_TO_CAPABILITIES[brainId] ?? [];
}

export function projectStateFromRunStage(stage: CampaignExecutionStage): ProjectLifecycleState {
  return RUN_STAGE_TO_PROJECT_STATE[stage] ?? "collecting_context";
}

export function runStageFromProjectState(state: ProjectLifecycleState): CampaignExecutionStage {
  return PROJECT_STATE_TO_RUN_STAGE[state] ?? "pending";
}
