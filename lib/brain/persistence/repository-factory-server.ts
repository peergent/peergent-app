import "server-only";

import type { BrainCapabilityProvider } from "../providers/provider-interface";
import { resolveBrainEnvironment } from "../context/resolve-environment";
import type { AsyncBrainRepositories } from "./contracts";
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
import { createLlmBrainProvider } from "../providers/llm-brain-provider";
import { isBrainUseOpenAIEnabled } from "../config/brain-feature-flags";
import type {
  BrainRunRepository,
  BrainOutputRepository,
  BrainAuditRepository,
  BrainIdempotencyRepository,
} from "../runtime/repositories/contracts";
import { BrainRuntimeError } from "../runtime/errors";
import { createSupabaseBrainRepositories } from "./supabase/create-supabase-repositories";
import type { BrainRepositoryBundle, CreateBrainRepositoriesInput } from "./repository-factory";
import { createServerBrainRuntime } from "./server/create-server-brain-runtime";

function createLiveCapabilityProvidersWithLlm(): readonly BrainCapabilityProvider[] {
  const providers: BrainCapabilityProvider[] = [];
  if (isBrainUseOpenAIEnabled()) {
    providers.push(createLlmBrainProvider());
  }
  providers.push(createDeterministicBrainProvider(), createDemoBrainProvider());
  return providers;
}

/** Server-only repository factory — registers LLM provider when env flag is enabled. */
export function createBrainRepositoriesForServer(
  input: CreateBrainRepositoriesInput
): BrainRepositoryBundle {
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
      createServerBrainRuntime({ supabase: input.supabase, mode: "supabase" });
      const async = createSupabaseBrainRepositories(input.supabase);
      return {
        storageMode: "supabase",
        sync,
        async,
        cache: new InMemoryBrainCacheStore(),
        providers: createLiveCapabilityProvidersWithLlm(),
      };
    }
    return {
      storageMode: "persistent_in_memory",
      sync,
      async: createPersistentInMemoryRepositories(),
      cache: new InMemoryBrainCacheStore(),
      providers: createLiveCapabilityProvidersWithLlm(),
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

function createDemoAsyncRepositories(sync: {
  runs: BrainRunRepository;
  outputs: BrainOutputRepository;
  audit: BrainAuditRepository;
  idempotency: BrainIdempotencyRepository;
}): AsyncBrainRepositories {
  const volatile = createPersistentInMemoryRepositories();
  void sync;
  return volatile;
}

export { resetPersistentBrainStores as resetBrainRepositoryStoresForServer };

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
