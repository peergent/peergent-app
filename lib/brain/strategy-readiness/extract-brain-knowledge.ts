import type { CompanyDomainId, CompanyGraph } from "../layers/company/types";
import type { CompanyProfile } from "../company/profile";
import type { CompanyProfileField } from "../company/source-priority";
import type { ResearchBrainGraph } from "../layers/research/brain-types";
import type { MarketingIntelligenceBrainGraph } from "../layers/marketing-intelligence/brain-types";
import type { WebsiteSnapshot } from "../website/types";
import type { CampaignCompetitorEntry } from "@/lib/office/campaign/campaign-context";

function profileString(
  field: CompanyProfileField<string | null> | undefined
): string | null {
  const value = field?.value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function profileList(
  field: CompanyProfileField<readonly string[]> | undefined
): readonly string[] {
  return (field?.value ?? []).map((entry) => entry.trim()).filter(Boolean);
}

function factValues(graph: CompanyGraph | null | undefined, domain: CompanyDomainId): readonly string[] {
  if (!graph) return [];
  return graph.facts
    .filter((fact) => fact.domain === domain && fact.value.trim())
    .map((fact) => fact.value.trim());
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter(Boolean))];
}

export function deriveTargetAudience(input: {
  explicitAudience: string;
  brandTargetAudience?: string | null;
  profile?: CompanyProfile | null;
  research?: ResearchBrainGraph | null;
  marketingIntelligence?: MarketingIntelligenceBrainGraph | null;
  inflightAudience?: string | null;
  capabilityAudience?: string | null;
  inferredAudience?: string | null;
}): {
  value: string | null;
  source:
    | "explicit_campaign"
    | "company_profile"
    | "research_graph"
    | "marketing_intelligence_graph"
    | "inflight_graph"
    | "upstream_capability"
    | "deterministic_inference"
    | null;
} {
  const explicit = input.explicitAudience.trim() || input.brandTargetAudience?.trim();
  if (explicit) return { value: explicit, source: "explicit_campaign" };

  const fromProfile = profileList(input.profile?.targetAudiences)[0] ?? null;
  if (fromProfile) return { value: fromProfile, source: "company_profile" };

  const fromResearch = input.research?.audienceInsights.find((insight) => insight.segment.trim())?.segment.trim();
  if (fromResearch) return { value: fromResearch, source: "research_graph" };

  const fromMi = input.marketingIntelligence?.audienceIntelligence.find((segment) => segment.segment.trim())?.segment.trim();
  if (fromMi) return { value: fromMi, source: "marketing_intelligence_graph" };

  const fromInflight = input.inflightAudience?.trim();
  if (fromInflight) return { value: fromInflight, source: "inflight_graph" };

  const fromCapability = input.capabilityAudience?.trim();
  if (fromCapability) return { value: fromCapability, source: "upstream_capability" };

  const fromInference = input.inferredAudience?.trim();
  if (fromInference) return { value: fromInference, source: "deterministic_inference" };

  return { value: null, source: null };
}

export function deriveIndustry(input: {
  explicitIndustry?: string | null;
  profile?: CompanyProfile | null;
  companyGraph?: CompanyGraph | null;
  inflightIndustry?: string | null;
  capabilityIndustry?: string | null;
}): {
  value: string | null;
  source:
    | "explicit_campaign"
    | "company_profile"
    | "company_graph"
    | "inflight_graph"
    | "upstream_capability"
    | null;
} {
  const explicit = input.explicitIndustry?.trim();
  if (explicit) return { value: explicit, source: "explicit_campaign" };

  const fromProfile = profileString(input.profile?.industry);
  if (fromProfile) return { value: fromProfile, source: "company_profile" };

  const fromGraph = factValues(input.companyGraph, "industry")[0] ?? null;
  if (fromGraph) return { value: fromGraph, source: "company_graph" };

  const fromInflight = input.inflightIndustry?.trim();
  if (fromInflight) return { value: fromInflight, source: "inflight_graph" };

  const fromCapability = input.capabilityIndustry?.trim();
  if (fromCapability) return { value: fromCapability, source: "upstream_capability" };

  return { value: null, source: null };
}

