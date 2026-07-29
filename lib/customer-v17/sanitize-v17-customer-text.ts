import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import {
  classifyAttentionTitle,
  normalizeAttentionTitle,
  sanitizeCustomerLine,
} from "@/lib/peer-experience/marketing/colleague/normalize-customer-workspace-content";

const BLOCKED_NL = [
  /^review campaign plan$/i,
  /^review marketing strategy$/i,
  /^ready\.?$/i,
  /^yesterday$/i,
  /^goal:/i,
  /^next action:/i,
  /^why\?$/i,
  /^recommendation$/i,
  /^this month$/i,
  /^today$/i,
  /^approved\.?$/i,
  /^executed\.?$/i,
];

export function sanitizeV17CustomerLine(
  text: string,
  locale: MarketingCampaignLocale
): string {
  const cleaned = sanitizeCustomerLine(text);
  if (!cleaned) return "";
  if (locale === "nl") {
    for (const pattern of BLOCKED_NL) {
      if (pattern.test(cleaned)) return "";
    }
    if (/^review\s+/i.test(cleaned)) {
      return normalizeAttentionTitle(cleaned, locale, classifyAttentionTitle(cleaned));
    }
  }
  return cleaned;
}

export function normalizeNeedsYouTitle(
  raw: string,
  locale: MarketingCampaignLocale
): string {
  const kind = classifyAttentionTitle(raw);
  if (kind !== "other" || /^review\s+/i.test(raw)) {
    return normalizeAttentionTitle(raw, locale, kind);
  }
  return sanitizeV17CustomerLine(raw, locale) || normalizeAttentionTitle(raw, locale, kind);
}

/** Hide internal placeholder campaign names in customer chrome. */
export function sanitizeV17CampaignDisplayName(name: string): string {
  const cleaned = sanitizeCustomerLine(name);
  if (!cleaned) return "";
  if (/^review\s+test$/i.test(cleaned)) return "";
  if (/^test\s+campaign$/i.test(cleaned)) return "";
  return cleaned;
}
