/**
 * Repository-backed outputRef resolution — no in-process index dependency.
 */

import type { DurablePersistencePort } from "./durable-persistence-port";
import { resolveOutputRefFromStore } from "./persistent-repositories";
import { getActiveDurablePersistence } from "./active-durable-persistence";

export type ResolveBrainOutputRefInput = {
  organizationId: string;
  outputRef: string;
  projectId?: string;
};

export type ResolveBrainOutputRefResult = {
  found: boolean;
  payload: unknown | null;
  source: "durable" | "cache" | "none";
  brainId: string | null;
};

export async function resolveBrainOutputRef(
  input: ResolveBrainOutputRefInput,
  port?: DurablePersistencePort | null
): Promise<ResolveBrainOutputRefResult> {
  const durable = port ?? getActiveDurablePersistence();
  if (durable) {
    const resolved = await durable.resolveOutputRef(input);
    if (resolved.found) {
      return {
        found: true,
        payload: resolved.payload,
        source: "durable",
        brainId: resolved.brainId,
      };
    }
  }

  const cached = resolveOutputRefFromStore(input.organizationId, input.outputRef);
  if (cached) {
    return { found: true, payload: cached, source: "cache", brainId: null };
  }

  return { found: false, payload: null, source: "none", brainId: null };
}
