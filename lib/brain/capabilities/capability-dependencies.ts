import type { BrainCapabilityId } from "./registry";

/** Canonical capability dependency graph — acyclic, for validation/readiness/orchestration. */
export const CAPABILITY_DEPENDENCIES: Readonly<
  Record<BrainCapabilityId, readonly BrainCapabilityId[]>
> = {
  company_understanding: [],
  website_understanding: [],
  brand_understanding: ["company_understanding"],
  market_understanding: ["company_understanding"],
  competitor_understanding: ["company_understanding"],
  strategy: [
    "company_understanding",
    "brand_understanding",
    "website_understanding",
  ],
  channel_planning: ["strategy"],
  campaign_planning: ["strategy"],
  creative_generation: ["strategy", "channel_planning", "brand_understanding"],
  performance_interpretation: [],
  optimization: [
    "strategy",
    "channel_planning",
    "creative_generation",
    "performance_interpretation",
  ],
  memory: ["company_understanding"],
};

/** Optional dependencies — capability may run without these when explicitly unavailable. */
export const CAPABILITY_OPTIONAL_DEPENDENCIES: Readonly<
  Partial<Record<BrainCapabilityId, readonly BrainCapabilityId[]>>
> = {
  strategy: ["competitor_understanding", "website_understanding"],
  optimization: ["performance_interpretation"],
};

export function getCapabilityDependencies(id: BrainCapabilityId): readonly BrainCapabilityId[] {
  return CAPABILITY_DEPENDENCIES[id] ?? [];
}

export function getOptionalCapabilityDependencies(
  id: BrainCapabilityId
): readonly BrainCapabilityId[] {
  return CAPABILITY_OPTIONAL_DEPENDENCIES[id] ?? [];
}

/** Topological order for running dependencies before a capability. */
export function resolveCapabilityExecutionOrder(
  target: BrainCapabilityId
): readonly BrainCapabilityId[] {
  const visited = new Set<BrainCapabilityId>();
  const order: BrainCapabilityId[] = [];

  function visit(id: BrainCapabilityId): void {
    if (visited.has(id)) return;
    for (const dep of CAPABILITY_DEPENDENCIES[id] ?? []) visit(dep);
    visited.add(id);
    if (id !== target) order.push(id);
  }

  visit(target);
  return order;
}

export function validateCapabilityDependencyGraphAcyclic(): boolean {
  const visiting = new Set<BrainCapabilityId>();
  const visited = new Set<BrainCapabilityId>();

  function dfs(id: BrainCapabilityId): boolean {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const dep of CAPABILITY_DEPENDENCIES[id] ?? []) {
      if (!dfs(dep)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  }

  return (Object.keys(CAPABILITY_DEPENDENCIES) as BrainCapabilityId[]).every(dfs);
}

export function dependentsOf(capabilityId: BrainCapabilityId): BrainCapabilityId[] {
  return (Object.entries(CAPABILITY_DEPENDENCIES) as [BrainCapabilityId, readonly BrainCapabilityId[]][])
    .filter(([, deps]) => deps.includes(capabilityId))
    .map(([id]) => id);
}
