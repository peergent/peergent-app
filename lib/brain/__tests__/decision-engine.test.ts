import { beforeEach, describe, expect, it } from "vitest";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  executeCompanyUnderstanding,
  executeWebsiteUnderstanding,
  executeCompetitorUnderstanding,
  executeStrategy,
  buildResearchGraph,
  buildReasoningGraph,
  buildStrategyGraph,
  mapStrategyGraphToBrainOutput,
  buildDecisionsFromStrategyGraph,
  validateDecisionCollection,
  presentTopDecisions,
  buildExecutiveCampaignBriefing,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
  resetDefaultResearchRepository,
  resetDefaultReasoningRepository,
} from "@/lib/brain";
import { containsGenericMarketingPhrase } from "@/lib/brain/strategy/generic-marketing-phrases";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { resolveStrategySources } from "@/lib/brain/strategy/strategy-sources";

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

  return { execCtx, campaignContext, assembly };
}

describe("Decision Engine — Sprint 10.2", () => {
  beforeEach(() => {
    resetDefaultResearchRepository();
    resetDefaultReasoningRepository();
  });

  it("builds decisions from strategy graph with strategy direction", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const sources = resolveStrategySources(execCtx);
    const graph = buildStrategyGraph({
      sources,
      companySnapshot: execCtx.companySnapshot,
      campaignContext,
      locale: "en",
    });
    const collection = buildDecisionsFromStrategyGraph({ graph, campaignContext, locale: "en" });

    expect(collection.decisions.length).toBeGreaterThanOrEqual(3);
    expect(collection.decisions.some((d) => d.category === "strategy_direction")).toBe(true);
    expect(validateDecisionCollection(collection).valid).toBe(true);
  });

  it("maps strategy output to decision records and brain decisions", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const sources = resolveStrategySources(execCtx);
    const graph = buildStrategyGraph({
      sources,
      companySnapshot: execCtx.companySnapshot,
      campaignContext,
      locale: "en",
    });
    const output = mapStrategyGraphToBrainOutput({
      graph,
      campaignContext,
      organizationId: PEERGENT_DEMO_ORG_ID,
      locale: "en",
    });

    expect(output.decisionRecords?.length).toBeGreaterThanOrEqual(3);
    expect(output.decisions.length).toBe(output.decisionRecords?.length);
    expect(output.decisions.every((d) => d.rationale.length > 20)).toBe(true);
  });

  it("decisions use consultant voice and confidence bands", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const strategy = executeStrategy(execCtx);

    for (const decision of strategy.decisionRecords ?? []) {
      expect(decision.recommendation).toMatch(/^I recommend|^I'm not recommending/i);
      expect(["very_high", "high", "medium", "low"]).toContain(decision.confidence);
      expect(decision.customerChallenges.length + decision.alternativesRejected.length).toBeGreaterThan(0);
    }
  });

  it("decisions avoid generic marketing phrases", () => {
    const { execCtx } = fullPipelineContext();
    const strategy = executeStrategy(execCtx);
    const text = (strategy.decisionRecords ?? [])
      .map((d) => `${d.recommendation} ${d.reasoning} ${d.summary}`)
      .join("\n");
    expect(containsGenericMarketingPhrase(text)).toBe(false);
  });

  it("decisions include dependency relationships", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const strategy = executeStrategy(execCtx);
    const channelDecision = strategy.decisionRecords?.find((d) => d.category === "channel_choice");
    const contentDecision = strategy.decisionRecords?.find((d) => d.category === "content_direction");

    expect(channelDecision?.dependencies.some((d) => d.decisionId === "dec-strategy-direction")).toBe(true);
    if (contentDecision) {
      expect(contentDecision.dependencies.length).toBeGreaterThan(0);
    }
  });

  it("executive briefing is decision-driven", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const strategy = executeStrategy(execCtx);
    const briefing = buildExecutiveCampaignBriefing({
      campaignContext,
      strategy,
      locale: "en",
    });

    const requiredSectionIds = [
      "executive-summary",
      "top-decisions",
      "business-impact",
      "customer-needs",
      "risks-and-unknowns",
      "approval-summary",
    ];

    for (const id of requiredSectionIds) {
      expect(briefing.sections.some((s) => s.id === id)).toBe(true);
    }

    expect(briefing.topDecisions.length).toBeGreaterThan(0);
    expect(briefing.decisions.length).toBeGreaterThan(0);
    expect(briefing.requiredDecisions.length).toBeGreaterThan(0);
  });

  it("presentTopDecisions prioritizes strategy and channel decisions", () => {
    const { execCtx, campaignContext } = fullPipelineContext();
    const sources = resolveStrategySources(execCtx);
    const graph = buildStrategyGraph({
      sources,
      companySnapshot: execCtx.companySnapshot,
      campaignContext,
      locale: "en",
    });
    const collection = buildDecisionsFromStrategyGraph({ graph, campaignContext, locale: "en" });
    const top = presentTopDecisions(collection, false, 3);

    expect(top[0]?.category).toBe("strategy_direction");
  });
});
