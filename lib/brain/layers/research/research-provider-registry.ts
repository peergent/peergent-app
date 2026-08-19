/**
 * Research Brain — provider registry.
 */

import type { ResearchProvider } from "./research-provider";
import { createCompanyContextStubProvider } from "./providers/company-context-stub-provider";
import { createExternalWebResearchProvider } from "./providers/external-web-research-provider";
import { resolveResearchRuntimeConfig } from "./research-config";

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

  findByCapability(capability: import("./research-provider").ResearchProviderCapability): ResearchProvider[] {
    return this.list().filter((p) => p.capabilities.capabilities.includes(capability));
  }

  clear(): void {
    this.providers.clear();
  }
}

let defaultRegistry: ResearchProviderRegistry | null = null;

export function createDefaultResearchProviderRegistry(): ResearchProviderRegistry {
  const registry = new ResearchProviderRegistry();
  const config = resolveResearchRuntimeConfig();
  if (config.enableExternalFetch) {
    registry.register(createExternalWebResearchProvider());
  }
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
