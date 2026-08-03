import type { BrainEnvironment } from "../domain/environment";
import type { BrainSnapshot } from "../context/snapshot";

/** Snapshot slice keys capabilities may require or optionally consume. */
export type BrainSnapshotSliceKey = keyof Omit<
  BrainSnapshot,
  "knownFacts" | "assumptions" | "unknowns" | "sources" | "assembledAt"
>;

/** Shared capability identifiers — no implementations in Sprint 1. */
export type BrainCapabilityId =
  | "company_understanding"
  | "website_understanding"
  | "brand_understanding"
  | "market_understanding"
  | "competitor_understanding"
  | "strategy"
  | "channel_planning"
  | "creative_generation"
  | "performance_interpretation"
  | "optimization"
  | "memory";

export type BrainCostClass = "free" | "low" | "medium" | "high";

export type BrainFreshnessPolicy = "always_fresh" | "ttl" | "stale_ok" | "immutable";

export type BrainApprovalRequirement = "none" | "before_action" | "before_publish";

export type BrainCapabilityDefinition = {
  id: BrainCapabilityId;
  version: string;
  requiredContext: readonly BrainSnapshotSliceKey[];
  optionalContext: readonly BrainSnapshotSliceKey[];
  outputSchema: string;
  allowedEnvironments: readonly BrainEnvironment[];
  approvalRequirement: BrainApprovalRequirement;
  costClass: BrainCostClass;
  freshnessPolicy: BrainFreshnessPolicy;
  cacheable: boolean;
};

export const BRAIN_CAPABILITY_DEFINITIONS: readonly BrainCapabilityDefinition[] = [
  {
    id: "company_understanding",
    version: "1.0.0",
    requiredContext: ["organization", "business"],
    optionalContext: ["campaign", "knowledge"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "none",
    costClass: "low",
    freshnessPolicy: "ttl",
    cacheable: true,
  },
  {
    id: "website_understanding",
    version: "1.0.0",
    requiredContext: ["website"],
    optionalContext: ["business", "brand"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "none",
    costClass: "medium",
    freshnessPolicy: "ttl",
    cacheable: true,
  },
  {
    id: "brand_understanding",
    version: "1.0.0",
    requiredContext: ["brand"],
    optionalContext: ["organization", "business"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "none",
    costClass: "low",
    freshnessPolicy: "ttl",
    cacheable: true,
  },
  {
    id: "market_understanding",
    version: "1.0.0",
    requiredContext: ["market"],
    optionalContext: ["business"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "none",
    costClass: "medium",
    freshnessPolicy: "ttl",
    cacheable: true,
  },
  {
    id: "competitor_understanding",
    version: "1.0.0",
    requiredContext: ["business"],
    optionalContext: ["market", "website"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "none",
    costClass: "medium",
    freshnessPolicy: "ttl",
    cacheable: true,
  },
  {
    id: "strategy",
    version: "1.0.0",
    requiredContext: ["campaign", "business"],
    optionalContext: ["brand", "market", "workingAgreement"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "before_action",
    costClass: "high",
    freshnessPolicy: "always_fresh",
    cacheable: false,
  },
  {
    id: "channel_planning",
    version: "1.0.0",
    requiredContext: ["campaign"],
    optionalContext: ["brand", "performance", "workingAgreement"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "before_action",
    costClass: "medium",
    freshnessPolicy: "ttl",
    cacheable: true,
  },
  {
    id: "creative_generation",
    version: "1.0.0",
    requiredContext: ["campaign", "brand"],
    optionalContext: ["workingAgreement"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "before_publish",
    costClass: "high",
    freshnessPolicy: "always_fresh",
    cacheable: false,
  },
  {
    id: "performance_interpretation",
    version: "1.0.0",
    requiredContext: ["performance", "campaign"],
    optionalContext: ["business", "memory"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "none",
    costClass: "low",
    freshnessPolicy: "ttl",
    cacheable: true,
  },
  {
    id: "optimization",
    version: "1.0.0",
    requiredContext: ["performance", "campaign"],
    optionalContext: ["workingAgreement"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "before_action",
    costClass: "medium",
    freshnessPolicy: "ttl",
    cacheable: true,
  },
  {
    id: "memory",
    version: "1.0.0",
    requiredContext: ["memory", "organization"],
    optionalContext: ["campaign"],
    outputSchema: "BrainStructuredOutput",
    allowedEnvironments: ["live", "demo", "test"],
    approvalRequirement: "none",
    costClass: "free",
    freshnessPolicy: "immutable",
    cacheable: true,
  },
];

const capabilityMap = new Map(
  BRAIN_CAPABILITY_DEFINITIONS.map((def) => [def.id, def] as const)
);

export function getBrainCapability(id: BrainCapabilityId): BrainCapabilityDefinition {
  const def = capabilityMap.get(id);
  if (!def) throw new Error(`Unknown Brain capability: ${id}`);
  return def;
}

export function listBrainCapabilities(): readonly BrainCapabilityDefinition[] {
  return BRAIN_CAPABILITY_DEFINITIONS;
}

export function isCapabilityAllowedInEnvironment(
  capabilityId: BrainCapabilityId,
  environment: BrainEnvironment
): boolean {
  return getBrainCapability(capabilityId).allowedEnvironments.includes(environment);
}
