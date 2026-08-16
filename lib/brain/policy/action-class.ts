import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainActionProposal } from "../evidence/structured-output";

/** Internal cognition vs consequential external side effects. */
export type BrainActionClass = "cognitive" | "external";

const COGNITIVE_CAPABILITIES = new Set<BrainCapabilityId>([
  "company_understanding",
  "website_understanding",
  "brand_understanding",
  "market_understanding",
  "competitor_understanding",
  "strategy",
  "channel_planning",
  "campaign_planning",
  "creative_generation",
  "validation",
  "performance_interpretation",
  "memory",
]);

const EXTERNAL_CAPABILITIES = new Set<BrainCapabilityId>(["execution"]);

/** Recommendation-only optimization output — applying changes is external. */
const EXTERNAL_ACTION_TYPES = new Set([
  "publish",
  "send",
  "launch",
  "spend",
  "apply_optimization",
  "apply_budget_change",
  "modify_live_campaign",
  "dispatch",
  "execute",
]);

export function resolveCapabilityActionClass(capabilityId: BrainCapabilityId): BrainActionClass {
  if (EXTERNAL_CAPABILITIES.has(capabilityId)) return "external";
  if (COGNITIVE_CAPABILITIES.has(capabilityId)) return "cognitive";
  if (capabilityId === "optimization") return "cognitive";
  return "cognitive";
}

export function classifyActionProposal(proposal: BrainActionProposal): BrainActionClass {
  const type = proposal.actionType.toLowerCase();
  if (EXTERNAL_ACTION_TYPES.has(type)) return "external";
  if (/apply|publish|send|launch|spend|dispatch|execute|live/i.test(type)) return "external";
  return "cognitive";
}

export function hasExternalActionProposals(
  proposals: readonly BrainActionProposal[]
): boolean {
  return proposals.some((p) => classifyActionProposal(p) === "external");
}
