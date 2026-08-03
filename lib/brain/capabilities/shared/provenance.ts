import type { BrainProvenanceRef } from "../../domain/provenance";
import type { CompanyFactSource } from "../../company/source-priority";

export function profileProvenance(
  organizationId: string,
  field: string,
  source?: CompanyFactSource
): BrainProvenanceRef {
  const kind: BrainProvenanceRef["kind"] = source
    ? (source as BrainProvenanceRef["kind"])
    : "company_profile";
  return { kind, refId: `${field}:${organizationId}`, label: field };
}

export function campaignProvenance(projectId: string, field: string): BrainProvenanceRef {
  return { kind: "campaign_context", refId: `${field}:${projectId}`, label: field };
}

export function upstreamProvenance(capabilityId: string, findingId: string): BrainProvenanceRef {
  return { kind: "capability_output", refId: `${capabilityId}:${findingId}`, label: capabilityId };
}

export function assumptionProvenance(label: string): BrainProvenanceRef {
  return { kind: "assumption", refId: `assumption:${label}`, label };
}
