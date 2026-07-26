/** Review-ready LinkedIn post artifact for a single work unit. */
export type MarketingLinkedInPost = {
  readonly id: string;
  readonly workUnitId: string;
  readonly campaignId: string;
  readonly hook: string;
  readonly body: string;
  readonly cta: string;
  readonly hashtags: readonly string[];
  readonly suggestedImageDescription: string;
  readonly publishingRecommendation: string;
  readonly generatedAt: string;
};

export type ParsedMarketingLinkedInPost = {
  readonly hook: string;
  readonly body: string;
  readonly cta: string;
  readonly hashtags: readonly string[];
  readonly suggestedImageDescription: string;
  readonly publishingRecommendation: string;
};
