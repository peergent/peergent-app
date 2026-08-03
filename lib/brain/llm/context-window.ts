import { estimateTokensFromText, trimSection } from "./token-budget";

const DEFAULT_MAX_CONTEXT_TOKENS = 6000;

export function fitContextToWindow(input: {
  sections: Record<string, string>;
  maxTokens?: number;
}): Record<string, string> {
  const maxTokens = input.maxTokens ?? DEFAULT_MAX_CONTEXT_TOKENS;
  const entries = Object.entries(input.sections).filter(([, v]) => v.trim().length > 0);
  let total = entries.reduce((sum, [, v]) => sum + estimateTokensFromText(v), 0);

  if (total <= maxTokens) {
    return Object.fromEntries(entries);
  }

  const trimmed: Record<string, string> = {};
  const priority = ["campaignGoal", "targetAudience", "companyProfile", "brand", "websiteSummary", "competitors", "knownFacts", "unknowns", "corrections", "workingAgreement", "executionMode"];

  for (const key of priority) {
    const value = input.sections[key];
    if (!value) continue;
    trimmed[key] = trimSection(value, 1200);
  }

  total = Object.values(trimmed).reduce((sum, v) => sum + estimateTokensFromText(v), 0);
  if (total > maxTokens) {
    const scale = maxTokens / total;
    for (const key of Object.keys(trimmed)) {
      const maxChars = Math.max(200, Math.floor(trimmed[key].length * scale));
      trimmed[key] = trimSection(trimmed[key], maxChars);
    }
  }

  return trimmed;
}
