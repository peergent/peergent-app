import type { BrainCapabilityId } from "../capabilities/registry";

export type InvalidationNode =
  | "website_snapshot"
  | "company_profile"
  | "company_snapshot"
  | "brain_snapshot"
  | BrainCapabilityId
  | "campaign_suggestions";

export type InvalidationEvent = {
  id: string;
  organizationId: string;
  trigger: InvalidationNode;
  affected: readonly InvalidationNode[];
  reason: string;
  occurredAt: string;
};

/** Dependency graph — tracking only, no execution. */
export const INVALIDATION_DEPENDENCIES: Readonly<
  Record<InvalidationNode, readonly InvalidationNode[]>
> = {
  website_snapshot: [
    "company_snapshot",
    "brain_snapshot",
    "website_understanding",
    "company_understanding",
    "strategy",
    "creative_generation",
    "campaign_suggestions",
  ],
  company_profile: ["company_snapshot", "brain_snapshot", "company_understanding", "strategy"],
  company_snapshot: [
    "brain_snapshot",
    "company_understanding",
    "strategy",
    "campaign_suggestions",
  ],
  brain_snapshot: ["company_understanding", "website_understanding", "strategy"],
  company_understanding: ["strategy", "campaign_suggestions"],
  website_understanding: ["strategy", "creative_generation"],
  brand_understanding: ["creative_generation", "strategy", "campaign_planning"],
  competitor_understanding: ["strategy"],
  strategy: ["channel_planning", "campaign_planning", "creative_generation", "campaign_suggestions"],
  channel_planning: ["creative_generation"],
  campaign_planning: [],
  creative_generation: ["validation", "campaign_suggestions"],
  validation: ["campaign_suggestions"],
  optimization: ["campaign_suggestions"],
  campaign_suggestions: [],
  memory: ["company_understanding"],
  performance_interpretation: ["optimization"],
  market_understanding: ["strategy"],
};

export function resolveInvalidationCascade(
  trigger: InvalidationNode
): readonly InvalidationNode[] {
  const visited = new Set<InvalidationNode>();
  const queue: InvalidationNode[] = [trigger];
  const result: InvalidationNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);
    const deps = INVALIDATION_DEPENDENCIES[node] ?? [];
    for (const dep of deps) {
      if (!visited.has(dep)) queue.push(dep);
    }
  }
  return result;
}

export function invalidationForCorrection(fieldKey: string): InvalidationEvent["affected"] {
  const triggers: InvalidationNode[] = ["company_profile", "company_snapshot"];
  if (fieldKey === "website") triggers.unshift("website_snapshot");
  const affected = new Set<InvalidationNode>();
  for (const t of triggers) {
    for (const n of resolveInvalidationCascade(t)) affected.add(n);
  }
  return [...affected];
}

export function createInvalidationEvent(input: {
  organizationId: string;
  trigger: InvalidationNode;
  reason: string;
  occurredAt?: string;
}): InvalidationEvent {
  return {
    id: `inv-${input.organizationId}-${Date.now()}`,
    organizationId: input.organizationId,
    trigger: input.trigger,
    affected: resolveInvalidationCascade(input.trigger),
    reason: input.reason,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}

/** Context hash slices that invalidate cache when any changes. */
export const CONTEXT_HASH_SLICES = [
  "website",
  "corrections",
  "business",
  "brand",
  "company_profile",
] as const;

export type ContextHashSlice = (typeof CONTEXT_HASH_SLICES)[number];

export function slicesForInvalidationTrigger(
  trigger: InvalidationNode
): readonly ContextHashSlice[] {
  switch (trigger) {
    case "website_snapshot":
      return ["website"];
    case "company_profile":
      return ["company_profile", "business", "brand"];
    default:
      return ["company_profile", "business", "brand", "corrections"];
  }
}
