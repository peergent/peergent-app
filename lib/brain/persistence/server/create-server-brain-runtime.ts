import "server-only";

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { LayerRepositoryBundle } from "../layer-repository-factory";
import {
  configureLayerRepositories,
  createLayerRepositories,
} from "../layer-repository-factory";
import type { DurablePersistencePort } from "../layer/durable-persistence-port";
import { createDurablePersistence } from "../layer/create-durable-persistence";
import {
  assertProductionPersistenceMode,
  requireSupabaseClientForMode,
  resolveBrainPersistenceMode,
  type BrainPersistenceMode,
} from "./persistence-config";
import { emitPersistenceDiagnostic } from "../layer/persistence-diagnostics";
import {
  getActiveDurablePersistence,
  resetActiveDurablePersistence,
  setActiveDurablePersistence,
} from "../layer/active-durable-persistence";

export type ServerBrainRuntime = {
  mode: BrainPersistenceMode;
  repositories: LayerRepositoryBundle;
  durable: DurablePersistencePort | null;
  supabase: AppSupabaseClient | null;
};

let activeRuntime: ServerBrainRuntime | null = null;

export function getActiveServerBrainRuntime(): ServerBrainRuntime | null {
  return activeRuntime;
}

export function getActiveSupabaseClient(): AppSupabaseClient | null {
  return activeRuntime?.supabase ?? null;
}

export { getActiveDurablePersistence };

export function createServerBrainRuntime(input: {
  supabase?: AppSupabaseClient | null;
  mode?: BrainPersistenceMode;
}): ServerBrainRuntime {
  const mode = input.mode ?? resolveBrainPersistenceMode();
  assertProductionPersistenceMode(mode);
  requireSupabaseClientForMode(mode, input.supabase);

  const repositories = createLayerRepositories({ mode, supabase: input.supabase ?? null });
  configureLayerRepositories({ mode, supabase: input.supabase ?? null });

  const durable = createDurablePersistence({ mode, supabase: input.supabase ?? null });

  activeRuntime = { mode, repositories, durable, supabase: input.supabase ?? null };
  setActiveDurablePersistence(durable);

  emitPersistenceDiagnostic({
    event: "persistence_initialized",
    message: mode,
  });

  return activeRuntime;
}

export function resetServerBrainRuntimeForTests(): void {
  activeRuntime = null;
  resetActiveDurablePersistence();
}
