import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";

export type LinkedInPostWorkUnitOutput = {
  readonly hook: string;
  readonly body: string;
  readonly cta: string;
  readonly hashtags: readonly string[];
  readonly suggestedImageDescription: string;
  readonly publishingRecommendation: string;
};

export function mapLinkedInPostToWorkUnitOutput(
  post: MarketingLinkedInPost
): LinkedInPostWorkUnitOutput {
  return {
    hook: post.hook,
    body: post.body,
    cta: post.cta,
    hashtags: [...post.hashtags],
    suggestedImageDescription: post.suggestedImageDescription,
    publishingRecommendation: post.publishingRecommendation,
  };
}

export function validateLinkedInPostWorkUnitOutput(post: MarketingLinkedInPost): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!post.hook?.trim()) {
    errors.push("Hook is required.");
  }
  if (!post.body?.trim()) {
    errors.push("Body is required.");
  }
  if (!post.cta?.trim()) {
    errors.push("CTA is required.");
  }
  if (!post.hashtags?.length) {
    errors.push("Hashtags are required.");
  }
  return { valid: errors.length === 0, errors };
}
