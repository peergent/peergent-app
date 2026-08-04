/** Normalize evidence text for duplicate comparison. */
export function normalizeEvidenceItem(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Remove exact duplicate evidence strings (case-insensitive, whitespace-normalized). */
export function dedupeEvidenceItems(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = normalizeEvidenceItem(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

/** Stable React list keys — never use raw item text as key. */
export function evidenceItemKey(sectionId: string, index: number): string {
  return `${sectionId}-${index}`;
}
