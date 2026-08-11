/**
 * Research Brain — provider registry.
 */

import type { ResearchProvider, ResearchProviderCapability } from "./research-provider";
import { createCompanyContextStubProvider } from "./providers/company-context-stub-provider";

export class ResearchProviderRegistry {
  private providers = new Map<string, ResearchProvider>();

  register(provider: ResearchProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): ResearchProvider | null {
    return this.providers.get(id) ?? null;
  }

  list(): readonly ResearchProvider[] {
    return [...this.providers.values()];
  }

  findByCapability(capability: ResearchProviderCapability): ResearchProvider[] {
    return this.list().filter((p) => p.capabilities.capabilities.includes(capability));
  }

  clear(): void {
    this.providers.clear();
  }
}

let defaultRegistry: ResearchProviderRegistry | null = null;

export function createDefaultResearchProviderRegistry(): ResearchProviderRegistry {
  const registry = new ResearchProviderRegistry();
  registry.register(createCompanyContextStubProvider());
  return registry;
}

export function getDefaultResearchProviderRegistry(): ResearchProviderRegistry {
  if (!defaultRegistry) {
    defaultRegistry = createDefaultResearchProviderRegistry();
  }
  return defaultRegistry;
}

export function resetDefaultResearchProviderRegistry(): void {
  defaultRegistry?.clear();
  defaultRegistry = null;
}
