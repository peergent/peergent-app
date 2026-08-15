import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CampaignCompetitorEntry } from "@/lib/office/campaign/campaign-context";
import type { WebsiteKnowledgeSemantic } from "./types";

function findingById(output: BrainStructuredOutput | undefined, id: string): string | null {
  const match = output?.findings.find((f) => f.id === id);
  return match?.value?.trim() || null;
}

function findingByLabel(
  output: BrainStructuredOutput | undefined,
  labels: readonly string[]
): string | null {
  if (!output) return null;
  const normalized = new Set(labels.map((l) => l.toLowerCase()));
  const match = output.findings.find((f) => normalized.has(f.label.toLowerCase()));
  return match?.value?.trim() || null;
}

function findingsByLabel(
  output: BrainStructuredOutput | undefined,
  label: string
): readonly string[] {
  if (!output) return [];
  return output.findings
    .filter((f) => f.label.toLowerCase() === label.toLowerCase())
    .map((f) => f.value.trim())
    .filter(Boolean);
}

function hasWarningCode(output: BrainStructuredOutput | undefined, code: string): boolean {
  return Boolean(output?.warnings.some((w) => w.code === code));
}

function extractUrlFromFindingValue(value: string): string | null {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const match = trimmed.match(/\((https?:\/\/[^)]+)\)/);
  return match?.[1]?.trim() ?? null;
}

export type CapabilityKnowledgeContribution = {
  industry: string | null;
  targetAudience: string | null;
  uniqueSellingPoints: readonly string[];
  productsAndServices: readonly string[];
  positioning: string | null;
  competitors: readonly CampaignCompetitorEntry[];
  competitorsExplicitlySkipped: boolean;
  competitorsHasEvidence: boolean;
  websiteUrl: string | null;
  websiteSemantic: WebsiteKnowledgeSemantic | null;
};

const EMPTY_CONTRIBUTION: CapabilityKnowledgeContribution = {
  industry: null,
  targetAudience: null,
  uniqueSellingPoints: [],
  productsAndServices: [],
  positioning: null,
  competitors: [],
  competitorsExplicitlySkipped: false,
  competitorsHasEvidence: false,
  websiteUrl: null,
  websiteSemantic: null,
};

function mergeContribution(
  base: CapabilityKnowledgeContribution,
  next: Partial<CapabilityKnowledgeContribution>
): CapabilityKnowledgeContribution {
  return {
    industry: base.industry ?? next.industry ?? null,
    targetAudience: base.targetAudience ?? next.targetAudience ?? null,
    uniqueSellingPoints:
      base.uniqueSellingPoints.length > 0
        ? base.uniqueSellingPoints
        : (next.uniqueSellingPoints ?? []),
    productsAndServices:
      base.productsAndServices.length > 0
        ? base.productsAndServices
        : (next.productsAndServices ?? []),
    positioning: base.positioning ?? next.positioning ?? null,
    competitors: base.competitors.length > 0 ? base.competitors : (next.competitors ?? []),
    competitorsExplicitlySkipped:
      base.competitorsExplicitlySkipped || Boolean(next.competitorsExplicitlySkipped),
    competitorsHasEvidence: base.competitorsHasEvidence || Boolean(next.competitorsHasEvidence),
    websiteUrl: base.websiteUrl ?? next.websiteUrl ?? null,
    websiteSemantic: base.websiteSemantic ?? next.websiteSemantic ?? null,
  };
}

function extractCompanyUnderstanding(output: BrainStructuredOutput | undefined): Partial<CapabilityKnowledgeContribution> {
  if (!output) return {};
  const industry = findingByLabel(output, ["Industry", "Industrie"]);
  const positioning =
    findingByLabel(output, ["Positioning", "Positionering"]) ??
    output.decisions.find((d) => d.id === "dec-positioning")?.rationale?.trim() ??
    null;
  const productsRaw = findingByLabel(output, ["Products", "Producten"]);
  const productsAndServices = productsRaw
    ? productsRaw.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  return {
    industry,
    positioning,
    productsAndServices,
    uniqueSellingPoints: positioning ? [positioning] : [],
  };
}

function extractBrandUnderstanding(output: BrainStructuredOutput | undefined): Partial<CapabilityKnowledgeContribution> {
  if (!output) return {};
  const positioning = findingById(output, "brand-positioning");
  const valueProp = findingById(output, "brand-value-prop");
  const promises = findingById(output, "brand-promises");
  const usps = [valueProp, promises].filter(Boolean) as string[];

  return {
    positioning,
    uniqueSellingPoints: usps,
  };
}

