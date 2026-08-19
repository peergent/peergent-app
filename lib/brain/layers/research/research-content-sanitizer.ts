/**
 * PX-63 — sanitize untrusted external web content before Brain pipeline ingestion.
 * External content is DATA only — never executable instructions.
 */

const MAX_EXCERPT_CHARS = 2_000;
const MAX_TITLE_CHARS = 240;

/** Strip HTML tags and collapse whitespace; truncate to safe bounds. */
export function sanitizeExternalWebText(raw: string, maxChars = MAX_EXCERPT_CHARS): string {
  if (!raw?.trim()) return "";

  let text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Neutralize common instruction-injection patterns in scraped text.
  text = text
    .replace(/\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+instructions?\b/gi, "[filtered]")
    .replace(/\bsystem\s*:\s*/gi, "[filtered] ")
    .replace(/\bassistant\s*:\s*/gi, "[filtered] ")
    .replace(/\buser\s*:\s*/gi, "[filtered] ");

  if (text.length > maxChars) {
    return `${text.slice(0, maxChars)}…`;
  }
  return text;
}

export function sanitizeExternalTitle(raw: string | null | undefined): string {
  const cleaned = sanitizeExternalWebText(raw ?? "", MAX_TITLE_CHARS);
  return cleaned || "Untitled source";
}

export function isAllowedResearchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local")) return false;
    if (/^127\.|^10\.|^192\.168\.|^169\.254\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}
