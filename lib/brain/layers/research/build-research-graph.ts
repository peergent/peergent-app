import type { BrainCapabilityId } from "../../capabilities/registry";
import type { CompanySnapshot } from "../../company/snapshot";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { BrainProvenanceRef } from "../../domain/provenance";
import { createResearchEvidence, brainConfidenceToScore } from "./evidence";
import { createResearchUnknown } from "./unknowns";
import type { ResearchEvidence, ResearchGraph, ResearchSourceKind, ResearchSwotNode } from "./types";
import { emptyResearchGraph, RESEARCH_CONFIDENCE } from "./types";

export type BuildResearchGraphInput = {
  companySnapshot: CompanySnapshot;
  campaignContext?: CampaignContext | null;
  upstreamOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  campaignId?: string;
  collectedAt?: string;
};

function provenanceToSource(ref: BrainProvenanceRef): {
  kind: ResearchSourceKind;
  refId: string;
  label?: string;
  capturedAt?: string;
} {
  const kindMap: Partial<Record<BrainProvenanceRef["kind"], ResearchSourceKind>> = {
    website: "website",
    website_extracted: "website",
    competitor: "competitor",
    company_profile: "company_profile",
    campaign_context: "campaign_context",
    customer_input: "customer",
    customer_confirmed: "customer",
    customer_entered: "customer",
    capability_output: "capability_output",
    memory: "memory",
    brand_brain: "brandbook",
    business_brain: "company_profile",
    integration: "api",
    document: "manual",
    demo_fixture: "manual",
  };
  return {
    kind: kindMap[ref.kind] ?? "manual",
    refId: ref.refId,
    label: ref.label,
    capturedAt: ref.capturedAt,
  };
}

function findingsToEvidence(
  output: BrainStructuredOutput | undefined,
  capabilityId: BrainCapabilityId,
  collectedAt: string
): ResearchEvidence[] {
  if (!output) return [];
  return output.findings.map((f) =>
    createResearchEvidence({
      id: `${capabilityId}:${f.id}`,
      title: f.label,
      description: f.value,
      source: {
        ...provenanceToSource(f.provenance[0] ?? { kind: "capability_output", refId: capabilityId }),
      },
      confidence: brainConfidenceToScore(f.confidence),
      collectedAt,
      version: output.capabilityVersion,
      validationStatus: "pending",
    })
  );
}

function warningsToUnknowns(
  output: BrainStructuredOutput | undefined,
  collectedAt: string
): ReturnType<typeof createResearchUnknown>[] {
  if (!output) return [];
  return output.warnings.map((w) =>
    createResearchUnknown({
      id: `warn:${w.code}`,
      title: w.code,
      reason: w.message,
      collectedAt,
    })
  );
}

