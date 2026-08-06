import type { BrainCapabilityId } from "../../capabilities/registry";
import type { CompanySnapshot } from "../../company/snapshot";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { BrainFinding } from "../../evidence/structured-output";

import {
  brainConfidenceToBrandScore,
  createBrandResearchObservation,
  createBrandResearchUnknown,
} from "./evidence";
import type { BrandConceptId, BrandResearchGraph, BrandResearchObservation } from "./types";
import { BRAND_CONFIDENCE, BRAND_LAYER_VERSION, emptyBrandResearchGraph } from "./types";
import { ALL_BRAND_CONCEPT_IDS, getBrandConceptDefinition } from "./brand-concepts";

export type BuildBrandResearchGraphInput = {
  readonly companySnapshot: CompanySnapshot;
  readonly campaignContext?: CampaignContext | null;
  readonly upstreamOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  readonly campaignId?: string;
  readonly collectedAt?: string;
};

const FINDING_TO_CONCEPT: Readonly<Record<string, BrandConceptId>> = {
  Positionering: "messaging",
  Positioning: "messaging",
  "Tone of voice": "tone_of_voice",
  "Waardepropositie": "messaging",
  "Value proposition": "messaging",
  Brandbeloftes: "values",
  "Brand promises": "values",
};

function findingsToObservations(
  output: BrainStructuredOutput | undefined,
  capabilityId: BrainCapabilityId,
  collectedAt: string
) {
  if (!output?.findings?.length) return [];
  return output.findings.map((finding: BrainFinding) => {
    const concept = FINDING_TO_CONCEPT[finding.label] ?? "messaging";
    return createBrandResearchObservation({
      concept,
      title: finding.label,
      evidence: String(finding.value),
      source: {
        kind: "capability_output",
        refId: `${capabilityId}:${finding.id}`,
        label: capabilityId,
        capturedAt: output.generatedAt,
      },
      confidence: brainConfidenceToBrandScore(finding.confidence ?? "medium"),
      collectedAt,
    });
  });
}

function profileObservations(
  snapshot: CompanySnapshot,
  collectedAt: string
) {
  const orgId = snapshot.organizationId;
  const profile = snapshot.profile;
  const observations: BrandResearchObservation[] = [];

  if (profile.positioning.value) {
    observations.push(
      createBrandResearchObservation({
        concept: "messaging",
        title: "Positioning",
        evidence: profile.positioning.value,
        source: {
          kind: "company_profile",
          refId: `${orgId}:positioning`,
          label: profile.positioning.source ?? "company_profile",
        },
        confidence: profile.positioning.customerConfirmed
          ? BRAND_CONFIDENCE.customerConfirmed
          : BRAND_CONFIDENCE.profileInference,
        collectedAt,
      })
    );
  }

  if (profile.tone.value) {
    observations.push(
      createBrandResearchObservation({
        concept: "tone_of_voice",
        title: "Tone of voice",
        evidence: profile.tone.value,
        source: {
          kind: "company_profile",
          refId: `${orgId}:tone`,
          label: profile.tone.source ?? "company_profile",
        },
        confidence: profile.tone.customerConfirmed
          ? BRAND_CONFIDENCE.customerConfirmed
          : BRAND_CONFIDENCE.profileInference,
        collectedAt,
      })
    );
  }

  if (profile.mission?.value) {
    observations.push(
      createBrandResearchObservation({
        concept: "mission",
        title: "Mission",
        evidence: profile.mission.value,
        source: {
          kind: "company_profile",
          refId: `${orgId}:mission`,
          label: profile.mission.source ?? "company_profile",
        },
        confidence: profile.mission.customerConfirmed
          ? BRAND_CONFIDENCE.customerConfirmed
          : BRAND_CONFIDENCE.profileInference,
        collectedAt,
      })
    );
  }

  if (profile.brandPromises.value?.length) {
    observations.push(
      createBrandResearchObservation({
        concept: "values",
        title: "Brand promises",
        evidence: profile.brandPromises.value.join(" · "),
        source: {
          kind: "company_profile",
          refId: `${orgId}:brandPromises`,
          label: profile.brandPromises.source ?? "company_profile",
        },
        confidence: profile.brandPromises.customerConfirmed
          ? BRAND_CONFIDENCE.customerConfirmed
          : BRAND_CONFIDENCE.profileInference,
        collectedAt,
      })
    );
  }

  if (profile.targetAudiences.value?.length) {
    observations.push(
      createBrandResearchObservation({
        concept: "audience",
        title: "Target audience",
        evidence: profile.targetAudiences.value.join(" · "),
        source: {
          kind: "company_profile",
          refId: `${orgId}:targetAudiences`,
          label: profile.targetAudiences.source ?? "company_profile",
        },
        confidence: profile.targetAudiences.customerConfirmed
          ? BRAND_CONFIDENCE.customerConfirmed
          : BRAND_CONFIDENCE.profileInference,
        collectedAt,
      })
    );
  }

  return observations;
}

