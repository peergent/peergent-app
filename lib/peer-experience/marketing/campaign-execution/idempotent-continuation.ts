import type { CampaignContinuationResult } from "../campaign-continuation/types";

import { loadDurableCampaignExecutionState, patchDurableCampaignExecutionState } from "./durable-campaign-state-store";

const inFlightPromises = new Map<string, Promise<CampaignContinuationResult>>();

export function getCachedContinuationResult(
  peerId: string,
  idempotencyKey: string
): CampaignContinuationResult | null {
  const durable = loadDurableCampaignExecutionState(peerId);
  const cached = durable.continuationResultsByKey[idempotencyKey];
  if (!cached) return null;
  return {
    ok: cached.ok,
    projectId: "",
    completedWorkUnits: [],
    stopReason: cached.stopReason as CampaignContinuationResult["stopReason"],
    stopMessage: cached.stopMessage,
    iterations: cached.iterations,
  };
}

export function cacheContinuationResult(
  peerId: string,
  projectId: string,
  idempotencyKey: string,
  result: CampaignContinuationResult
): void {
  const durable = loadDurableCampaignExecutionState(peerId);
  patchDurableCampaignExecutionState(peerId, {
    continuationResultsByKey: {
      ...durable.continuationResultsByKey,
      [idempotencyKey]: {
        completedAt: new Date().toISOString(),
        ok: result.ok,
        stopReason: result.stopReason,
        stopMessage: result.stopMessage,
        iterations: result.iterations,
      },
    },
  });

  const normalized: CampaignContinuationResult = { ...result, projectId };
  inFlightPromises.delete(idempotencyKey);
}

export function acquireContinuationLock(
  idempotencyKey: string,
  factory: () => Promise<CampaignContinuationResult>
): Promise<CampaignContinuationResult> {
  const existing = inFlightPromises.get(idempotencyKey);
  if (existing) {
    return existing;
  }

  const promise = factory().finally(() => {
    inFlightPromises.delete(idempotencyKey);
  });
  inFlightPromises.set(idempotencyKey, promise);
  return promise;
}

export function clearContinuationLocksForTests(): void {
  inFlightPromises.clear();
}

export function isContinuationInFlight(idempotencyKey: string): boolean {
  return inFlightPromises.has(idempotencyKey);
}
