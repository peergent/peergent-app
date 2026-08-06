import { beforeEach, describe, expect, it } from "vitest";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  executeCompanyUnderstanding,
  executeWebsiteUnderstanding,
  executeCompetitorUnderstanding,
  executeBrandUnderstanding,
  executeStrategy,
  buildResearchGraph,
  buildReasoningGraph,
  buildMarketingIntelligenceGraph,
  createMarketingIntelligenceLayer,
  collectMarketingIntelligenceGraph,
  resetDefaultMarketingIntelligenceRepository,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
  resetDefaultResearchRepository,
  resetDefaultReasoningRepository,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { buildExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import { finalizeStrategyWithSelfCritique } from "@/lib/brain/strategy/strategy-self-critique";
import { containsGenericMarketingPhrase } from "@/lib/brain/strategy/generic-marketing-phrases";
import { MARKETING_INTELLIGENCE_THINKING_QUESTIONS } from "@/lib/brain/layers/marketing-intelligence/marketing-intelligence-thinking";

const peergentInput = {
  peerId: "demo" as const,
  ownerLabel: "Emma",
  name: "Peergent",
  goalLabel: "Demo requests",
  description: "More demo requests from SMB owners.",
  primaryGoalId: "generate_leads" as const,
  targetAudience: "SMB owners",
  setupMode: "automatic" as const,
  approvalMode: "approval_before_publication" as const,
};

function fullPipelineContext() {
  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const assembledAt = "2026-08-01T00:00:00.000Z";
  const profile = buildPeergentCompanyProfile("en", assembledAt);
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
  });
  const project = createMarketingCampaignProject(peergentInput);
  const campaignContext = buildCampaignContextFromCreateInput(project, peergentInput, "en");
  const assembly = assembleCompanyContextSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyProfile: profile,
    websiteSnapshot: website,
    campaignContext,
    locale: "en",
  });

  const companyOut = executeCompanyUnderstanding({
    companySnapshot: assembly.companySnapshot,
    locale: "en",
  });
  const websiteOut = executeWebsiteUnderstanding({
    companySnapshot: assembly.companySnapshot,
    websiteSnapshot: website,
    locale: "en",
  });
  const competitorOut = executeCompetitorUnderstanding({
    companySnapshot: assembly.companySnapshot,
    locale: "en",
  });
  const upstreamOutputs = {
    company_understanding: companyOut,
    website_understanding: websiteOut,
    competitor_understanding: competitorOut,
  };

  const execCtx = buildCapabilityExecutionContext({
    assembly,
    request: {
      organizationId: PEERGENT_DEMO_ORG_ID,
      peerId: "demo",
      capabilityId: "strategy",
      actorId: "test",
      campaignContext,
      upstreamOutputs,
    },
    campaignContext,
    upstreamOutputs,
  });

  return { execCtx, campaignContext, assembly, upstreamOutputs };
}