function campaignBrandObservations(
  campaignContext: CampaignContext | null | undefined,
  collectedAt: string
) {
  if (!campaignContext?.brandContext) return [];
  const ctx = campaignContext.brandContext;
  const projectId = campaignContext.projectId;
  const observations: BrandResearchObservation[] = [];

  const pushIf = (concept: BrandConceptId, title: string, value: string | undefined) => {
    if (!value?.trim()) return;
    observations.push(
      createBrandResearchObservation({
        concept,
        title,
        evidence: value.trim(),
        source: {
          kind: "campaign_context",
          refId: `${projectId}:${concept}`,
          label: "Campaign brand context",
          capturedAt: collectedAt,
        },
        confidence: BRAND_CONFIDENCE.customerConfirmed,
        collectedAt,
      })
    );
  };

  pushIf("mission", "Mission", ctx.mission);
  pushIf("values", "Values", ctx.uniqueSellingPoints?.join(" · "));
  pushIf("personality", "Personality", ctx.tone);
  pushIf("audience", "Audience", ctx.targetAudience);
  pushIf("tone_of_voice", "Tone of voice", ctx.tone);
  pushIf("messaging", "Positioning", ctx.positioning);

  if (ctx.industry) {
    pushIf("messaging", "Industry", ctx.industry);
  }

  return observations;
}

function websiteMessagingObservations(
  output: BrainStructuredOutput | undefined,
  collectedAt: string
) {
  if (!output?.findings?.length) return [];
  return output.findings
    .filter((f) =>
      /message|headline|cta|copy|tagline|hero/i.test(`${f.label} ${String(f.value)}`)
    )
    .map((finding) =>
      createBrandResearchObservation({
        concept: /cta/i.test(finding.label) ? "cta_style" : "messaging",
        title: finding.label,
        evidence: String(finding.value),
        source: {
          kind: "capability_output",
          refId: `website_understanding:${finding.id}`,
          label: "website_understanding",
          capturedAt: output.generatedAt,
        },
        confidence: brainConfidenceToBrandScore(finding.confidence ?? "medium"),
        collectedAt,
      })
    );
}

function conceptsWithoutObservations(
  observations: readonly { concept: BrandConceptId }[],
  collectedAt: string
) {
  const covered = new Set(observations.map((o) => o.concept));
  return ALL_BRAND_CONCEPT_IDS.filter((id) => !covered.has(id)).map((concept) =>
    createBrandResearchUnknown({
      concept,
      title: getBrandConceptDefinition(concept).label,
      reason: "No brand evidence collected for this concept yet.",
      collectedAt,
    })
  );
}

/**
 * Build Brand Research Graph — evidence only, no interpretation into truth.
 */
export function buildBrandResearchGraph(input: BuildBrandResearchGraphInput): BrandResearchGraph {
  const collectedAt = input.collectedAt ?? new Date().toISOString();
  const orgId = input.companySnapshot.organizationId;
  const campaignId = input.campaignId ?? input.campaignContext?.projectId;

  const graph = emptyBrandResearchGraph({
    organizationId: orgId,
    campaignId,
    collectedAt,
  });

  const upstream = input.upstreamOutputs ?? {};

  const observations = [
    ...profileObservations(input.companySnapshot, collectedAt),
    ...findingsToObservations(upstream.brand_understanding, "brand_understanding", collectedAt),
    ...campaignBrandObservations(input.campaignContext, collectedAt),
    ...websiteMessagingObservations(upstream.website_understanding, collectedAt),
  ];

  const unknowns = conceptsWithoutObservations(observations, collectedAt);

  return {
    ...graph,
    version: BRAND_LAYER_VERSION,
    observations,
    unknowns,
  };
}

export function brandResearchGraphHasProvenance(graph: BrandResearchGraph): boolean {
  return graph.observations.every(
    (obs) =>
      obs.source.refId.length > 0 &&
      obs.collectedAt.length > 0 &&
      obs.version.length > 0 &&
      obs.evidence.length > 0
  );
}
