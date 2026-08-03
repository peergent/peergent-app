import type { BrainProvenanceRef } from "../domain/provenance";
import type { CompanyProfile } from "./profile";
import type { CustomerCorrection } from "./corrections";
import type { WebsiteSnapshot } from "../website/types";

/** Immutable assembled company intelligence — org-level, campaigns reference. */
export type CompanySnapshot = {
  organizationId: string;
  profile: CompanyProfile;
  website: WebsiteSnapshot | null;
  knownFacts: readonly { id: string; label: string; value: string; provenance: BrainProvenanceRef }[];
  unknowns: readonly string[];
  sources: readonly BrainProvenanceRef[];
  assembledAt: string;
};

export type CompanySnapshotBuilderInput = {
  organizationId: string;
  companyProfile?: CompanyProfile | null;
  businessBrainAvailable?: boolean;
  brandBrainAvailable?: boolean;
  websiteSnapshot?: WebsiteSnapshot | null;
  campaignDescription?: string | null;
  campaignAudience?: string | null;
  corrections?: readonly CustomerCorrection[];
  assembledAt?: string;
};

export type CompanySnapshotBuilderResult = {
  snapshot: CompanySnapshot;
  readiness: "ready" | "partial" | "unknown";
};
