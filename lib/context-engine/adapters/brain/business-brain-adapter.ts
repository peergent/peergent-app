import type { WebsiteIntelligenceAssessment } from "@/lib/website-intelligence";
import { collectAllFindings } from "@/lib/website-intelligence";
import { buildBusinessBrainViewModel } from "@/lib/website-intelligence/assessment-presenter";

export type BrainSnapshot = {
  available: boolean;
  summary?: string;
  coveragePercent?: number;
  focusAreas?: string[];
  companySummary?: string;
  industry?: string;
  products?: string[];
  services?: string[];
  targetCustomers?: string;
  valueProposition?: string;
  toneOfVoice?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  recommendations?: string[];
  confidenceScore?: number;
  lastAnalyzedAt?: string;
};

function dedupeStrings(values: string[], limit = 12): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
    if (result.length >= limit) break;
  }

  return result;
}

function extractProducts(assessment: WebsiteIntelligenceAssessment): string[] {
  return dedupeStrings(
    assessment.companyDna.findings
      .filter((finding) => /product|catalog|sku|inventory|item/i.test(finding.statement))
      .map((finding) => finding.statement),
    5
  );
}

function extractServices(assessment: WebsiteIntelligenceAssessment): string[] {
  return dedupeStrings(
    [
      assessment.companyDna.businessType,
      ...assessment.operations.areas.map((area) => area.name),
      ...assessment.companyDna.findings
        .filter((finding) =>
          /service|consult|support|delivery|implementation|advisory/i.test(
            finding.statement
          )
        )
        .map((finding) => finding.statement),
    ],
    8
  );
}

export function emptyBrainSnapshot(): BrainSnapshot {
  return { available: false };
}

export function assessmentToBrainSnapshot(
  assessment: WebsiteIntelligenceAssessment
): BrainSnapshot {
  const viewModel = buildBusinessBrainViewModel(assessment);
  const allFindings = collectAllFindings(assessment);
  const confidenceScore = Math.round(viewModel.understandingFill * 100);

  const strengths = dedupeStrings(
    allFindings
      .filter((finding) => finding.category === "observed")
      .map((finding) => finding.statement)
  );

  const weaknesses = dedupeStrings([
    ...assessment.customerJourney.frictionPoints.map((finding) => finding.statement),
    ...allFindings
      .filter(
        (finding) =>
          finding.category === "unknown" ||
          finding.category === "requires-more-data"
      )
      .map((finding) => finding.statement),
  ]);

  const opportunities = dedupeStrings([
    viewModel.opportunity,
    viewModel.opportunityReason,
    ...assessment.customerJourney.opportunities.map((finding) => finding.statement),
    ...allFindings
      .filter((finding) => finding.category === "likely")
      .map((finding) => finding.statement),
  ]);

  const recommendations = assessment.workforceRecommendations.recommendations.map(
    (recommendation) =>
      `${recommendation.name} (${recommendation.role}): ${recommendation.whyRecommended}`
  );

  const products = extractProducts(assessment);
  const services = extractServices(assessment);
  const companySummary = [
    assessment.executiveSummary.conclusion,
    assessment.executiveSummary.rationale,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    available: true,
    summary: assessment.executiveSummary.conclusion,
    coveragePercent: confidenceScore,
    focusAreas: dedupeStrings(
      [
        viewModel.opportunity,
        ...assessment.operations.areas.map((area) => area.name),
        ...recommendations.map((recommendation) => recommendation.split(":")[0] ?? recommendation),
      ],
      5
    ),
    companySummary,
    industry: assessment.meta.industry,
    products,
    services,
    targetCustomers: assessment.companyDna.targetCustomers,
    valueProposition: assessment.companyDna.brandPresentation,
    toneOfVoice: assessment.companyDna.brandPresentation,
    strengths,
    weaknesses,
    opportunities,
    recommendations,
    confidenceScore,
    lastAnalyzedAt: assessment.meta.analyzedAt,
  };
}

/** @deprecated Use assessmentToBrainSnapshot() */
export function toBrainSnapshot(input?: {
  summary?: string;
  coveragePercent?: number;
  focusAreas?: string[];
}): BrainSnapshot {
  if (!input) {
    return emptyBrainSnapshot();
  }

  return {
    available: true,
    summary: input.summary,
    coveragePercent: input.coveragePercent,
    focusAreas: input.focusAreas,
  };
}
