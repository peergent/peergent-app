import type { BrainSnapshot } from "../context/snapshot";
import type { CompanySnapshot } from "../company/snapshot";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import type { BrainContextProjection } from "../providers/token-strategy";
import { compressFacts, trimSection } from "../llm/token-budget";
import { fitContextToWindow } from "../llm/context-window";
import { extractApprovedChannelsForCreativePlanning } from "../llm/creative-planning-upstream";

export type ChannelPlanningProjectedContext = {
  strategySummary: string;
  channelHypothesis: string;
  campaignGoal: string;
  targetAudience: string;
  executionMode: string;
  manualChannels: string;
};

export type CreativeGenerationProjectedContext = {
  companyBrandSummary: string;
  campaignGoal: string;
  targetAudience: string;
  strategySummary: string;
  approvedChannels: string;
  productsAndServices: string;
  usps: string;
  toneOfVoice: string;
  competitorObservations: string;
  websiteObservations: string;
  knownFacts: string;
  unknowns: string;
  executionMode: string;
  approvalMode: string;
};

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
  reasoningSummary: string;
  researchSummary: string;
  strategicThemes: string;
  priorityOpportunities: string;
  strategicRisks: string;
  rejectedAlternatives: string;
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

  const reasoning = input.executionContext.reasoningGraph;
  const research = input.executionContext.researchGraph;

  const reasoningSummary = reasoning
    ? [
        "Business model:",
        ...reasoning.businessModel.map((n) => `- ${n.title}: ${n.description}`),
        "Market position:",
        ...reasoning.marketPosition.map((n) => `- ${n.title}: ${n.description}`),
        "Customer model:",
        ...reasoning.customerModel.map((n) => `- ${n.title}: ${n.description}`),
        "Priority insights:",
        ...reasoning.priorityInsights.map((n) => `- ${n.title}: ${n.description}`),
      ].join("\n")
    : "ReasoningGraph not available — use legacy context.";

  const researchSummary = research
    ? [
        `Company evidence: ${research.company.length}`,
        `Audience evidence: ${research.audience.length}`,
        `Competitors: ${research.competitors.length}`,
        `Unknowns: ${research.unknowns.map((u) => u.title).join(", ") || "none"}`,
      ].join("\n")
    : "ResearchGraph not available.";

  const strategicThemes = reasoning?.strategicThemes.map((t) => t.title).join(", ") ?? "None";
  const priorityOpportunities =
    reasoning?.opportunities.map((o) => o.title).join(", ") ?? "None identified";
  const strategicRisks = reasoning?.risks.map((r) => r.title).join(", ") ?? "None identified";
  const rejectedAlternatives =
    reasoning?.contradictions.map((c) => c.title).join(", ") ?? "Document in decisions";

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
      reasoningSummary: trimSection(reasoningSummary, 1200),
      researchSummary: trimSection(researchSummary, 600),
      strategicThemes,
      priorityOpportunities,
      strategicRisks,
      rejectedAlternatives,
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
    reasoningSummary: sections.reasoningSummary ?? "",
    researchSummary: sections.researchSummary ?? "",
    strategicThemes: sections.strategicThemes ?? "",
    priorityOpportunities: sections.priorityOpportunities ?? "",
    strategicRisks: sections.strategicRisks ?? "",
    rejectedAlternatives: sections.rejectedAlternatives ?? "",
  };
}

export function buildChannelPlanningProjectedContext(input: {
  snapshot: BrainSnapshot;
  companySnapshot: CompanySnapshot;
  executionContext: CapabilityExecutionContext;
  projection: BrainContextProjection;
}): ChannelPlanningProjectedContext {
  const profile = input.companySnapshot.profile;
  const campaign = input.executionContext.campaignContext;
  const strategy = input.executionContext.upstreamOutputs.strategy;

  const strategySummary =
    strategy?.findings.map((f) => `${f.label}: ${f.value}`).join("\n") ||
    "No completed strategy available.";

  const channelHypothesis =
    strategy?.findings.find((f) => /channel|kanaal/i.test(f.label))?.value ?? "Not specified.";

  const manualChannels =
    campaign?.selectedChannels?.length
      ? campaign.selectedChannels.join(", ")
      : campaign?.campaignMode === "manual" || campaign?.executionMode === "manual"
        ? "None selected yet (manual mode)."
        : "Automatic — derive from strategy.";

  const sections = fitContextToWindow({
    sections: {
      strategySummary: trimSection(strategySummary, 2000),
      channelHypothesis: trimSection(channelHypothesis, 400),
      campaignGoal: campaign
        ? compressFacts([campaign.description, ...campaign.goals]).join("\n")
        : "No campaign goal supplied.",
      targetAudience: fieldValue(campaign?.audience ?? profile.targetAudiences.value?.[0] ?? null),
      executionMode: campaign?.executionMode ?? campaign?.campaignMode ?? "semi_automatic",
      manualChannels,
    },
  });

  return {
    strategySummary: sections.strategySummary ?? "",
    channelHypothesis: sections.channelHypothesis ?? "",
    campaignGoal: sections.campaignGoal ?? "",
    targetAudience: sections.targetAudience ?? "",
    executionMode: String(sections.executionMode ?? "semi_automatic"),
    manualChannels: sections.manualChannels ?? "",
  };
}

