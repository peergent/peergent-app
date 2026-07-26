import type { MarketingLinkedInPost, ParsedMarketingLinkedInPost } from "./types";

export function mapParsedPostToMarketingLinkedInPost(input: {
  parsed: ParsedMarketingLinkedInPost;
  workUnitId: string;
  campaignId: string;
  assembledAt: string;
}): MarketingLinkedInPost {
  return {
    id: `linkedin-post:${input.workUnitId}`,
    workUnitId: input.workUnitId,
    campaignId: input.campaignId,
    hook: input.parsed.hook,
    body: input.parsed.body,
    cta: input.parsed.cta,
    hashtags: [...input.parsed.hashtags],
    suggestedImageDescription: input.parsed.suggestedImageDescription,
    publishingRecommendation: input.parsed.publishingRecommendation,
    generatedAt: input.assembledAt,
  };
}
