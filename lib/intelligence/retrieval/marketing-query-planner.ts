import {
  DEFAULT_QUERY_PLAN,
  type BusinessBrainEntityType,
  type BusinessBrainQueryPlan,
} from "../types/business-brain-query";

const MARKETING_DEFAULT_ENTITIES: BusinessBrainEntityType[] = [
  "customerSegments",
  "products",
  "services",
  "competitors",
  "knowledgeSources",
  "facts",
];

const MARKETING_KEYWORD_BOOSTS: Array<{
  pattern: RegExp;
  entities: BusinessBrainEntityType[];
}> = [
  { pattern: /\bbrand\b|\bpositioning\b|\btone\b|\bvoice\b/i, entities: ["facts"] },
  { pattern: /\bcompetitor\b|\bvs\.?\b|\balternative\b/i, entities: ["competitors"] },
  { pattern: /\bcampaign\b|\bcontent\b|\bchannel\b|\bstrategy\b|\bpillar\b/i, entities: ["knowledgeSources", "facts"] },
  { pattern: /\bsegment\b|\bicp\b|\baudience\b|\bcustomer\b/i, entities: ["customerSegments"] },
  { pattern: /\bproduct\b|\bpricing\b|\boffer\b/i, entities: ["products", "services"] },
];

function extractSearchTerms(taskHint?: string): string[] {
  if (!taskHint?.trim()) return [];
  return taskHint
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3)
    .slice(0, 12);
}

/** Marketing-specific Business Brain retrieval plan. */
export function planMarketingBusinessBrainQuery(
  taskHint?: string
): BusinessBrainQueryPlan {
  const searchTerms = extractSearchTerms(taskHint);
  const includeSet = new Set<BusinessBrainEntityType>(MARKETING_DEFAULT_ENTITIES);

  for (const { pattern, entities } of MARKETING_KEYWORD_BOOSTS) {
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