export function buildCreativeGenerationProjectedContext(input: {
  snapshot: BrainSnapshot;
  companySnapshot: CompanySnapshot;
  executionContext: CapabilityExecutionContext;
  projection: BrainContextProjection;
}): CreativeGenerationProjectedContext {
  const profile = input.companySnapshot.profile;
  const campaign = input.executionContext.campaignContext;
  const strategy = input.executionContext.upstreamOutputs.strategy;
  const channelPlan = input.executionContext.upstreamOutputs.channel_planning;
  const brandCtx = campaign?.brandContext;

  const strategySummary =
    strategy?.findings.map((f) => `${f.label}: ${f.value}`).join("\n") ||
    "No completed strategy available.";

  const approvedChannels = extractApprovedChannelsForCreativePlanning({
    channelOutput: channelPlan,
    campaignContext: campaign,
    channelsStepApproved: campaign?.stepApprovals?.channels_selected === "approved",
  });
  const approvedChannelsText =
    approvedChannels.length > 0 ? approvedChannels.join(", ") : "None approved yet.";

  const brandSummary = input.snapshot.brand.available
    ? trimSection(input.snapshot.brand.summary ?? "Brand context available.", 600)
    : brandCtx?.brandName
      ? `Brand: ${brandCtx.brandName}. Industry: ${brandCtx.industry ?? "Unknown"}.`
      : "Brand context not available.";

  const websiteSummary = input.snapshot.website.available
    ? trimSection(input.snapshot.website.summary ?? "Website context available.", 500)
    : campaign?.websiteUrl
      ? `Website URL supplied: ${campaign.websiteUrl}`
      : "Website context not available.";

  const competitorList =
    profile.mainCompetitors.value?.join(", ") ||
    input.executionContext.upstreamOutputs.competitor_understanding?.findings
      .slice(0, 4)
      .map((f) => f.value)
      .join("; ") ||
    "None confirmed";

  const knownFacts = compressFacts(input.snapshot.knownFacts.map((f) => f.value)).join("\n") || "None listed.";
  const unknowns = compressFacts(input.snapshot.unknowns).join("\n") || "None listed.";

  const products =
    brandCtx?.productsAndServices?.join(", ") ||
    profile.products.value?.join(", ") ||
    "Unknown";
  const usps =
    brandCtx?.uniqueSellingPoints?.join(", ") ||
    profile.uniqueSellingPoints.value?.join(", ") ||
    "Unknown";

  const sections = fitContextToWindow({
    sections: {
      companyBrandSummary: trimSection(
        [brandSummary, brandCtx?.positioning, brandCtx?.mission].filter(Boolean).join("\n"),
        900
      ),
      campaignGoal: campaign
        ? compressFacts([campaign.description, ...campaign.goals]).join("\n")
        : "No campaign goal supplied.",
      targetAudience: fieldValue(campaign?.audience ?? brandCtx?.targetAudience ?? profile.targetAudiences.value?.[0] ?? null),
      strategySummary: trimSection(strategySummary, 2000),
      approvedChannels: approvedChannelsText,
      productsAndServices: trimSection(products, 400),
      usps: trimSection(usps, 300),
      toneOfVoice: fieldValue(brandCtx?.tone ?? profile.tone.value ?? null, "Not specified"),
      competitorObservations: trimSection(competitorList, 400),
      websiteObservations: websiteSummary,
      knownFacts,
      unknowns,
      executionMode: campaign?.executionMode ?? campaign?.campaignMode ?? "semi_automatic",
      approvalMode: campaign?.executionMode ?? "semi_automatic",
    },
  });

  return {
    companyBrandSummary: sections.companyBrandSummary ?? "",
    campaignGoal: sections.campaignGoal ?? "",
    targetAudience: sections.targetAudience ?? "",
    strategySummary: sections.strategySummary ?? "",
    approvedChannels: sections.approvedChannels ?? "",
    productsAndServices: sections.productsAndServices ?? "",
    usps: sections.usps ?? "",
    toneOfVoice: sections.toneOfVoice ?? "",
    competitorObservations: sections.competitorObservations ?? "",
    websiteObservations: sections.websiteObservations ?? "",
    knownFacts: sections.knownFacts ?? "",
    unknowns: sections.unknowns ?? "",
    executionMode: String(sections.executionMode ?? "semi_automatic"),
    approvalMode: String(sections.approvalMode ?? "semi_automatic"),
  };
}