export function deriveUniqueSellingPoints(input: {
  explicitUsps?: readonly string[] | null;
  profile?: CompanyProfile | null;
  companyGraph?: CompanyGraph | null;
  marketingIntelligence?: MarketingIntelligenceBrainGraph | null;
  inflightUsps?: readonly string[] | null;
  capabilityUsps?: readonly string[] | null;
}): {
  values: readonly string[];
  source:
    | "explicit_campaign"
    | "company_profile"
    | "company_graph"
    | "marketing_intelligence_graph"
    | "inflight_graph"
    | "upstream_capability"
    | null;
} {
  const explicit = (input.explicitUsps ?? []).map((usp) => usp.trim()).filter(Boolean);
  if (explicit.length > 0) return { values: explicit, source: "explicit_campaign" };

  const fromProfile = profileList(input.profile?.uniqueSellingPoints);
  if (fromProfile.length > 0) return { values: fromProfile, source: "company_profile" };

  const fromGraph = uniqueStrings([
    ...factValues(input.companyGraph, "usps"),
    ...factValues(input.companyGraph, "differentiators"),
  ]);
  if (fromGraph.length > 0) return { values: fromGraph, source: "company_graph" };

  const fromMi = uniqueStrings([
    ...(input.marketingIntelligence?.offerIntelligence.strengths ?? []),
    ...(input.marketingIntelligence?.messagingIntelligence.messageDifferentiation ?? []),
  ]);
  if (fromMi.length > 0) return { values: fromMi, source: "marketing_intelligence_graph" };

  const fromInflight = uniqueStrings([...(input.inflightUsps ?? [])]);
  if (fromInflight.length > 0) return { values: fromInflight, source: "inflight_graph" };

  const fromCapability = uniqueStrings([...(input.capabilityUsps ?? [])]);
  if (fromCapability.length > 0) return { values: fromCapability, source: "upstream_capability" };

  return { values: [], source: null };
}

export function deriveProductsAndServices(input: {
  explicitProducts?: readonly string[] | null;
  description: string;
  profile?: CompanyProfile | null;
  companyGraph?: CompanyGraph | null;
  inflightProducts?: readonly string[] | null;
  capabilityProducts?: readonly string[] | null;
}): {
  values: readonly string[];
  source:
    | "explicit_campaign"
    | "company_profile"
    | "company_graph"
    | "inflight_graph"
    | "upstream_capability"
    | null;
} {
  const explicit = (input.explicitProducts ?? []).map((entry) => entry.trim()).filter(Boolean);
  if (explicit.length > 0) return { values: explicit, source: "explicit_campaign" };

  if (input.description.trim().length >= 20) {
    return { values: [input.description.trim()], source: "explicit_campaign" };
  }

  const fromProfile = uniqueStrings([
    ...profileList(input.profile?.products),
    ...profileList(input.profile?.services),
  ]);
  if (fromProfile.length > 0) return { values: fromProfile, source: "company_profile" };

  const fromGraph = uniqueStrings([
    ...factValues(input.companyGraph, "products"),
    ...factValues(input.companyGraph, "services"),
  ]);
  if (fromGraph.length > 0) return { values: fromGraph, source: "company_graph" };

  const fromInflight = uniqueStrings([...(input.inflightProducts ?? [])]);
  if (fromInflight.length > 0) return { values: fromInflight, source: "inflight_graph" };

  const fromCapability = uniqueStrings([...(input.capabilityProducts ?? [])]);
  if (fromCapability.length > 0) return { values: fromCapability, source: "upstream_capability" };

  return { values: [], source: null };
}

import type { WebsiteKnowledgeSemantic } from "./types";

function websiteSemanticIsResolved(semantic: WebsiteKnowledgeSemantic | null | undefined): boolean {
  return semantic != null && semantic !== "unknown";
}

