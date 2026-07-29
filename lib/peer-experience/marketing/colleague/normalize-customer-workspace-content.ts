import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import type { MarketingActivity } from "../domain/marketing-peer-types";

const MAX_SUMMARY = 140;
const MAX_TITLE = 96;

export function clampCustomerText(text: string, max = MAX_SUMMARY): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

/** Strip trailing periods and internal noise from status-like strings. */
export function sanitizeCustomerLine(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^Approved\.?$/i, "")
    .replace(/^Executed\.?$/i, "")
    .trim();
}

export type AttentionItemKind =
  | "content_approval"
  | "campaign_strategy"
  | "campaign_creative"
  | "campaign_content"
  | "campaign_plan"
  | "connection"
  | "other";

const REVIEW_TITLE_PATTERNS: Array<{
  pattern: RegExp;
  kind: AttentionItemKind;
}> = [
  { pattern: /marketing strategy/i, kind: "campaign_strategy" },
  { pattern: /campaign strategy/i, kind: "campaign_strategy" },
  { pattern: /campagnestrategie/i, kind: "campaign_strategy" },
  { pattern: /creative direction/i, kind: "campaign_creative" },
  { pattern: /creatieve richting/i, kind: "campaign_creative" },
  { pattern: /campaign plan/i, kind: "campaign_plan" },
  { pattern: /campagneplan/i, kind: "campaign_plan" },
  { pattern: /linkedin|email|post|caption|content/i, kind: "campaign_content" },
];

export function classifyAttentionTitle(rawTitle: string): AttentionItemKind {
  for (const { pattern, kind } of REVIEW_TITLE_PATTERNS) {
    if (pattern.test(rawTitle)) return kind;
  }
  if (/approval|review|beoordel/i.test(rawTitle)) return "content_approval";
  return "other";
}

export function normalizeAttentionTitle(
  rawTitle: string,
  locale: MarketingCampaignLocale,
  kind?: AttentionItemKind
): string {
  const k = kind ?? classifyAttentionTitle(rawTitle);
  const labels: Record<AttentionItemKind, Record<MarketingCampaignLocale, string>> = {
    content_approval: {
      en: "Review content",
      nl: "Content beoordelen",
    },
    campaign_strategy: {
      en: "Review campaign strategy",
      nl: "Campagnestrategie beoordelen",
    },
    campaign_creative: {
      en: "Review creative direction",
      nl: "Creatieve richting beoordelen",
    },
    campaign_content: {
      en: "Review deliverable",
      nl: "Onderdeel beoordelen",
    },
    campaign_plan: {
      en: "Review campaign plan",
      nl: "Campagneplan beoordelen",
    },
    connection: {
      en: "Connect channel",
      nl: "Kanaal koppelen",
    },
    other: {
      en: clampCustomerText(rawTitle.replace(/^Review\s+/i, ""), MAX_TITLE),
      nl: clampCustomerText(rawTitle.replace(/^Review\s+/i, ""), MAX_TITLE),
    },
  };
  return labels[k][locale];
}

export function normalizeAttentionReason(
  raw: string,
  locale: MarketingCampaignLocale
): string {
  const cleaned = sanitizeCustomerLine(raw);
  if (!cleaned || /^content approval required$/i.test(cleaned)) {
    return locale === "nl"
      ? "Ik kan verder zodra je dit hebt beoordeeld."
      : "I can continue once you've reviewed this.";
  }
  if (/connection permission/i.test(cleaned)) {
    return locale === "nl"
      ? "Koppel je account zodat ik kan publiceren."
      : "Connect your account so I can publish.";
  }
  return clampCustomerText(cleaned);
}

export type OutcomeCategory =
  | "strategy"
  | "creative"
  | "content"
  | "publish"
  | "approval"
  | "measurement"
  | "general";

export function outcomeCategoryForActivity(activity: MarketingActivity): OutcomeCategory {
  const title = activity.title.toLowerCase();
  const summary = (activity.summary ?? "").toLowerCase();
  const blob = `${title} ${summary}`;
  if (/strateg|strategy/.test(blob)) return "strategy";
  if (/creative|richting|direction/.test(blob)) return "creative";
  if (/publish|published|gepubliceerd/.test(blob)) return "publish";
  if (/approv|goedgekeurd/.test(blob)) return "approval";
  if (/measur|metric|performance|engagement/.test(blob)) return "measurement";
  if (activity.type === "published" || activity.type === "sent") return "publish";
  if (activity.type === "approved") return "approval";
  if (activity.type === "generated") return "content";
  return "general";
}

