import "server-only";

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { ensureServerBrainRuntime } from "./ensure-server-brain-runtime";
import type { ServerBrainRuntime } from "./create-server-brain-runtime";

export type PrepareBrainServerPersistenceInput = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId?: string;
};

/**
 * Canonical pre-flight for live Brain server paths — configure Supabase persistence
 * and hydrate scoped durable state before any layer repository reads/writes.
 */
export async function prepareBrainServerPersistence(
  input: PrepareBrainServerPersistenceInput
): Promise<ServerBrainRuntime> {
  return ensureServerBrainRuntime({
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
    mode: "supabase",
  });
}
