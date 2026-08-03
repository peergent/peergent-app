/** Token budget helpers for projected Brain context. */

export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4);
}

export function dedupeLines(lines: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line.trim());
  }
  return out;
}

export function compressFacts(facts: readonly string[], maxItems = 12): string[] {
  return dedupeLines(facts).slice(0, maxItems);
}

export function trimSection(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 3).trim()}...`;
}

export function withinTokenBudget(text: string, maxTokens: number): boolean {
  return estimateTokensFromText(text) <= maxTokens;
}
