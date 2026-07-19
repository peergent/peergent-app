import type { ContentCalendarEntry, MarketingPlan } from "../types/plan";
import type { MarketingDraftContentType } from "../types/content-draft";

const DRAFT_JSON_SCHEMA = `{
  "planActivityReference": "string — must match the selected content-calendar activity title exactly",
  "contentType": "linkedin_post|blog_article|newsletter|website_article|social_media_post|google_ads_copy|meta_ads_copy",
  "channel": "string",
  "objective": "string — what this draft aims to achieve per the plan",
  "targetAudience": "string",
  "title": "string — headline or title",
  "body": "string — draft content body (not published)",
  "callToAction": "string",
  "keywords": ["string"],
  "rationale": { "why": "string — why this draft implements the plan activity" },
  "sourceReferences": [{ "source": "company-dna|business-brain|marketing-understanding|marketing-plan|marketing-strategy", "reference": "string" }],
  "confidence": "low|moderate|high",
  "status": "draft"
}`;

/** Task prompt appendix for generating a single content draft from a plan activity. */
export function buildMarketingContentTaskAppendix(
  plan: MarketingPlan,
  activity: ContentCalendarEntry,
  normalizedContentType: MarketingDraftContentType
): string {
  const activityBlock = JSON.stringify(
    {
      title: activity.title,
      contentType: activity.contentType,
      normalizedContentType,
      channel: activity.channel,
      scheduledWeek: activity.scheduledWeek,
      pillar: activity.pillar,
      rationale: activity.rationale,
      linkedStrategyItems: activity.linkedStrategyItems,
      estimatedEffort: activity.estimatedEffort,
      expectedImpact: activity.expectedImpact,
    },
    null,
    2
  );

  const planContext = JSON.stringify(
    {
      summary: plan.summary,
      basedOnStrategySummary: plan.basedOnStrategySummary,
      objectives: plan.objectives.map((o) => o.title),
      contentCalendarCount: plan.contentCalendar.length,
    },
    null,
    2
  );

  return [
    "You are operating as the Marketing Content Creator.",
    "Generate ONE draft content piece for the selected content-calendar activity.",
    "Do NOT create a new marketing strategy or plan.",
    "Do NOT publish content — output a draft only with status \"draft\".",
    "",
    "Marketing Plan context:",
    planContext,
    "",
    "Selected content-calendar activity (implement this exactly):",
    activityBlock,
    "",
    "Requirements:",
    "- planActivityReference MUST exactly match the activity title above.",
    `- contentType MUST be "${normalizedContentType}".`,
    "- Follow Company DNA tone of voice and brand principles from verified context.",
    "- Ground all product, service, and company claims in Business Brain context only.",
    "- Do not invent facts, products, customers, metrics, or capabilities.",
    "- When information is missing, use cautious language and note limitations in rationale.why.",
    "- Include sourceReferences citing which context drove key decisions.",
    "- Preserve strategy traceability by referencing the plan activity's linkedStrategyItems in rationale.",
    "- Generate exactly ONE draft — not a series or multiple variants.",
    "",
    "Respond with valid JSON only (no markdown fences) matching this schema:",
    DRAFT_JSON_SCHEMA,
  ].join("\n");
}

export const MARKETING_CONTENT_BEHAVIORAL_INSTRUCTIONS = [
  "Generate one draft content piece for the selected plan activity — not a new strategy or plan.",
  "Follow Company DNA tone of voice. Ground factual claims in Business Brain context.",
  "Never publish content. Output status must be draft.",
  "When context is missing, use warnings in rationale rather than inventing facts.",
] as const;

export const MARKETING_CONTENT_DEFAULT_MAX_TOKENS = 4096;
