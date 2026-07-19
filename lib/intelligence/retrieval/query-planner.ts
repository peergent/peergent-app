import type { PeerRole } from "@/lib/context-engine/types";
import {
  DEFAULT_QUERY_PLAN,
  type BusinessBrainEntityType,
  type BusinessBrainQueryPlan,
} from "../types/business-brain-query";

const ROLE_DEFAULTS: Partial<Record<PeerRole, BusinessBrainEntityType[]>> = {
  Sales: ["customerSegments", "competitors", "products", "facts"],
  Marketing: ["customerSegments", "products", "services", "competitors", "knowledgeSources", "facts"],
  Support: ["services", "internalProcesses", "facts"],
  Planning: ["internalProcesses", "services", "facts"],
};

const KEYWORD_ENTITY_BOOSTS: Array<{ pattern: RegExp; entities: BusinessBrainEntityType[] }> =
  [
    { pattern: /\bcompetitor\b|\bvs\.?\b|\balternative\b/i, entities: ["competitors"] },
    { pattern: /\bproduct\b|\bpricing\b|\bcatalog\b/i, entities: ["products", "services"] },
    { pattern: /\bprocess\b|\bworkflow\b|\bprocedure\b/i, entities: ["internalProcesses"] },
    { pattern: /\bsegment\b|\bicp\b|\bcustomer\b|\baudience\b/i, entities: ["customerSegments"] },
    { pattern: /\bservice\b|\bsupport\b/i, entities: ["services"] },
  ];

function extractSearchTerms(taskHint?: string): string[] {
  if (!taskHint?.trim()) return [];
  return taskHint
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3)
    .slice(0, 12);
}

/** Rule-based retrieval planner — deterministic and testable (v2). */
export function planBusinessBrainQuery(
  role: string,
  taskHint?: string
): BusinessBrainQueryPlan {
  const searchTerms = extractSearchTerms(taskHint);
  const includeSet = new Set<BusinessBrainEntityType>(
    ROLE_DEFAULTS[role as PeerRole] ?? DEFAULT_QUERY_PLAN.includeEntityTypes
  );

  for (const { pattern, entities } of KEYWORD_ENTITY_BOOSTS) {
    if (taskHint && pattern.test(taskHint)) {
      for (const entity of entities) {
        includeSet.add(entity);
      }
    }
  }

  return {
    ...DEFAULT_QUERY_PLAN,
    includeEntityTypes: [...includeSet],
    searchTerms,
  };
}
