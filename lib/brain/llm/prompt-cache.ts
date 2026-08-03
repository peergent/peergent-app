type PromptCacheEntry = {
  systemPrompt: string;
  userPrompt: string;
  storedAt: number;
};

const cache = new Map<string, PromptCacheEntry>();

export function getCachedPromptContext(contextHash: string): PromptCacheEntry | null {
  return cache.get(contextHash) ?? null;
}

export function setCachedPromptContext(contextHash: string, entry: Omit<PromptCacheEntry, "storedAt">): void {
  cache.set(contextHash, { ...entry, storedAt: Date.now() });
}

export function resetPromptContextCache(): void {
  cache.clear();
}

export function buildPromptCacheKey(input: {
  capabilityId: string;
  capabilityVersion: string;
  contextHash: string;
}): string {
  return `${input.capabilityId}:${input.capabilityVersion}:${input.contextHash}`;
}
