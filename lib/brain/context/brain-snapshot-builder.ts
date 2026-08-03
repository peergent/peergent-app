import type { BrainSnapshot, BrainSnapshotRef } from "./snapshot";
import type { CompanySnapshot } from "../company/snapshot";
import type { ContextReadinessReport } from "./readiness";
import { emptyBrainSnapshotRef } from "./snapshot";

function refFromAvailable(
  available: boolean,
  refId?: string,
  summary?: string,
  capturedAt?: string
): BrainSnapshotRef {
  if (!available) return emptyBrainSnapshotRef();
  return { available: true, refId, summary, capturedAt };
}

/** Maps CompanySnapshot + campaign ref → BrainSnapshot for capability execution. */
export function buildBrainSnapshotFromCompany(input: {
  companySnapshot: CompanySnapshot;
  campaignRef?: { refId: string; summary?: string };
  readiness: ContextReadinessReport;
  assembledAt: string;
}): BrainSnapshot {
  const { companySnapshot: cs, assembledAt } = input;
  const profile = cs.profile;

  return {
    organization: refFromAvailable(true, cs.organizationId, profile.companyName.value ?? undefined, assembledAt),
    campaign: refFromAvailable(
      Boolean(input.campaignRef),
      input.campaignRef?.refId,
      input.campaignRef?.summary,
      assembledAt
    ),
    website: refFromAvailable(
      Boolean(cs.website),
      cs.website?.source.url,
      cs.website?.metadata.title,
      cs.website?.assembledAt
    ),
    brand: refFromAvailable(
      Boolean(profile.tone.value || profile.positioning.value),
      `brand:${cs.organizationId}`,
      profile.tone.value ?? undefined,
      profile.metadata.lastUpdatedAt ?? assembledAt
    ),
    business: refFromAvailable(
      Boolean(profile.products.value?.length || profile.services.value?.length),
      `business:${cs.organizationId}`,
      profile.industry.value ?? undefined,
      profile.metadata.lastUpdatedAt ?? assembledAt
    ),
    market: emptyBrainSnapshotRef(),
    knowledge: emptyBrainSnapshotRef(),
    memory: emptyBrainSnapshotRef(),
    performance: emptyBrainSnapshotRef(),
    workingAgreement: emptyBrainSnapshotRef(),
    tools: emptyBrainSnapshotRef(),
    knownFacts: cs.knownFacts.map((f) => ({
      id: f.id,
      label: f.label,
      value: f.value,
      provenance: f.provenance,
    })),
    assumptions: [],
    unknowns: [...cs.unknowns],
    sources: [...cs.sources],
    assembledAt,
  };
}
