/**
 * Brain persistence mode configuration — fail-closed in production.
 */

import type { LayerRepositoryStorageMode } from "../layer-repository-factory";

export type BrainPersistenceMode = LayerRepositoryStorageMode;

export class PersistenceConfigurationError extends Error {
  readonly code =
    "persistence_configuration_error" as const;

  constructor(message: string) {
    super(message);
    this.name = "PersistenceConfigurationError";
  }
}

export class PersistenceInfrastructureError extends Error {
  readonly code =
    "persistence_infrastructure_error" as const;

  constructor(
    message: string,
    readonly causeCode?: string
  ) {
    super(message);
    this.name = "PersistenceInfrastructureError";
  }
}

export class PersistenceConflictError extends Error {
  readonly code = "persistence_conflict" as const;

  constructor(
    message: string,
    readonly expectedVersion: number,
    readonly actualVersion: number
  ) {
    super(message);
    this.name = "PersistenceConflictError";
  }
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Resolve persistence mode from environment. Production requires explicit supabase. */
export function resolveBrainPersistenceMode(): BrainPersistenceMode {
  const explicit = process.env.BRAIN_PERSISTENCE_MODE?.trim() as BrainPersistenceMode | undefined;
  if (explicit === "in_memory" || explicit === "persistent_in_memory" || explicit === "supabase") {
    if (isProductionRuntime() && explicit !== "supabase") {
      throw new PersistenceConfigurationError(
        `Production requires BRAIN_PERSISTENCE_MODE=supabase (got ${explicit}).`
      );
    }
    return explicit;
  }

  if (isProductionRuntime()) {
    return "supabase";
  }

  if (process.env.BRAIN_PERSISTENCE_MODE === "supabase") {
    return "supabase";
  }

  return process.env.VITEST === "true" ? "in_memory" : "persistent_in_memory";
}

export function assertProductionPersistenceMode(mode: BrainPersistenceMode): void {
  if (isProductionRuntime() && mode !== "supabase") {
    throw new PersistenceConfigurationError(
      "Production server attempted to initialize non-Supabase Brain persistence."
    );
  }
}

export function requireSupabaseClientForMode(
  mode: BrainPersistenceMode,
  supabase: unknown
): void {
  if (mode === "supabase" && !supabase) {
    throw new PersistenceInfrastructureError(
      "Supabase client required for supabase persistence mode.",
      "persistence_unavailable"
    );
  }
}