export function localizeOutcomePresentation(input: {
  activity: MarketingActivity;
  locale: MarketingCampaignLocale;
  projectTitle?: string;
}): { title: string; valueStatement: string; dedupeKey: string } {
  const { activity, locale, projectTitle } = input;
  const category = outcomeCategoryForActivity(activity);
  const project = projectTitle?.trim() || null;

  const titles: Record<OutcomeCategory, Record<MarketingCampaignLocale, string>> = {
    strategy: {
      en: "Campaign strategy completed",
      nl: "Campagnestrategie afgerond",
    },
    creative: {
      en: "Creative direction completed",
      nl: "Creatieve richting afgerond",
    },
    content: {
      en: "Content prepared",
      nl: "Content voorbereid",
    },
    publish: {
      en: "Content published",
      nl: "Content gepubliceerd",
    },
    approval: {
      en: "Approval recorded",
      nl: "Goedkeuring vastgelegd",
    },
    measurement: {
      en: "Results updated",
      nl: "Resultaten bijgewerkt",
    },
    general: {
      en: "Work completed",
      nl: "Werk afgerond",
    },
  };

  const valueByCategory: Record<OutcomeCategory, Record<MarketingCampaignLocale, string>> = {
    strategy: {
      en: "Prepared and ready for the next step",
      nl: "Opgesteld en klaar voor de volgende stap",
    },
    creative: {
      en: "Direction agreed for this campaign",
      nl: "Richting vastgelegd voor deze campagne",
    },
    content: {
      en: "Deliverable ready in your campaign",
      nl: "Onderdeel klaar in je campagne",
    },
    publish: {
      en: "Live on your selected channel",
      nl: "Live op je gekozen kanaal",
    },
    approval: {
      en: "Your decision is applied",
      nl: "Je beslissing is doorgevoerd",
    },
    measurement: {
      en: "Latest performance captured",
      nl: "Laatste prestaties vastgelegd",
    },
    general: {
      en: clampCustomerText(sanitizeCustomerLine(activity.summary ?? activity.title), MAX_SUMMARY),
      nl: clampCustomerText(sanitizeCustomerLine(activity.summary ?? activity.title), MAX_SUMMARY),
    },
  };

  const title = titles[category][locale];
  let valueStatement = valueByCategory[category][locale];
  if (project && category !== "general") {
    valueStatement = project;
  }

  const dedupeKey = `${project ?? "peer"}:${category}`;

  return { title, valueStatement: clampCustomerText(valueStatement, MAX_SUMMARY), dedupeKey };
}

export function presenceWaitingNarrative(
  count: number,
  locale: MarketingCampaignLocale
): string {
  if (count <= 0) {
    return locale === "nl"
      ? "Ik heb op dit moment niets van je nodig."
      : "I don't need anything from you right now.";
  }
  if (count === 1) {
    return locale === "nl"
      ? "Er is 1 onderdeel dat jouw beoordeling nodig heeft."
      : "There is 1 item that needs your review.";
  }
  return locale === "nl"
    ? `Er zijn ${count} onderdelen die jouw beoordeling nodig hebben.`
    : `${count} items need your review.`;
}

export function presenceWaitingCta(
  count: number,
  locale: MarketingCampaignLocale
): string {
  if (locale === "nl") {
    return count === 1 ? "Bekijk beslissing" : `Bekijk ${count} beslissingen`;
  }
  return count === 1 ? "View decision" : `View ${count} decisions`;
}

export function formatUpdatedLabel(relative: string, locale: MarketingCampaignLocale): string {
  return locale === "nl" ? `Bijgewerkt ${relative}` : `Updated ${relative}`;
}

/** Reject raw English internal status tokens in localized UI. */
export function isRawInternalStatus(text: string): boolean {
  return /^(approved|executed|generated|published|ready for review)\.?$/i.test(text.trim());
}
