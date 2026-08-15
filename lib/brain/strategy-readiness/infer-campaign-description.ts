/**
 * Deterministic audience inference from campaign description/objective text.
 * Explicit campaign audience always wins — this is lowest-precedence fallback only.
 */

const AUDIENCE_PATTERNS: readonly RegExp[] = [
  /\baimed at\s+([^.;\n,]+)/i,
  /\btargeting\s+([^.;\n,]+)/i,
  /\bfor\s+([A-Z][^.;\n]{8,80}?(?:SMEs|SMBs|enterprises|businesses|companies|professionals|leaders|teams|buyers|customers))\b/i,
  /\bdoelgroep[:\s]+([^.;\n,]+)/i,
  /\bgericht op\s+([^.;\n,]+)/i,
];

export function inferTargetAudienceFromDescription(description: string): string | null {
  const text = description.trim();
  if (text.length < 20) return null;

  for (const pattern of AUDIENCE_PATTERNS) {
    const match = text.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 5 && candidate.length <= 120) {
      return candidate.replace(/\s+/g, " ");
    }
  }

  return null;
}
