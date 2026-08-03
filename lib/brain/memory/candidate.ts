import type { BrainConfidence } from "../domain/confidence";
import type { BrainProvenanceRef } from "../domain/provenance";

export type BrainMemoryScope =
  | "temporary"
  | "campaign"
  | "organization"
  | "peer"
  | "user";

export type BrainMemoryReviewState = "candidate" | "approved" | "rejected" | "expired";

/** Memory design contract — no persistence implementation in Sprint 1. */
export type BrainMemoryCandidate = {
  id: string;
  scope: BrainMemoryScope;
  organizationId: string;
  peerId?: string;
  campaignId?: string;
  userId?: string;
  label: string;
  value: string;
  provenance: readonly BrainProvenanceRef[];
  confidence: BrainConfidence;
  reviewState: BrainMemoryReviewState;
  expiresAt?: string;
  createdAt: string;
};

export function isMemoryExpired(candidate: BrainMemoryCandidate, now = new Date()): boolean {
  if (!candidate.expiresAt) return false;
  return Date.parse(candidate.expiresAt) <= now.getTime();
}
