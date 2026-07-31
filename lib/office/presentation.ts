import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";

/**
 * The office presentation boundary.
 *
 * §6 The interface never speaks machine. Domain logic is frozen and keeps its
 * own vocabulary; everything it produces is mapped here on the way to the
 * screen. Nothing in this file changes a domain decision — it only changes how
 * that decision is spoken.
 */

/**
 * §6 Prohibited customer-facing vocabulary, plus the internal artefact nouns
 * the frozen domain still emits. Used as a guard, not a rewriter: if a phrase
 * reaches the UI carrying one of these, it is a mapping gap worth catching.
 */
export const PROHIBITED_TERMS = [
  "generate",
  "generation",
  "execute",
  "execution",
  "runtime",
  "work unit",
  "prompt",
  "token",
  "provider",
  "pipeline",
  "payload",
  "confidence score",
  "trace",
  "deliverable",
] as const;

export function containsProhibitedTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return PROHIBITED_TERMS.some((term) => lower.includes(term));
}

/**
 * Maps the frozen `deriveProjectNextStep` output onto colleague language.
 * Keys are the exact strings the domain emits; anything unmapped falls back to
 * a neutral phrase rather than leaking machine vocabulary.
 */
const NEXT_STEP_EN: Record<string, string> = {
  "Plan campaign approach": "Work out the approach",
  "Generate visual assets": "Make the visuals",
  "Generate content": "Write the content",
  "Prepare deliverables": "Get everything ready",
  "Review deliverable": "Waiting for your go-ahead",
  "Publish at scheduled time": "Goes out at the scheduled time",
  "Publishing now": "Publishing now",
  "Track performance": "Watching how it performs",
};

const NEXT_STEP_NL: Record<string, string> = {
  "Plan campaign approach": "De aanpak uitwerken",
  "Generate visual assets": "De beelden maken",
  "Generate content": "De content schrijven",
  "Prepare deliverables": "Alles klaarzetten",
  "Review deliverable": "Wacht op jouw akkoord",
  "Publish at scheduled time": "Gaat op het geplande moment live",
  "Publishing now": "Wordt nu gepubliceerd",
  "Track performance": "Volgt hoe het presteert",
};

const NEXT_STEP_FALLBACK: Record<MarketingCampaignLocale, string> = {
  en: "Working on the next step",
  nl: "Bezig met de volgende stap",
};

export function presentNextStep(
  raw: string | null | undefined,
  locale: MarketingCampaignLocale
): string | null {
  if (!raw) return null;
  const map = locale === "nl" ? NEXT_STEP_NL : NEXT_STEP_EN;
  const mapped = map[raw];
  if (mapped) return mapped;
  // Unmapped domain string: never leak it if it carries machine vocabulary.
  return containsProhibitedTerm(raw) ? NEXT_STEP_FALLBACK[locale] : raw;
}

/**
 * Formats an ISO timestamp as a short, human date. Returns null for anything
 * unparseable so callers render nothing rather than an ISO string.
 */
export function presentExpectedDate(
  iso: string | null | undefined,
  locale: MarketingCampaignLocale
): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (!Number.isFinite(at.getTime())) return null;

  const formatted = new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "short",
  }).format(at);

  return locale === "nl" ? `Verwacht ${formatted}` : `Expected ${formatted}`;
}