describe("Marketing Intelligence Layer — Sprint 9.3", () => {
  beforeEach(() => {
    resetDefaultResearchRepository();
    resetDefaultReasoningRepository();
    resetDefaultMarketingIntelligenceRepository();
  });

  it("builds MarketingIntelligenceGraph from ReasoningGraph", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    expect(execCtx.reasoningGraph).toBeTruthy();

    const graph = buildMarketingIntelligenceGraph({
      reasoningGraph: execCtx.reasoningGraph!,
      researchGraph: execCtx.researchGraph,
      campaignContext,
      locale: "en",
    });

    expect(graph.businessReality.narrative).toMatch(/Peergent/i);
    expect(graph.antiPatterns.length).toBeGreaterThanOrEqual(1);
    expect(graph.highestProbabilityCampaigns.length).toBeGreaterThanOrEqual(0);
  });

  it("auto-builds marketing intelligence in execution context", () => {
    const { execCtx } = fullPipelineContext();
    expect(execCtx.marketingIntelligenceGraph).toBeTruthy();
    expect(execCtx.marketingIntelligenceGraph!.dominantMessaging.narrative.length).toBeGreaterThan(10);
  });

  it("Strategy consumes MarketingIntelligence for company-specific output", () => {
    const { execCtx } = fullPipelineContext();
    const out = executeStrategy(execCtx);
    const text = out.findings.map((f) => f.value).join(" ");
    expect(text).toMatch(/Peergent/i);
    expect(text).not.toMatch(/Awareness → consideration → action/i);
    expect(out.decisions[0]?.rationale).toMatch(/Rejected alternatives|Afgewezen alternatieven/i);
  });

  it("self-critique runs with max two iterations", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const { critique } = finalizeStrategyWithSelfCritique({ ctx: execCtx, campaignContext });
    expect(critique.iterationsUsed).toBeLessThanOrEqual(2);
    expect(critique.questions.length).toBeGreaterThan(0);
  });

  it("builds executive briefing from strategy output", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const strategy = executeStrategy(execCtx);
    const briefing = buildExecutiveCampaignBriefing({
      campaignContext,
      strategy,
      locale: "en",
    });
    expect(briefing.sections.length).toBeGreaterThan(5);
    expect(briefing.companyName).toMatch(/Peergent/i);
    expect(briefing.sections.some((s) => s.id === "top-decisions" && s.drillDownDecisionId)).toBe(true);
  });

  it("stores graph in repository", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const layer = createMarketingIntelligenceLayer();
    const { graph } = layer.thinkAndStore({
      reasoningGraph: execCtx.reasoningGraph!,
      researchGraph: execCtx.researchGraph,
      campaignContext,
      locale: "en",
    });
    const stored = layer.getLatestGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      campaignId: campaignContext.projectId,
    });
    expect(stored?.version).toBe(graph.version);
  });

  it("Sprint 10.1 — internal thinking has 14 strategist questions", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const graph = buildMarketingIntelligenceGraph({
      reasoningGraph: execCtx.reasoningGraph!,
      researchGraph: execCtx.researchGraph,
      campaignContext,
      locale: "en",
    });
    expect(MARKETING_INTELLIGENCE_THINKING_QUESTIONS).toHaveLength(14);
    expect(graph.internalThinking).toHaveLength(14);
    expect(graph.internalThinking.every((r) => r.answer.length > 20)).toBe(true);
    expect(graph.internalThinking.every((r) => r.question.length > 5)).toBe(true);
  });

  it("Sprint 10.1 — strategy output avoids generic AI marketing phrases", () => {
    const { execCtx } = fullPipelineContext();
    const out = executeStrategy(execCtx);
    const text = [
      ...out.findings.map((f) => `${f.label} ${f.value}`),
      ...out.decisions.map((d) => d.rationale),
      ...out.recommendations.map((r) => `${r.label} ${r.description ?? ""}`),
    ].join("\n");
    expect(containsGenericMarketingPhrase(text)).toBe(false);
  });

  it("Sprint 10.1 — executive briefing includes decision-driven sections", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const strategy = executeStrategy(execCtx);
    const briefing = buildExecutiveCampaignBriefing({
      campaignContext,
      strategy,
      locale: "en",
    });
    const requiredIds = [
      "executive-summary",
      "top-decisions",
      "business-impact",
      "customer-needs",
      "risks-and-unknowns",
      "approval-summary",
    ];
    for (const id of requiredIds) {
      expect(briefing.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(briefing.decisions.length).toBeGreaterThan(0);
  });
});

describe("collectMarketingIntelligenceGraph export", () => {
  it("matches buildMarketingIntelligenceGraph", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const a = buildMarketingIntelligenceGraph({
      reasoningGraph: execCtx.reasoningGraph!,
      campaignContext,
    });
    const b = collectMarketingIntelligenceGraph({
      reasoningGraph: execCtx.reasoningGraph!,
      campaignContext,
    });
    expect(a.businessReality.id).toBe(b.businessReality.id);
  });
});
