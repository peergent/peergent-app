/** Shared blocklist — generic AI marketing language that must not reach customers. Sprint 10.1. */

export const GENERIC_MARKETING_PHRASE_PATTERNS: readonly RegExp[] = [
  /innovator positioning/i,
  /inferred positioning/i,
  /awareness → consideration/i,
  /awareness.*consideration.*action/i,
  /top of funnel/i,
  /abstract theme/i,
  /campaign goal:/i,
  /^campaign goal\b/i,
  /increase brand awareness/i,
  /drive engagement/i,
  /multi-channel approach/i,
  /pricing model is unknown/i,
  /pricing model unknown/i,
  /leverage social media/i,
  /best practices/i,
  /optimize your marketing/i,
  /boost visibility/i,
  /comprehensive strategy/i,
  /targeted campaign/i,
  /grow your business/i,
  /reach more customers/i,
];

export function containsGenericMarketingPhrase(text: string): boolean {
  return GENERIC_MARKETING_PHRASE_PATTERNS.some((pattern) => pattern.test(text));
}

export function findGenericMarketingPhrases(text: string): string[] {
  return GENERIC_MARKETING_PHRASE_PATTERNS.filter((pattern) => pattern.test(text)).map(
    (p) => p.source
  );
}
