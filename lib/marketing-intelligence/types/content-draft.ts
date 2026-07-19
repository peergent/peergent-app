import type { StrategyLink } from "./plan";
import type { MarketingStrategyConfidence } from "./strategy";

/** Supported draft content types for Sprint 9.4. */
export type MarketingDraftContentType =
  | "linkedin_post"
  | "blog_article"
  | "newsletter"
  | "website_article"
  | "social_media_post"
  | "google_ads_copy"
  | "meta_ads_copy";

export const SUPPORTED_DRAFT_CONTENT_TYPES: readonly MarketingDraftContentType[] = [
  "linkedin_post",
  "blog_article",
  "newsletter",
  "website_article",
  "social_media_post",
  "google_ads_copy",
  "meta_ads_copy",
] as const;

export type ContentDraftStatus =
  | "draft"
  | "ready_for_review"
  | "rejected"
  | "approved";

export type ContentSourceReference = {
  source:
    | "company-dna"
    | "business-brain"
    | "marketing-understanding"
    | "marketing-plan"
    | "marketing-strategy";
  reference: string;
};

export type ContentDraftRationale = {
  why: string;
  planActivityReference: string;
  strategyLinks: StrategyLink[];
};

/**
 * Structured marketing content draft for a single plan activity.
 * Traceability: Marketing Strategy → Marketing Plan → Content Draft.
 */
export type MarketingContentDraft = {
  id: string;
  planActivityReference: string;
  contentType: MarketingDraftContentType;
  channel?: string;
  objective: string;
  targetAudience?: string;
  title: string;
  body: string;
  callToAction?: string;
  keywords: string[];
  rationale: ContentDraftRationale;
  sourceReferences: ContentSourceReference[];
  confidence: MarketingStrategyConfidence;
  status: ContentDraftStatus;
  warnings: string[];
  generatedAt: string;
};

export type ParsedMarketingContentDraftResult =
  | { success: true; draft: MarketingContentDraft; warnings: string[] }
  | { success: false; error: string; warnings: string[] };

export type ContentDraftValidationContext = {
  expectedPlanActivityReference: string;
  knownProductNames: string[];
  knownServiceNames: string[];
  knownAudienceNames: string[];
};
