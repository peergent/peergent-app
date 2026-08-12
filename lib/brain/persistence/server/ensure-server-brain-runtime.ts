import "server-only";

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import {
  createServerBrainRuntime,
  getActiveServerBrainRuntime,
  type ServerBrainRuntime,
} from "./create-server-brain-runtime";
import { PersistenceInfrastructureError } from "./persistence-config";
import { emitPersistenceDiagnostic } from "../layer/persistence-diagnostics";

export type EnsureServerBrainRuntimeInput = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId?: string;
  mode?: "supabase";
};

/** Canonical server entry — configure Supabase persistence and hydrate when project scoped. */
export async function ensureServerBrainRuntime(
  input: EnsureServerBrainRuntimeInput
): Promise<ServerBrainRuntime> {
  const runtime =
    getActiveServerBrainRuntime()?.mode === "supabase"
      ? getActiveServerBrainRuntime()!
      : createServerBrainRuntime({ supabase: input.supabase, mode: input.mode ?? "supabase" });

  if (!runtime.durable) {
    throw new PersistenceInfrastructureError(
      "Durable persistence port unavailable after server initialization.",
      "persistence_unavailable"
    );
  }

  if (input.projectId) {
    try {
      await runtime.durable.hydrateProject({
        organizationId: input.organizationId,
        projectId: input.projectId,
      });
    } catch (error) {
      emitPersistenceDiagnostic({
        event: "persistence_hydration_failed",
        organizationId: input.organizationId,
        projectId: input.projectId,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  } else {
    await runtime.durable.hydrateOrganizationMemory(input.organizationId);
  }

  return runtime;
}
