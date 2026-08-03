import type { BrainSnapshot, BrainSnapshotRef } from "../context/snapshot";
import type { BrainSnapshotSliceKey } from "../capabilities/registry";
import type { BrainContextProjection } from "../providers/token-strategy";
import { hashContextSlices } from "../providers/token-strategy";
import type { CompanySnapshot } from "../company/snapshot";

export type ProjectedBrainContext = {
  snapshot: BrainSnapshot;
  projection: BrainContextProjection;
  companySnapshot: CompanySnapshot;
};

function estimateTokensForSlice(slice: BrainSnapshotSliceKey, snapshot: BrainSnapshot): number {
  const refSlices: BrainSnapshotSliceKey[] = [
    "organization",
    "campaign",
    "website",
    "brand",
    "business",
    "market",
    "knowledge",
    "memory",
    "performance",
    "workingAgreement",
    "tools",
  ];
  if (refSlices.includes(slice)) {
    return snapshot[slice].available ? 120 : 0;
  }
  return 0;
}

function refSummary(ref: BrainSnapshotRef): string {
  return ref.summary ?? ref.refId ?? "";
}

/** Projects only required context slices — never sends full snapshot automatically. */
export function projectBrainContext(input: {
  fullSnapshot: BrainSnapshot;
  companySnapshot: CompanySnapshot;
  requiredSlices: readonly BrainSnapshotSliceKey[];
  optionalSlices?: readonly BrainSnapshotSliceKey[];
  includeKnownFacts?: boolean;
  includeUnknowns?: boolean;
}): ProjectedBrainContext {
  const includeKnownFacts = input.includeKnownFacts ?? true;
  const includeUnknowns = input.includeUnknowns ?? true;
  const requested = new Set<BrainSnapshotSliceKey>([
    ...input.requiredSlices,
    ...(input.optionalSlices ?? []),
  ]);

  const sliceKeys = [...requested];
  const includedSlices: string[] = [];
  const excludedSlices: string[] = [];
  let estimatedTokens = 0;

  const refSlices: BrainSnapshotSliceKey[] = [
    "organization",
    "campaign",
    "website",
    "brand",
    "business",
    "market",
    "knowledge",
    "memory",
    "performance",
    "workingAgreement",
    "tools",
  ];

  const pickRef = (slice: (typeof refSlices)[number]): BrainSnapshotRef =>
    requested.has(slice) ? input.fullSnapshot[slice] : { available: false };

  for (const slice of refSlices) {
    if (requested.has(slice)) {
      includedSlices.push(slice);
      estimatedTokens += estimateTokensForSlice(slice, input.fullSnapshot);
    } else {
      excludedSlices.push(slice);
    }
  }

  const knownFacts = includeKnownFacts ? input.fullSnapshot.knownFacts : [];
  const unknowns = includeUnknowns ? input.fullSnapshot.unknowns : [];
  if (includeKnownFacts) {
    includedSlices.push("knownFacts");
    estimatedTokens += knownFacts.length * 40;
  } else {
    excludedSlices.push("knownFacts");
  }
  if (includeUnknowns) {
    includedSlices.push("unknowns");
    estimatedTokens += unknowns.length * 20;
  } else {
    excludedSlices.push("unknowns");
  }

  const contextHash = hashContextSlices([
    ...sliceKeys.map((s) => `${s}:${refSummary(input.fullSnapshot[s])}`),
    includeKnownFacts ? `facts:${knownFacts.length}` : "facts:0",
    includeUnknowns ? `unknowns:${unknowns.length}` : "unknowns:0",
    input.companySnapshot.assembledAt,
  ]);

  const snapshot: BrainSnapshot = {
    organization: pickRef("organization"),
    campaign: pickRef("campaign"),
    website: pickRef("website"),
    brand: pickRef("brand"),
    business: pickRef("business"),
    market: pickRef("market"),
    knowledge: pickRef("knowledge"),
    memory: pickRef("memory"),
    performance: pickRef("performance"),
    workingAgreement: pickRef("workingAgreement"),
    tools: pickRef("tools"),
    knownFacts,
    assumptions: [],
    unknowns,
    sources: input.fullSnapshot.sources,
    assembledAt: input.fullSnapshot.assembledAt,
  };

  return {
    snapshot,
    companySnapshot: input.companySnapshot,
    projection: {
      contextHash,
      includedSlices,
      excludedSlices,
      estimatedTokens,
    },
  };
}

export function buildCacheKeyParts(input: {
  organizationId: string;
  capabilityId: string;
  contextHash: string;
  payloadHash: string;
  providerId: string;
  capabilityVersion: string;
  freshness: string;
}): string {
  return [
    input.organizationId,
    input.capabilityId,
    input.contextHash,
    input.payloadHash,
    input.providerId,
    input.capabilityVersion,
    input.freshness,
  ].join(":");
}
