import type { ExecutionProviderAdapter } from "./execution-provider-adapter";
import {
  calendarStubAdapter,
  cmsStubAdapter,
  crmStubAdapter,
  emailStubAdapter,
  genericStubAdapter,
  googleAdsStubAdapter,
  linkedInStubAdapter,
  metaStubAdapter,
} from "./adapters/stub-adapters";
import type { ExecutionProviderId, ProviderHealthStatus } from "./types";

export type ProviderRegistryEntry = {
  adapter: ExecutionProviderAdapter;
  defaultHealth: ProviderHealthStatus;
  configRef: string | null;
};

const DEFAULT_ENTRIES: readonly ProviderRegistryEntry[] = [
  { adapter: linkedInStubAdapter, defaultHealth: "healthy", configRef: "config:linkedin:demo" },
  { adapter: metaStubAdapter, defaultHealth: "healthy", configRef: "config:meta:demo" },
  { adapter: googleAdsStubAdapter, defaultHealth: "healthy", configRef: "config:google_ads:demo" },
  { adapter: emailStubAdapter, defaultHealth: "healthy", configRef: "config:email:demo" },
  { adapter: cmsStubAdapter, defaultHealth: "healthy", configRef: "config:cms:demo" },
  { adapter: crmStubAdapter, defaultHealth: "degraded", configRef: "config:crm:demo" },
  { adapter: calendarStubAdapter, defaultHealth: "healthy", configRef: "config:calendar:demo" },
  { adapter: genericStubAdapter, defaultHealth: "healthy", configRef: "config:stub:demo" },
];

/** Registry of provider adapters — Execution Brain contains zero provider-specific logic. */
export class ExecutionProviderRegistry {
  private entries = new Map<ExecutionProviderId, ProviderRegistryEntry>();

  constructor(seed: readonly ProviderRegistryEntry[] = DEFAULT_ENTRIES) {
    for (const entry of seed) {
      this.entries.set(entry.adapter.providerId, entry);
    }
  }

  register(entry: ProviderRegistryEntry): void {
    this.entries.set(entry.adapter.providerId, entry);
  }

  get(providerId: ExecutionProviderId): ProviderRegistryEntry | null {
    return this.entries.get(providerId) ?? null;
  }

  resolve(providerId: ExecutionProviderId): ExecutionProviderAdapter {
    const entry = this.get(providerId);
    if (!entry) return genericStubAdapter;
    return entry.adapter;
  }

  health(
    providerId: ExecutionProviderId,
    override?: ProviderHealthStatus
  ): ProviderHealthStatus {
    if (override) return override;
    return this.get(providerId)?.defaultHealth ?? "healthy";
  }

  configRef(providerId: ExecutionProviderId): string | null {
    return this.get(providerId)?.configRef ?? null;
  }

  list(): readonly ProviderRegistryEntry[] {
    return [...this.entries.values()];
  }
}

let defaultRegistry: ExecutionProviderRegistry | null = null;

export function getDefaultExecutionProviderRegistry(): ExecutionProviderRegistry {
  if (!defaultRegistry) defaultRegistry = new ExecutionProviderRegistry();
  return defaultRegistry;
}

export function resetDefaultExecutionProviderRegistry(): void {
  defaultRegistry = null;
}

export function createExecutionProviderRegistry(
  entries?: readonly ProviderRegistryEntry[]
): ExecutionProviderRegistry {
  return new ExecutionProviderRegistry(entries);
}
