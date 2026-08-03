import type { FreshnessState } from "../domain/freshness";
import { resolveFreshness } from "../domain/freshness";

export type FreshnessResolverInput = {
  lastUpdatedAt: string | null;
  ttlMs?: number;
  invalidated?: boolean;
  now?: number;
};

/** Resolves freshness including invalid state from dependency graph. */
export function resolveContextFreshness(input: FreshnessResolverInput): FreshnessState {
  if (input.invalidated) return "invalid";
  return resolveFreshness(input.lastUpdatedAt ?? null, input.ttlMs, input.now);
}
