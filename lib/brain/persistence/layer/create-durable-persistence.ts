/**
 * Factory for durable persistence port by mode.
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { DurablePersistencePort } from "./durable-persistence-port";
import { createSimulatedDurablePersistence } from "./simulated-durable-persistence";
import { createSupabaseDurablePersistence } from "./supabase-durable-persistence";
import type { BrainPersistenceMode } from "../server/persistence-config";

export function createDurablePersistence(input: {
  mode: BrainPersistenceMode;
  supabase?: AppSupabaseClient | null;
}): DurablePersistencePort | null {
  if (input.mode === "in_memory") return null;
  if (input.mode === "persistent_in_memory") {
    return createSimulatedDurablePersistence();
  }
  if (input.mode === "supabase" && input.supabase) {
    return createSupabaseDurablePersistence(input.supabase);
  }
  return null;
}
