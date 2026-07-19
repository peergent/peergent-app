import type { BusinessFact, FactImportance } from "@/lib/business-brain";

const IMPORTANCE_SCORE: Record<FactImportance, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const CONFIDENCE_SCORE = {
  low: 0,
  moderate: 1,
  high: 2,
} as const;

function keywordMatchBoost(fact: BusinessFact, searchTerms: string[]): number {
  if (searchTerms.length === 0) return 0;

  const haystack = `${fact.subject} ${fact.predicate} ${fact.value}`.toLowerCase();
  let matches = 0;

  for (const term of searchTerms) {
    if (haystack.includes(term)) matches += 1;
  }

  return matches;
}

export function rankFacts(facts: BusinessFact[], searchTerms: string[]): BusinessFact[] {
  return [...facts].sort((a, b) => {
    const scoreA =
      IMPORTANCE_SCORE[a.importance] * 3 +
      CONFIDENCE_SCORE[a.confidence] +
      (a.verified ? 2 : 0) +
      keywordMatchBoost(a, searchTerms);

    const scoreB =
      IMPORTANCE_SCORE[b.importance] * 3 +
      CONFIDENCE_SCORE[b.confidence] +
      (b.verified ? 2 : 0) +
      keywordMatchBoost(b, searchTerms);

    return scoreB - scoreA;
  });
}

export function trimList<T>(items: T[], limit: number): { items: T[]; omitted: number } {
  if (items.length <= limit) {
    return { items, omitted: 0 };
  }

  return {
    items: items.slice(0, limit),
    omitted: items.length - limit,
  };
}
