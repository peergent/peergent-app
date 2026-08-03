/** Freshness state for company profile, website snapshot, brand, market. */
export type FreshnessState = "fresh" | "stale" | "expired" | "invalid" | "unknown";

export type FreshnessMetadata = {
  freshness: FreshnessState;
  lastUpdatedAt: string | null;
  expiresAt?: string | null;
};

export function resolveFreshness(
  lastUpdatedAt: string | null,
  ttlMs?: number,
  now = Date.now()
): FreshnessState {
  if (!lastUpdatedAt) return "unknown";
  const updated = Date.parse(lastUpdatedAt);
  if (Number.isNaN(updated)) return "unknown";
  if (!ttlMs) return "fresh";
  const age = now - updated;
  if (age > ttlMs * 2) return "expired";
  if (age > ttlMs) return "stale";
  return "fresh";
}
