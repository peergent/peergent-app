/**
 * Research Brain — freshness tracking.
 * Research evidence is time-sensitive; company facts may be stable.
 */

import type { ResearchFreshnessStatus } from "./brain-types";

export function freshnessFromDates(input: {
  capturedAt: string;
  validUntil?: string | null;
  maxAgeDays?: number;
  now?: Date;
}): ResearchFreshnessStatus {
  const now = input.now ?? new Date();
  const captured = new Date(input.capturedAt);
  if (Number.isNaN(captured.getTime())) return "unknown";

  if (input.validUntil) {
    const validUntil = new Date(input.validUntil);
    if (!Number.isNaN(validUntil.getTime()) && now > validUntil) return "expired";
  }

  const maxAgeDays = input.maxAgeDays ?? 90;
  const ageMs = now.getTime() - captured.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= maxAgeDays * 0.5) return "fresh";
  if (ageDays <= maxAgeDays) return "stale";
  return "expired";
}

export function computeValidUntil(capturedAt: string, maxAgeDays: number): string {
  const date = new Date(capturedAt);
  date.setDate(date.getDate() + maxAgeDays);
  return date.toISOString();
}

export function isFreshEnough(
  status: ResearchFreshnessStatus,
  requirement: "fresh" | "stale_ok"
): boolean {
  if (requirement === "stale_ok") {
    return status === "fresh" || status === "stale";
  }
  return status === "fresh";
}
