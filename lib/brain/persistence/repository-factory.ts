import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainCacheStore } from "../cache/store";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { BrainEnvironment } from "../domain/environment";
import { resolveBrainEnvironment } from "../context/resolve-environment";
import type { AsyncBrainRepositories, RepositoryStorageMode } from "./contracts";
import {
  createPersistentInMemoryRepositories,
  resetPersistentBrainStores,
} from "./in-memory-persistent-repositories";
import { InMemoryBrainRunRepository } from "../runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "../runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "../runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "../runtime/repositories/in-memory-idempotency-repository";
import { InMemoryBrainCacheStore } from "../cache/store";
import { createDemoBrainProvider } from "../demo/demo-provider";
import { createDeterministicBrainProvider } from "../providers/deterministic-provider";
import type {
  BrainRunRepository,
  BrainOutputRepository,
  BrainAuditRepository,
  BrainIdempotencyRepository,
} from "../runtime/repositories/contracts";
import { BrainRuntimeError } from "../runtime/errors";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { createSupabaseBrainRepositories } from "./supabase/create-supabase-repositories";

export type BrainRepositoryBundle = {
  storageMode: RepositoryStorageMode;
  sync: {
    runs: BrainRunRepository;
    outputs: BrainOutputRepository;
    audit: BrainAuditRepository;
    idempotency: BrainIdempotencyRepository;
  };
  async: AsyncBrainRepositories;
  cache: BrainCacheStore;
  providers: readonly BrainCapabilityProvider[];
};

export type CreateBrainRepositoriesInput = {
  environment: BrainEnvironment;
  peerId?: string;
  supabase?: AppSupabaseClient | null;
};

export function resolveRepositoryStorageMode(input: CreateBrainRepositoriesInput): RepositoryStorageMode {
  const env = resolveBrainEnvironment({
    environment: input.environment,
    peerId: input.peerId,
  });
  if (env === "live") {
    return input.supabase ? "supabase" : "persistent_in_memory";
  }
  return "in_memory";
}

/** Client-safe live providers — LLM registration lives in repository-factory-server.ts. */
function createLiveCapabilityProviders(): readonly BrainCapabilityProvider[] {
  return [createDeterministicBrainProvider(), createDemoBrainProvider()];
}

/** Canonical repository factory — demo never selects live storage. */
export function createBrainRepositories(input: CreateBrainRepositoriesInput): BrainRepositoryBundle {
  const env = resolveBrainEnvironment({
    environment: input.environment,
    peerId: input.peerId,
  });

  const sync = {
    runs: new InMemoryBrainRunRepository(),
    outputs: new InMemoryBrainOutputRepository(),
    audit: new InMemoryBrainAuditRepository(),
    idempotency: new InMemoryBrainIdempotencyRepository(),
  };

  if (env === "demo") {
    return {
      storageMode: "in_memory",
      sync,
      async: createDemoAsyncRepositories(sync),
      cache: new InMemoryBrainCacheStore(),
      providers: [createDemoBrainProvider()],
    };
  }

  if (env === "live") {
    if (input.supabase) {
      const async = createSupabaseBrainRepositories(input.supabase);
      return {
        storageMode: "supabase",
        sync,
        async,
        cache: new InMemoryBrainCacheStore(),
        providers: createLiveCapabilityProviders(),
      };
    }
    return {
      storageMode: "persistent_in_memory",
      sync,
      async: createPersistentInMemoryRepositories(),
      cache: new InMemoryBrainCacheStore(),
      providers: createLiveCapabilityProviders(),
    };
  }

  return {
    storageMode: "in_memory",
    sync,
    async: createDemoAsyncRepositories(sync),
    cache: new InMemoryBrainCacheStore(),
    providers: [createDemoBrainProvider()],
  };
}

function createDemoAsyncRepositories(sync: BrainRepositoryBundle["sync"]): AsyncBrainRepositories {
  const volatile = createPersistentInMemoryRepositories();
  void sync;
  return volatile;
}

export function assertLiveNeverUsesDemoStorage(bundle: BrainRepositoryBundle): void {
  if (bundle.storageMode === "in_memory") {
    throw new BrainRuntimeError(
      "storage_isolation",
      "Live environment cannot use demo in-memory storage."
    );
  }
}

export function assertDemoNeverUsesLiveStorage(bundle: BrainRepositoryBundle): void {
  if (bundle.storageMode === "supabase" || bundle.storageMode === "persistent_in_memory") {
    throw new BrainRuntimeError(
      "storage_isolation",
      "Demo environment cannot use live persistent storage."
    );
  }
}

export function resetBrainRepositoryStores(): void {
  resetPersistentBrainStores();
}

export type BrainRuntimeFactoryContext = {
  environment: BrainEnvironment;
  peerId?: string;
  assembleContext: (
    request: BrainRunRequestWithBudget
  ) => Promise<ContextAssemblyResult> | ContextAssemblyResult;
};