function profileEvidence(snapshot: CompanySnapshot, collectedAt: string): ResearchEvidence[] {
  const profile = snapshot.profile;
  const orgId = snapshot.organizationId;
  const items: ResearchEvidence[] = [];

  const pushField = (id: string, title: string, value: string | null | undefined, confirmed: boolean) => {
    if (!value?.trim()) return;
    items.push(
      createResearchEvidence({
        id: `profile:${id}`,
        title,
        description: value,
        source: { kind: "company_profile", refId: `${id}:${orgId}` },
        confidence: confirmed ? RESEARCH_CONFIDENCE.websiteStatement : RESEARCH_CONFIDENCE.homepageInference,
        collectedAt,
      })
    );
  };

  pushField("companyName", "Company name", profile.companyName.value, profile.companyName.customerConfirmed);
  pushField("positioning", "Positioning", profile.positioning.value, profile.positioning.customerConfirmed);
  pushField("industry", "Industry", profile.industry.value, profile.industry.customerConfirmed);

  for (const product of profile.products.value ?? []) {
    items.push(
      createResearchEvidence({
        id: `product:${product.toLowerCase().replace(/\s+/g, "-")}`,
        title: "Product",
        description: product,
        source: { kind: "company_profile", refId: `products:${orgId}` },
        confidence: profile.products.customerConfirmed
          ? RESEARCH_CONFIDENCE.websiteStatement
          : RESEARCH_CONFIDENCE.homepageInference,
        collectedAt,
      })
    );
  }

  for (const service of profile.services.value ?? []) {
    items.push(
      createResearchEvidence({
        id: `service:${service.toLowerCase().replace(/\s+/g, "-")}`,
        title: "Service",
        description: service,
        source: { kind: "company_profile", refId: `services:${orgId}` },
        confidence: profile.services.customerConfirmed
          ? RESEARCH_CONFIDENCE.websiteStatement
          : RESEARCH_CONFIDENCE.homepageInference,
        collectedAt,
      })
    );
  }

  for (const audience of profile.targetAudiences.value ?? []) {
    items.push(
      createResearchEvidence({
        id: `audience:${audience.toLowerCase().replace(/\s+/g, "-")}`,
        title: "Target audience",
        description: audience,
        source: { kind: "company_profile", refId: `targetAudiences:${orgId}` },
        confidence: profile.targetAudiences.customerConfirmed
          ? RESEARCH_CONFIDENCE.websiteStatement
          : RESEARCH_CONFIDENCE.homepageInference,
        collectedAt,
      })
    );
  }

  return items;
}

function websiteOpportunitiesToSwot(
  snapshot: CompanySnapshot,
  collectedAt: string
): { opportunities: ResearchSwotNode[]; risks: ResearchSwotNode[] } {
  const website = snapshot.website;
  if (!website) return { opportunities: [], risks: [] };

  const opportunities: ResearchSwotNode[] = website.opportunities.map((o) => ({
    label: o.label,
    evidence: [
      createResearchEvidence({
        id: `website-opp:${o.id}`,
        title: o.label,
        description: o.recommendation ?? o.label,
        source: { kind: "website", refId: o.id, capturedAt: website.assembledAt },
        confidence: RESEARCH_CONFIDENCE.homepageInference,
        collectedAt,
      }),
    ],
  }));

  const risks: ResearchSwotNode[] = website.issues.map((issue) => ({
    label: issue.label,
    evidence: [
      createResearchEvidence({
        id: `website-issue:${issue.id}`,
        title: issue.label,
        description: issue.recommendation ?? issue.label,
        source: { kind: "website", refId: issue.id, capturedAt: website.assembledAt },
        confidence: RESEARCH_CONFIDENCE.homepageInference,
        collectedAt,
      }),
    ],
  }));

  return { opportunities, risks };
}

function snapshotUnknowns(snapshot: CompanySnapshot, collectedAt: string) {
  return snapshot.unknowns.map((key) =>
    createResearchUnknown({
      id: `snapshot-unknown:${key}`,
      title: key,
      reason: `Company profile lacks confirmed value for ${key}.`,
      collectedAt,
    })
  );
}

function campaignAudienceEvidence(
  campaign: CampaignContext | null | undefined,
  collectedAt: string
): ResearchEvidence[] {
  if (!campaign?.audience.trim()) return [];
  return [
    createResearchEvidence({
      id: `campaign-audience:${campaign.projectId}`,
      title: "Campaign audience",
      description: campaign.audience,
      source: { kind: "campaign_context", refId: campaign.projectId },
      confidence: RESEARCH_CONFIDENCE.websiteStatement,
      collectedAt,
    }),
  ];
}

function offerUnknownIfMissing(snapshot: CompanySnapshot, collectedAt: string) {
  const hasPricingSignal =
    snapshot.knownFacts.some((f) => /pric/i.test(f.label)) ||
    snapshot.website?.findings.some((f) => /pric/i.test(f.label));
  if (hasPricingSignal) return [];
  return [
    createResearchUnknown({
      id: "unknown-pricing-model",
      title: "Pricing model",
      reason: "Website and profile contain no pricing information.",
      collectedAt,
    }),
  ];
}

