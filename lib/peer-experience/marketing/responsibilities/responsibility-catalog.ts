import type { PeerResponsibilityId } from "../peer-settings-store";
import type {
  MarketingAutonomyLevel,
  MarketingResponsibility,
  MarketingResponsibilityCategory,
  MarketingResponsibilityGuardrails,
} from "./types";

export type ResponsibilityCatalogEntry = {
  catalogId: PeerResponsibilityId;
  category: MarketingResponsibilityCategory;
  title: string;
  description: string;
  defaultGoal: string;
  defaultSuccessMetric?: string;
  defaultCadence: MarketingResponsibility["cadence"];
  defaultAutonomy: MarketingAutonomyLevel;
  defaultGuardrails: MarketingResponsibilityGuardrails;
  integrationId?: string;
};

export const RESPONSIBILITY_CATALOG: ResponsibilityCatalogEntry[] = [
  {
    catalogId: "instagram",
    category: "instagram",
    title: "Instagram",
    description: "Emma owns your Instagram presence — content, timing, and performance.",
    defaultGoal: "Grow reach and engagement consistently",
    defaultSuccessMetric: "Reach and engagement rate",
    defaultCadence: { type: "weekly", postsPerWeek: 4, evaluationIntervalDays: 1, label: "4 posts/week" },
    defaultAutonomy: "semi_autonomous",
    defaultGuardrails: { maxPostsPerWeek: 4, approvalRequired: true, imageGenerationPolicy: "when_needed" },
    integrationId: "instagram",
  },
  {
    catalogId: "linkedin",
    category: "linkedin",
    title: "LinkedIn",
    description: "Emma manages LinkedIn thought leadership and company updates.",
    defaultGoal: "Build authority with your target audience",
    defaultSuccessMetric: "Impressions and profile visits",
    defaultCadence: { type: "weekly", postsPerWeek: 3, evaluationIntervalDays: 1, label: "3 posts/week" },
    defaultAutonomy: "semi_autonomous",
    defaultGuardrails: { maxPostsPerWeek: 3, approvalRequired: true },
    integrationId: "linkedin",
  },
  {
    catalogId: "seo",
    category: "seo",
    title: "SEO",
    description: "Emma monitors rankings, content gaps, and organic performance.",
    defaultGoal: "Improve organic search visibility",
    defaultSuccessMetric: "Organic traffic and keyword rankings",
    defaultCadence: { type: "weekly", evaluationIntervalDays: 7, label: "Weekly evaluation" },
    defaultAutonomy: "suggest",
    defaultGuardrails: { riskTolerance: "low" },
    integrationId: "search_console",
  },
  {
    catalogId: "blogs",
    category: "blog",
    title: "Blog",
    description: "Emma plans and creates blog content aligned with your strategy.",
    defaultGoal: "Publish valuable content consistently",
    defaultCadence: { type: "weekly", postsPerWeek: 1, evaluationIntervalDays: 7, label: "1 post/week" },
    defaultAutonomy: "semi_autonomous",
    defaultGuardrails: { approvalRequired: true },
    integrationId: "wordpress",
  },
  {
    catalogId: "email_marketing",
    category: "newsletter",
    title: "Email Marketing",
    description: "Emma prepares email campaigns and nurtures your audience.",
    defaultGoal: "Drive engagement through email",
    defaultCadence: { type: "monthly", evaluationIntervalDays: 7, label: "Monthly sends" },
    defaultAutonomy: "semi_autonomous",
    defaultGuardrails: { approvalRequired: true },
    integrationId: "mailchimp",
  },
  {
    catalogId: "google_ads",
    category: "google_ads",
    title: "Google Ads",
    description: "Emma optimises paid search within your guardrails.",
    defaultGoal: "Reduce cost per acquisition",
    defaultSuccessMetric: "CPC and conversion rate",
    defaultCadence: { type: "weekly", evaluationIntervalDays: 1, label: "Daily monitoring" },
    defaultAutonomy: "suggest",
    defaultGuardrails: { maxBudgetChangePercent: 10, maxMonthlySpend: 5000, riskTolerance: "low" },
    integrationId: "google_ads",
  },
  {
    catalogId: "meta_ads",
    category: "meta_ads",
    title: "Meta Ads",
    description: "Emma manages Meta advertising within configured limits.",
    defaultGoal: "Improve ROAS on Meta channels",
    defaultCadence: { type: "weekly", evaluationIntervalDays: 1, label: "Daily monitoring" },
    defaultAutonomy: "suggest",
    defaultGuardrails: { maxBudgetChangePercent: 10, riskTolerance: "medium" },
    integrationId: "meta",
  },
  {
    catalogId: "landing_pages",
    category: "website",
    title: "Website",
    description: "Emma keeps landing pages and web content aligned with campaigns.",
    defaultGoal: "Improve conversion on key pages",
    defaultCadence: { type: "monthly", evaluationIntervalDays: 14, label: "Bi-weekly review" },
    defaultAutonomy: "suggest",
    defaultGuardrails: { approvalRequired: true },
    integrationId: "wordpress",
  },
  {
    catalogId: "newsletters",
    category: "newsletter",
    title: "Newsletter",
    description: "Emma owns recurring newsletter production and sends.",
    defaultGoal: "Deliver consistent newsletter value",
    defaultCadence: { type: "monthly", evaluationIntervalDays: 7, label: "Monthly newsletter" },
    defaultAutonomy: "semi_autonomous",
    defaultGuardrails: { approvalRequired: true },
    integrationId: "mailchimp",
  },
];

export function catalogEntryForCategory(
  category: MarketingResponsibilityCategory
): ResponsibilityCatalogEntry | undefined {
  return RESPONSIBILITY_CATALOG.find((e) => e.category === category);
}

export function integrationForCategory(category: MarketingResponsibilityCategory): string | undefined {
  return catalogEntryForCategory(category)?.integrationId;
}
