/**
 * Company Brain — canonical types.
 * PX-40. Single source of organizational truth — never campaigns, validation, or execution.
 */

import type { CompanySnapshot } from "../../company/snapshot";

export const COMPANY_LAYER_VERSION = "1.0.0";

export type CompanyConfidence = "low" | "medium" | "high";

export type CompanyFreshness = "fresh" | "stale" | "unknown";

/** Structured domain identifiers — organizational knowledge categories. */
export type CompanyDomainId =
  | "organization"
  | "business"
  | "brand"
  | "products"
  | "services"
  | "markets"
  | "industry"
  | "mission"
  | "vision"
  | "core_values"
  | "tone_of_voice"
  | "writing_style"
  | "brand_rules"
  | "visual_identity"
  | "audience"
  | "ideal_customers"
  | "business_goals"
  | "usps"
  | "differentiators"
  | "competitive_position"
  | "policies"
  | "legal_constraints"
  | "compliance"
  | "integrations"
  | "locations"
  | "languages"
  | "website"
  | "knowledge_sources";

export type CompanyKnowledgeSourceKind =
  | "website"
  | "brandbook"
  | "uploaded_pdf"
  | "crm"
  | "erp"
  | "manual_entry"
  | "business_profile"
  | "customer_configuration"
  | "future_connector";

export type CompanyKnowledgeSource = {
  readonly id: string;
  readonly kind: CompanyKnowledgeSourceKind;
  readonly refId: string;
  readonly label: string;
  readonly capturedAt: string;
};

export type CompanyEvidence = {
  readonly id: string;
  readonly sourceId: string;
  readonly summary: string;
  readonly capturedAt: string;
};

/** Every organizational fact — confidence, source, evidence required. */
export type CompanyFact = {
  readonly id: string;
  readonly domain: CompanyDomainId;
  readonly key: string;
  readonly title: string;
  readonly value: string;
  readonly confidence: CompanyConfidence;
  readonly sourceIds: readonly string[];
  readonly evidence: readonly CompanyEvidence[];
  readonly freshness: CompanyFreshness;
  readonly lastValidated: string | null;
  readonly customerConfirmed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CompanyRelationKind =
  | "belongs_to"
  | "depends_on"
  | "supports"
  | "contradicts"
  | "derived_from"
  | "related_to"
  | "supersedes";

export type CompanyRelation = {
  readonly id: string;
  readonly fromFactId: string;
  readonly toFactId: string;
  readonly kind: CompanyRelationKind;
  readonly reason: string;
};

export type CompanyNode = {
  readonly id: string;
  readonly domain: CompanyDomainId;
  readonly label: string;
  readonly factIds: readonly string[];
  readonly layerOrder: number;
};

export type CompanyVersion = {
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: string;
  readonly source: string;
  readonly changeReason: string;
};

export type CompanyGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly versionMeta: CompanyVersion;
  readonly sources: readonly CompanyKnowledgeSource[];
  readonly facts: readonly CompanyFact[];
  readonly nodes: readonly CompanyNode[];
  readonly relations: readonly CompanyRelation[];
  readonly confidence: CompanyConfidence;
  readonly unknownDomains: readonly CompanyDomainId[];
};

export type CompanyGraphSnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly version: number;
  readonly graph: CompanyGraph;
  readonly outputRef: string;
  readonly storedAt: string;
};

export type CompanyHistoryEntry = {
  readonly version: number;
  readonly snapshotId: string;
  readonly createdAt: string;
  readonly author: string;
  readonly changeReason: string;
};

export type CompanyHistory = {
  readonly organizationId: string;
  readonly entries: readonly CompanyHistoryEntry[];
};

export type CompanyOutput = {
  readonly graph: CompanyGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
  readonly snapshot: CompanyGraphSnapshot;
};

export type CompanyBrainInput = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly episodeId?: string;
  readonly locale?: "nl" | "en";
  readonly companySnapshot: CompanySnapshot;
  readonly brandGraph?: import("../brand/types").BrandGraph | null;
  readonly knowledgeSources?: readonly CompanyKnowledgeSource[];
  readonly integrations?: readonly { id: string; provider: string; status: string; configRef: string }[];
  readonly author?: string;
  readonly changeReason?: string;
  readonly correlationId?: string;
};

export type CompanyBrainOutput = CompanyOutput;

export type CompanyBrainPayload = Omit<
  CompanyBrainInput,
  "organizationId" | "episodeId" | "locale"
> & {
  readonly companySnapshot?: CompanySnapshot | null;
};

export type { CompanySnapshot };
