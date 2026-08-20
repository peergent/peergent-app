/**
 * PX-64 — detect deterministic template / instruction copy that must never ship as final creative.
 */

/** Known deterministic builder strings from pre-PX-64 production — not channel-ready marketing copy. */
export const CREATIVE_TEMPLATE_PLACEHOLDER_MARKERS = [
  "Name the problem before the solution",
  "Herken het probleem voordat je de oplossing noemt",
  "Book a conversation",
  "Plan een gesprek",
  "Value-led campaign",
  "Waarde-gedreven campagne",
] as const;

/** Patterns that indicate creative direction leaked as customer-facing copy. */
export const CREATIVE_DIRECTION_INSTRUCTION_PATTERNS = [
  /^name the problem before/i,
  /^herken het probleem voordat/i,
  /^book a conversation\.?$/i,
  /^plan een gesprek\.?$/i,
  /^support campaign objective$/i,
  /^deliverable specs — not published/i,
  /^deliverable-specificaties — geen publicatie/i,
] as const;

export function containsCreativeTemplatePlaceholder(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const normalized = text.trim();
  for (const marker of CREATIVE_TEMPLATE_PLACEHOLDER_MARKERS) {
    if (normalized.toLowerCase().includes(marker.toLowerCase())) return true;
  }
  for (const pattern of CREATIVE_DIRECTION_INSTRUCTION_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  return false;
}

export function findCreativePlaceholderIssues(input: {
  headline?: string | null;
  hook?: string | null;
  body?: string | null;
  cta?: string | null;
  subject?: string | null;
}): string[] {
  const issues: string[] = [];
  const fields: Array<[string, string | null | undefined]> = [
    ["headline", input.headline],
    ["hook", input.hook],
    ["body", input.body],
    ["cta", input.cta],
    ["subject", input.subject],
  ];
  for (const [field, value] of fields) {
    if (containsCreativeTemplatePlaceholder(value)) {
      issues.push(`template_placeholder_${field}`);
    }
  }
  return issues;
}