/**
 * Builds ResearchGraph from existing capability outputs and company snapshot.
 * Strangler: wraps Sprint 1–7 capabilities without changing their behaviour.
 */
export function buildResearchGraph(input: BuildResearchGraphInput): ResearchGraph {
  const collectedAt = input.collectedAt ?? new Date().toISOString();
  const upstream = input.upstreamOutputs ?? {};
  const orgId = input.companySnapshot.organizationId;
  const campaignId = input.campaignId ?? input.campaignContext?.projectId;

  const graph = emptyResearchGraph({
    organizationId: orgId,
    campaignId,
    collectedAt,
  });

  const companyFromCapability = findingsToEvidence(
    upstream.company_understanding,
    "company_understanding",
    collectedAt
  );
  const profileItems = profileEvidence(input.companySnapshot, collectedAt);

  const websiteFromCapability = findingsToEvidence(
    upstream.website_understanding,
    "website_understanding",
    collectedAt
  );
  const competitorFromCapability = findingsToEvidence(
    upstream.competitor_understanding,
    "competitor_understanding",
    collectedAt
  );
  const brandFromCapability = findingsToEvidence(
    upstream.brand_understanding,
    "brand_understanding",
    collectedAt
  );

  const productItems = profileItems.filter((e) => e.title === "Product");
  const serviceItems = profileItems.filter((e) => e.title === "Service");
  const audienceItems = [
    ...profileItems.filter((e) => e.title === "Target audience"),
    ...campaignAudienceEvidence(input.campaignContext, collectedAt),
  ];
  const companyItems = [
    ...companyFromCapability,
    ...profileItems.filter((e) => !["Product", "Service", "Target audience"].includes(e.title)),
  ];

  const swot = websiteOpportunitiesToSwot(input.companySnapshot, collectedAt);

  const unknowns = [
    ...snapshotUnknowns(input.companySnapshot, collectedAt),
    ...warningsToUnknowns(upstream.company_understanding, collectedAt),
    ...warningsToUnknowns(upstream.website_understanding, collectedAt),
    ...warningsToUnknowns(upstream.competitor_understanding, collectedAt),
    ...offerUnknownIfMissing(input.companySnapshot, collectedAt),
  ];

  if (productItems.length === 0) {
    unknowns.push(
      createResearchUnknown({
        id: "unknown-products",
        title: "Products",
        reason: "No confirmed product catalog in profile or research output.",
        collectedAt,
      })
    );
  }

  if (audienceItems.length === 0) {
    unknowns.push(
      createResearchUnknown({
        id: "unknown-audience",
        title: "Target audience",
        reason: "No confirmed audience in profile or campaign context.",
        collectedAt,
      })
    );
  }

  return {
    ...graph,
    company: companyItems,
    website: websiteFromCapability,
    products: productItems,
    services: serviceItems,
    competitors: competitorFromCapability,
    audience: audienceItems,
    brand: brandFromCapability,
    seo: [],
    market: [],
    offer: [],
    opportunities: swot.opportunities,
    risks: swot.risks,
    unknowns: dedupeUnknowns(unknowns),
  };
}

function dedupeUnknowns<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function researchGraphHasProvenance(graph: ResearchGraph): boolean {
  const allEvidence = [
    ...graph.company,
    ...graph.website,
    ...graph.products,
    ...graph.services,
    ...graph.competitors,
    ...graph.audience,
    ...graph.brand,
    ...graph.seo,
    ...graph.market,
    ...graph.offer,
    ...graph.strengths.flatMap((s) => s.evidence),
    ...graph.weaknesses.flatMap((s) => s.evidence),
    ...graph.opportunities.flatMap((s) => s.evidence),
    ...graph.risks.flatMap((s) => s.evidence),
  ];
  return allEvidence.every(
    (e) => e.source.refId.length > 0 && e.collectedAt.length > 0 && e.version.length > 0
  );
}