export function deriveWebsiteKnowledge(input: {
  websiteUrl: string | null;
  websiteSkipped: boolean;
  profile?: CompanyProfile | null;
  websiteSnapshot?: WebsiteSnapshot | null;
  research?: ResearchBrainGraph | null;
  inflightWebsiteKnown?: boolean;
  inflightWebsiteUrl?: string | null;
  capabilityWebsiteUrl?: string | null;
  capabilityWebsiteSemantic?: WebsiteKnowledgeSemantic | null;
}): {
  url: string | null;
  known: boolean;
  explicitlySkipped: boolean;
  semantic: WebsiteKnowledgeSemantic;
  source:
    | "explicit_campaign"
    | "explicit_skip"
    | "company_profile"
    | "website_snapshot"
    | "research_graph"
    | "inflight_graph"
    | "upstream_capability"
    | null;
} {
  if (input.websiteSkipped) {
    return {
      url: null,
      known: true,
      explicitlySkipped: true,
      semantic: "explicitly_skipped",
      source: "explicit_skip",
    };
  }

  const explicitUrl = input.websiteUrl?.trim();
  if (explicitUrl) {
    return {
      url: explicitUrl,
      known: true,
      explicitlySkipped: false,
      semantic: "available",
      source: "explicit_campaign",
    };
  }

  const profileWebsite = profileString(input.profile?.website);
  if (profileWebsite) {
    return {
      url: profileWebsite,
      known: true,
      explicitlySkipped: false,
      semantic: "available",
      source: "company_profile",
    };
  }

  const snapshotUrl = input.websiteSnapshot?.source.url?.trim();
  if (snapshotUrl) {
    return {
      url: snapshotUrl,
      known: true,
      explicitlySkipped: false,
      semantic: "available",
      source: "company_profile",
    };
  }

  const researchWebsite = input.research?.sources.some(
    (source) => source.type === "company_website" || source.type === "competitor_website"
  );
  if (researchWebsite) {
    return {
      url: null,
      known: true,
      explicitlySkipped: false,
      semantic: "discovered",
      source: "research_graph",
    };
  }

  if (input.inflightWebsiteKnown) {
    const inflightUrl = input.inflightWebsiteUrl?.trim() ?? null;
    return {
      url: inflightUrl,
      known: true,
      explicitlySkipped: false,
      semantic: inflightUrl ? "discovered" : "discovered",
      source: "inflight_graph",
    };
  }

  const capabilitySemantic = input.capabilityWebsiteSemantic;
  if (websiteSemanticIsResolved(capabilitySemantic)) {
    const resolvedUrl = input.capabilityWebsiteUrl?.trim() ?? null;
    if (capabilitySemantic === "not_applicable" || capabilitySemantic === "explicitly_skipped") {
      return {
        url: null,
        known: true,
        explicitlySkipped: capabilitySemantic === "explicitly_skipped",
        semantic: capabilitySemantic,
        source: "upstream_capability",
      };
    }
    return {
      url: resolvedUrl,
      known: true,
      explicitlySkipped: false,
      semantic: capabilitySemantic ?? "discovered",
      source: "upstream_capability",
    };
  }

  return {
    url: null,
    known: false,
    explicitlySkipped: false,
    semantic: "unknown",
    source: null,
  };
}

export function deriveCompetitorKnowledge(input: {
  competitors: readonly CampaignCompetitorEntry[];
  competitorsSkipped: boolean;
  profile?: CompanyProfile | null;
  research?: ResearchBrainGraph | null;
  marketingIntelligence?: MarketingIntelligenceBrainGraph | null;
  inflightCompetitors?: readonly CampaignCompetitorEntry[];
  capabilityCompetitors?: readonly CampaignCompetitorEntry[];
  capabilityCompetitorsSkipped?: boolean;
  capabilityCompetitorsHasEvidence?: boolean;
}): {
  competitors: readonly CampaignCompetitorEntry[];
  known: boolean;
  explicitlySkipped: boolean;
  source:
    | "explicit_campaign"
    | "explicit_skip"
    | "company_profile"
    | "research_graph"
    | "marketing_intelligence_graph"
    | "inflight_graph"
    | "upstream_capability"
    | null;
} {
  if (input.competitorsSkipped) {
    return {
      competitors: [],
      known: true,
      explicitlySkipped: true,
      source: "explicit_skip",
    };
  }

  if (input.competitors.length > 0) {
    return {
      competitors: input.competitors,
      known: true,
      explicitlySkipped: false,
      source: "explicit_campaign",
    };
  }

  const fromProfile = profileList(input.profile?.mainCompetitors).map((name) => ({ name }));
  if (fromProfile.length > 0) {
    return { competitors: fromProfile, known: true, explicitlySkipped: false, source: "company_profile" };
  }

  const fromResearch = (input.research?.competitorProfiles ?? [])
    .filter((profile) => profile.name.trim())
    .map((profile) => ({ name: profile.name.trim(), ...(profile.website ? { url: profile.website } : {}) }));
  if (fromResearch.length > 0) {
    return { competitors: fromResearch, known: true, explicitlySkipped: false, source: "research_graph" };
  }

  const fromMi = (input.marketingIntelligence?.competitiveMarketing ?? [])
    .filter((entry) => entry.name.trim())
    .map((entry) => ({ name: entry.name.trim() }));
  if (fromMi.length > 0) {
    return { competitors: fromMi, known: true, explicitlySkipped: false, source: "marketing_intelligence_graph" };
  }

  const fromInflight = input.inflightCompetitors ?? [];
  if (fromInflight.length > 0) {
    return { competitors: fromInflight, known: true, explicitlySkipped: false, source: "inflight_graph" };
  }

  if (input.capabilityCompetitorsSkipped) {
    return {
      competitors: [],
      known: true,
      explicitlySkipped: true,
      source: "explicit_skip",
    };
  }

  const fromCapability = input.capabilityCompetitors ?? [];
  if (fromCapability.length > 0 && input.capabilityCompetitorsHasEvidence !== false) {
    return { competitors: fromCapability, known: true, explicitlySkipped: false, source: "upstream_capability" };
  }

  return { competitors: [], known: false, explicitlySkipped: false, source: null };
}
