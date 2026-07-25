import type { ContentCalendarEntry, MarketingPlan } from "../types/plan";
import type { MarketingDraftContentType } from "../types/content-draft";
import { SUPPORTED_DRAFT_CONTENT_TYPES } from "../types/content-draft";

const CONTENT_TYPE_ALIASES: Record<string, MarketingDraftContentType> = {
  linkedin_post: "linkedin_post",
  "linkedin post": "linkedin_post",
  linkedin: "linkedin_post",
  blog_post: "blog_article",
  blog_article: "blog_article",
  "blog article": "blog_article",
  blog: "blog_article",
  newsletter: "newsletter",
  email: "newsletter",
  website_article: "website_article",
  "website article": "website_article",
  website: "website_article",
  social_post: "social_media_post",
  social_media_post: "social_media_post",
  "social media post": "social_media_post",
  social: "social_media_post",
  google_ads: "google_ads_copy",
  google_ads_copy: "google_ads_copy",
  "google ads": "google_ads_copy",
  meta_ads: "meta_ads_copy",
  meta_ads_copy: "meta_ads_copy",
  "meta ads": "meta_ads_copy",
  facebook_ads: "meta_ads_copy",
};

export type ResolvedPlanActivity = {
  activity: ContentCalendarEntry;
  normalizedContentType: MarketingDraftContentType;
};

export function normalizeContentType(raw: string): MarketingDraftContentType | null {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (SUPPORTED_DRAFT_CONTENT_TYPES.includes(key as MarketingDraftContentType)) {
    return key as MarketingDraftContentType;
  }
  return CONTENT_TYPE_ALIASES[key] ?? null;
}

export function isSupportedContentType(raw: string): boolean {
  return normalizeContentType(raw) !== null;
}

/** Whether a plan activity can enter the content-draft pipeline. */
export function isDraftablePlanActivity(entry: Pick<ContentCalendarEntry, "contentType">): boolean {
  return isSupportedContentType(entry.contentType);
}

/** Resolves a content-calendar activity from the plan by exact title match. */
export function resolveContentCalendarActivity(
  plan: MarketingPlan,
  planActivityReference: string
): ResolvedPlanActivity | null {
  const reference = planActivityReference.trim().toLowerCase();
  if (!reference) return null;

  const activity = plan.contentCalendar.find(
    (entry) => entry.title.trim().toLowerCase() === reference
  );

  if (!activity) return null;

  const normalizedContentType = normalizeContentType(activity.contentType);
  if (!normalizedContentType) return null;

  return { activity, normalizedContentType };
}

export function listContentCalendarReferences(plan: MarketingPlan): string[] {
  return plan.contentCalendar.map((entry) => entry.title);
}
