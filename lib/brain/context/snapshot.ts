import type { BrainProvenanceRef } from "../domain/provenance";

/** Lightweight reference to an upstream context slice — never embed huge payloads. */
export type BrainSnapshotRef = {
  available: boolean;
  refId?: string;
  summary?: string;
  capturedAt?: string;
};

export type BrainSnapshotFact = {
  id: string;
  label: string;
  value: string;
  provenance: BrainProvenanceRef;
};

/**
 * Normalized immutable context gathered before capability execution.
 * References organization knowledge systems; does not duplicate business-brain or brand-brain stores.
 */
export type BrainSnapshot = {
  readonly organization: BrainSnapshotRef;
  readonly campaign: BrainSnapshotRef;
  readonly website: BrainSnapshotRef;
  readonly brand: BrainSnapshotRef;
  readonly business: BrainSnapshotRef;
  readonly market: BrainSnapshotRef;
  readonly knowledge: BrainSnapshotRef;
  readonly memory: BrainSnapshotRef;
  readonly performance: BrainSnapshotRef;
  readonly workingAgreement: BrainSnapshotRef;
  readonly tools: BrainSnapshotRef;
  readonly knownFacts: readonly BrainSnapshotFact[];
  readonly assumptions: readonly BrainSnapshotFact[];
  readonly unknowns: readonly string[];
  readonly sources: readonly BrainProvenanceRef[];
  readonly assembledAt: string;
};

export function emptyBrainSnapshotRef(): BrainSnapshotRef {
  return { available: false };
}

export function emptyBrainSnapshot(assembledAt: string): BrainSnapshot {
  return {
    organization: emptyBrainSnapshotRef(),
    campaign: emptyBrainSnapshotRef(),
    website: emptyBrainSnapshotRef(),
    brand: emptyBrainSnapshotRef(),
    business: emptyBrainSnapshotRef(),
    market: emptyBrainSnapshotRef(),
    knowledge: emptyBrainSnapshotRef(),
    memory: emptyBrainSnapshotRef(),
    performance: emptyBrainSnapshotRef(),
    workingAgreement: emptyBrainSnapshotRef(),
    tools: emptyBrainSnapshotRef(),
    knownFacts: [],
    assumptions: [],
    unknowns: [],
    sources: [],
    assembledAt,
  };
}
