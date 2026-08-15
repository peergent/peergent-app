import type { ResearchGraph } from "../layers/research/types";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence/types";
import type { ReasoningGraph } from "../layers/reasoning/types";
import type { CampaignCompetitorEntry } from "@/lib/office/campaign/campaign-context";

export type InflightGraphKnowledgeContribution = {
  industry: string | null;
  targetAudience: string | null;
  uniqueSellingPoints: readonly string[];
  productsAndServices: readonly string[];
  competitors: readonly CampaignCompetitorEntry[];
  websiteKnown: boolean;
  websiteUrl: string | null;
};

const EMPTY: InflightGraphKnowledgeContribution = {
  industry: null,
  targetAudience: null,
  uniqueSellingPoints: [],
  productsAndServices: [],
  competitors: [],
  websiteKnown: false,
  websiteUrl: null,
};

function firstEvidenceDescription(
  items: readonly { description: string }[] | undefined
): string | null {
  const value = items?.find((item) => item.description.trim())?.description.trim();
  return value ?? null;
}

function firstWebsiteUrl(items: readonly { description: string }[] | undefined): string | null {
  if (!items?.length) return null;
  for (const item of items) {
    const trimmed = item.description.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const match = trimmed.match(/https?:\/\/[^\s)]+/i);
    if (match?.[0]) return match[0];
  }
  return null;
}

function evidenceDescriptions(
  items: readonly { description: string; title?: string }[] | undefined,
  title?: string
): readonly string[] {
  if (!items?.length) return [];
  return items
    .filter((item) => !title || item.title === title)
    .map((item) => item.description.trim())
    .filter(Boolean);
}

function parseCompetitorName(description: string): CampaignCompetitorEntry | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\((https?:\/\/[^)]+)\)/);
  const name = trimmed.replace(/\s*\(https?:\/\/[^)]+\)\s*$/, "").trim();
  if (!name) return null;
  return { name, ...(urlMatch?.[1] ? { url: urlMatch[1] } : {}) };
}

/** Extract readiness fields from in-flight legacy layer graphs built during the current run. */
export function extractInflightGraphKnowledge(input: {
  researchGraph?: ResearchGraph | null;
  reasoningGraph?: ReasoningGraph | null;
  marketingIntelligenceGraph?: MarketingIntelligenceGraph | null;
}): InflightGraphKnowledgeContribution {
  const research = input.researchGraph;
  if (!research) return { ...EMPTY };

  const industry =
    firstEvidenceDescription(research.company.filter((e) => e.title === "Industry")) ??
    firstEvidenceDescription(research.company);

  const targetAudience = firstEvidenceDescription(research.audience);

  const productsAndServices = [
    ...evidenceDescriptions(research.products, "Product"),
    ...evidenceDescriptions(research.services, "Service"),
  ];

  const competitors = research.competitors
    .map((entry) => parseCompetitorName(entry.description))
    .filter((entry): entry is CampaignCompetitorEntry => Boolean(entry));

  const positioning = firstEvidenceDescription(research.brand);
  const uniqueSellingPoints = positioning ? [positioning] : [];

  const websiteKnown = research.website.length > 0;
  const websiteUrl = firstWebsiteUrl(research.website);

  const reasoningTheme = input.reasoningGraph?.strategicThemes?.[0]?.title?.trim();
  const miPositioning = input.marketingIntelligenceGraph?.strongestPositioning?.narrative?.trim();

  const uspsFromReasoning = reasoningTheme ? [reasoningTheme] : [];
  const uspsFromMi = miPositioning ? [miPositioning] : [];

  return {
    industry,
    targetAudience,
    uniqueSellingPoints:
      uniqueSellingPoints.length > 0
        ? uniqueSellingPoints
        : uspsFromMi.length > 0
          ? uspsFromMi
          : uspsFromReasoning,
    productsAndServices,
    competitors,
    websiteKnown,
    websiteUrl,
  };
}