function extractCompetitorUnderstanding(
  output: BrainStructuredOutput | undefined
): Partial<CapabilityKnowledgeContribution> {
  if (!output) return {};

  if (hasWarningCode(output, "competitors_skipped")) {
    return { competitorsExplicitlySkipped: true, competitorsHasEvidence: true };
  }

  if (hasWarningCode(output, "competitors_missing")) {
    return { competitorsHasEvidence: false };
  }

  const competitorFindings = findingsByLabel(output, "Competitor").concat(
    findingsByLabel(output, "Concurrent")
  );
  if (competitorFindings.length === 0) {
    return { competitorsHasEvidence: false };
  }

  const competitors: CampaignCompetitorEntry[] = competitorFindings
    .map((value) => {
      const url = extractUrlFromFindingValue(value);
      const name = value.replace(/\s*\(https?:\/\/[^)]+\)\s*$/, "").trim();
      return name ? { name, ...(url ? { url } : {}) } : null;
    })
    .filter((entry): entry is CampaignCompetitorEntry => Boolean(entry));

  if (competitors.length === 0) {
    return { competitorsHasEvidence: false };
  }

  return { competitors, competitorsHasEvidence: true };
}

function extractWebsiteUnderstanding(
  output: BrainStructuredOutput | undefined
): Partial<CapabilityKnowledgeContribution> {
  if (!output) return {};

  const suppliedUrl =
    findingById(output, "finding-url-supplied") ??
    findingByLabel(output, ["Supplied URL", "Opgegeven URL"]);

  if (suppliedUrl) {
    const url = extractUrlFromFindingValue(suppliedUrl) ?? suppliedUrl;
    return {
      websiteUrl: url,
      websiteSemantic: "available",
    };
  }

  const discoveredUrl = output.findings
    .map((f) => extractUrlFromFindingValue(f.value))
    .find(Boolean);
  if (discoveredUrl) {
    return { websiteUrl: discoveredUrl, websiteSemantic: "discovered" };
  }

  if (hasWarningCode(output, "website_unavailable")) {
    return { websiteSemantic: "unknown" };
  }

  if (hasWarningCode(output, "website_not_applicable")) {
    return { websiteSemantic: "not_applicable" };
  }

  return {};
}

function extractMarketUnderstanding(
  output: BrainStructuredOutput | undefined
): Partial<CapabilityKnowledgeContribution> {
  if (!output) return {};
  const industry = findingByLabel(output, ["Industry", "Markt", "Market"]);
  const audience = findingByLabel(output, ["Target audience", "Doelgroep", "Audience"]);
  const positioning = findingByLabel(output, ["Positioning", "Positionering"]);
  const uspFindings = output.findings
    .filter((f) => /usp|value proposition|differentiat/i.test(f.label))
    .map((f) => f.value.trim())
    .filter(Boolean);

  return {
    industry,
    targetAudience: audience,
    positioning,
    uniqueSellingPoints: uspFindings.length > 0 ? uspFindings : positioning ? [positioning] : [],
  };
}

const CAPABILITY_EXTRACTORS: Partial<
  Record<BrainCapabilityId, (output: BrainStructuredOutput | undefined) => Partial<CapabilityKnowledgeContribution>>
> = {
  company_understanding: extractCompanyUnderstanding,
  brand_understanding: extractBrandUnderstanding,
  competitor_understanding: extractCompetitorUnderstanding,
  website_understanding: extractWebsiteUnderstanding,
  market_understanding: extractMarketUnderstanding,
};

/** Extract structured readiness knowledge from upstream capability outputs — never from status alone. */
export function extractCapabilityKnowledge(
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> | null | undefined
): CapabilityKnowledgeContribution {
  if (!upstreamOutputs) return { ...EMPTY_CONTRIBUTION };

  let merged = { ...EMPTY_CONTRIBUTION };
  const order: BrainCapabilityId[] = [
    "company_understanding",
    "market_understanding",
    "brand_understanding",
    "competitor_understanding",
    "website_understanding",
  ];

  for (const capabilityId of order) {
    const extractor = CAPABILITY_EXTRACTORS[capabilityId];
    if (!extractor) continue;
    merged = mergeContribution(merged, extractor(upstreamOutputs[capabilityId]));
  }

  return merged;
}
