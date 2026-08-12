import type { ContextSourceAdapter } from "./types";
import { organizationContextAdapter } from "./organization-adapter";
import { businessBrainContextAdapter } from "./business-brain-adapter";
import { companyDnaContextAdapter } from "./company-dna-adapter";
import { websiteIntelligenceContextAdapter } from "./website-intelligence-adapter";
import { peerContextAdapter } from "./peer-adapter";
import { projectContextAdapter } from "./project-adapter";
import { memoryContextAdapter } from "./memory-adapter";
import { intelligenceContextAdapter } from "./intelligence-adapter";

export const DEFAULT_CONTEXT_SOURCE_ADAPTERS: readonly ContextSourceAdapter[] = [
  organizationContextAdapter,
  peerContextAdapter,
  projectContextAdapter,
  businessBrainContextAdapter,
  companyDnaContextAdapter,
  websiteIntelligenceContextAdapter,
  intelligenceContextAdapter,
  memoryContextAdapter,
];

export function adaptersForRequirements(
  adapters: readonly ContextSourceAdapter[],
  categories: Set<string>
): ContextSourceAdapter[] {
  if (categories.size === 0) return [...adapters];
  return adapters.filter((adapter) =>
    adapter.categories.some((category) => categories.has(category))
  );
}
