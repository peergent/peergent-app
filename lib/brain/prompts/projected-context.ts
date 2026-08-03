import type { BrainSnapshot } from "../context/snapshot";
import type { CompanySnapshot } from "../company/snapshot";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import type { BrainContextProjection } from "../providers/token-strategy";
import { compressFacts, trimSection } from "../llm/token-budget";
import { fitContextToWindow } from "../llm/context-window";

export type StrategyProjectedContext = {
  companyProfile: string;
  brand: string;
  websiteSummary: string;
  campaignGoal: string;
  targetAudience: string;
  competitors: string;
  knownFacts: string;
  unknowns: string;
  corrections: string;
  workingAgreement: string;
  executionMode: string;
};

function fieldValue(value: string | null | undefined, fallback = "Unknown"): string {
  const v = value?.trim();
  return v && v.length > 0 ? v : fallback;
}

export function buildStrategyProjectedContext(input: {
  snapshot: BrainSnapshot;
  companySnapshot: CompanySnapshot;
  executionContext: CapabilityExecutionContext;
  projection: BrainContextProjection;
}): StrategyProjectedContext {
  const profile = input.companySnapshot.profile;
  const campaign = input.executionContext.campaignContext;

  const companyLines = compressFacts([
    `Company: ${fieldValue(profile.companyName.value)}`,
    `Industry: ${fieldValue(profile.industry.value)}`,
    `Positioning: ${fieldValue(profile.positioning.value)}`,
    `Business model: ${fieldValue(profile.businessModel.value)}`,
    `USPs: ${profile.uniqueSellingPoints.value?.join(", ") || "Unknown"}`,
  ]);

  const brandSummary = input.snapshot.brand.available
    ? trimSection(input.snapshot.brand.summary ?? "Brand context available.", 800)
    : "Brand context not available.";

  const websiteSummary = input.snapshot.website.available
    ? trimSection(input.snapshot.website.summary ?? "Website context available.", 800)
    : profile.website.value
      ? `Website URL: ${profile.website.value}`
      : "Website context not available.";

  const competitorList =
    profile.mainCompetitors.value?.join(", ") ||
    input.executionContext.upstreamOutputs.competitor_understanding?.findings
      .slice(0, 5)
      .map((f) => f.value)
      .join(", ") ||
    "None confirmed";

  const knownFacts = compressFacts(input.snapshot.knownFacts.map((f) => f.value)).join("\n") || "None listed.";
  const unknowns = compressFacts(input.snapshot.unknowns).join("\n") || "None listed.";

  const sections = fitContextToWindow({
    sections: {
      companyProfile: companyLines.join("\n"),
      brand: brandSummary,
      websiteSummary,
      campaignGoal: campaign
        ? compressFacts([campaign.description, ...campaign.goals]).join("\n")
        : "No campaign goal supplied.",
      targetAudience: fieldValue(campaign?.audience ?? profile.targetAudiences.value?.[0] ?? null),
      competitors: competitorList,
      knownFacts,
      unknowns,
      corrections: "Customer corrections applied in assembled snapshot.",
      workingAgreement: input.snapshot.workingAgreement.available
        ? trimSection(input.snapshot.workingAgreement.summary ?? "Working agreement on file.", 400)
        : "Not specified.",
      executionMode: "semi_automatic",
    },
  });

  return {
    companyProfile: sections.companyProfile ?? "",
    brand: sections.brand ?? "",
    websiteSummary: sections.websiteSummary ?? "",
    campaignGoal: sections.campaignGoal ?? "",
    targetAudience: sections.targetAudience ?? "",
    competitors: sections.competitors ?? "",
    knownFacts: sections.knownFacts ?? "",
    unknowns: sections.unknowns ?? "",
    corrections: sections.corrections ?? "",
    workingAgreement: sections.workingAgreement ?? "",
    executionMode: sections.executionMode ?? "semi_automatic",
  };
}
