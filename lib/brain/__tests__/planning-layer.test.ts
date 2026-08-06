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
  buildMarketingIntelligenceGraph,
  buildStrategyGraph,
  buildDecisionsFromStrategyGraph,
  buildPlanningGraph,
  planFromBrainInputs,
  validatePlanningGraph,
  assessPlanningReadiness,
  analyzePlanningDependencies,
  buildPlanningTimeline,
  buildPlanningRisks,
  presentExecutionPlanSummary,
  buildExecutiveCampaignBriefing,
  collectBrandGraph,
  PlanningLayer,
  resetDefaultPlanningRepository,
  resetDefaultResearchRepository,
  resetDefaultReasoningRepository,
  resetDefaultMarketingIntelligenceRepository,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
  PLANNING_LAYER_VERSION,
  PLANNING_MODULE_SPECS,
} from "@/lib/brain";
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
  selectedChannels: ["LinkedIn"] as const,
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

  const companyOut = executeCompanyUnderstanding({ companySnapshot: assembly.companySnapshot, locale: "en" });
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

  return { execCtx, campaignContext, assembly, upstreamOutputs, website };
}

describe("Planning Brain Layer — Sprint 11.0", () => {
  beforeEach(() => {
    resetDefaultResearchRepository();
    resetDefaultReasoningRepository();
    resetDefaultMarketingIntelligenceRepository();
    resetDefaultPlanningRepository();
  });

  function buildFullPlanningGraph() {
    const { execCtx, campaignContext, assembly, website } = fullPipelineContext();
    const researchGraph = buildResearchGraph({
      companySnapshot: assembly.companySnapshot,
      campaignContext,
      upstreamOutputs: execCtx.upstreamOutputs,
    });
    const reasoningGraph = buildReasoningGraph({ researchGraph, campaignContext });
    const miGraph = buildMarketingIntelligenceGraph({ reasoningGraph, researchGraph, campaignContext, locale: "en" });
    const sources = resolveStrategySources({ ...execCtx, researchGraph, reasoningGraph, marketingIntelligenceGraph: miGraph });
    const strategyGraph = buildStrategyGraph({
      sources,
      companySnapshot: execCtx.companySnapshot,
      campaignContext,
      locale: "en",
    });
    const decisionCollection = buildDecisionsFromStrategyGraph({ graph: strategyGraph, campaignContext, locale: "en" });
    const brandGraph = collectBrandGraph({
      companySnapshot: assembly.companySnapshot,
      campaignContext,
      websiteSnapshot: website,
      upstreamOutputs: execCtx.upstreamOutputs,
    });

    const graph = planFromBrainInputs({
      organizationId: PEERGENT_DEMO_ORG_ID,
      campaignContext,
      strategyGraph,
      decisionCollection,
      brandGraph,
      marketingIntelligence: miGraph,
      researchGraph,
      reasoningGraph,
      locale: "en",
    });

    return { graph, campaignContext, strategyGraph, decisionCollection, execCtx };
  }

  it("defines planning layer version and modules", () => {
    expect(PLANNING_LAYER_VERSION).toBe("1.0.0");
    expect(PLANNING_MODULE_SPECS.length).toBeGreaterThanOrEqual(5);
  });

  it("builds PlanningGraph from decisions and strategy", () => {
    const { graph } = buildFullPlanningGraph();
    expect(graph.objectives.length).toBeGreaterThan(0);
    expect(graph.executionStages.length).toBeGreaterThanOrEqual(5);
    expect(graph.planningDecisions.length).toBeGreaterThan(0);
    expect(graph.version).toBe(PLANNING_LAYER_VERSION);
  });

  it("plans in outcomes not bare tasks", () => {
    const { graph } = buildFullPlanningGraph();
    for (const stage of graph.executionStages) {
      expect(stage.businessPurpose.length).toBeGreaterThan(10);
      expect(stage.reason.length).toBeGreaterThan(10);
      expect(stage.title).not.toMatch(/^Task:/i);
    }
  });

  it("validates planning graph structure", () => {
    const { graph } = buildFullPlanningGraph();
    const result = validatePlanningGraph(graph);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("dependency engine computes critical path", () => {
    const { graph } = buildFullPlanningGraph();
    expect(graph.criticalPath.length).toBeGreaterThan(0);
    expect(graph.dependencies.length).toBeGreaterThan(0);
    expect(graph.dependencyAnalysis.circularDependencies).toHaveLength(0);
  });

  it("readiness engine produces explained assessment", () => {
    const { graph, campaignContext, strategyGraph, decisionCollection, execCtx } = buildFullPlanningGraph();
    const readiness = assessPlanningReadiness({
      strategyGraph,
      decisionCollection,
      campaignContext,
      brandGraph: null,
      reasoningGraph: execCtx.reasoningGraph ?? undefined,
      locale: "en",
      missingRequirements: ["Tracking"],
    });
    expect(["ready", "mostly_ready", "waiting", "blocked"]).toContain(readiness.level);
    expect(readiness.checks.length).toBeGreaterThanOrEqual(8);
    expect(readiness.summary.length).toBeGreaterThan(10);
    expect(graph.readiness.summary.length).toBeGreaterThan(10);
  });

  it("timeline intelligence describes intent not appointments", () => {
    const { graph } = buildFullPlanningGraph();
    expect(graph.estimatedTimeline.length).toBeGreaterThan(0);
    for (const phase of graph.estimatedTimeline) {
      expect(phase.intent.length).toBeGreaterThan(15);
      expect(phase.phase.length).toBeGreaterThan(2);
    }
  });

  it("risk engine identifies execution risks with mitigation", () => {
    const { graph } = buildFullPlanningGraph();
    expect(graph.risks.length).toBeGreaterThan(0);
    for (const risk of graph.risks) {
      expect(risk.mitigation.length).toBeGreaterThan(5);
      expect(risk.fallback.length).toBeGreaterThan(5);
      expect(risk.reviewTrigger.length).toBeGreaterThan(3);
    }
  });

  it("stores graph in repository via PlanningLayer", () => {
    const { graph, campaignContext, strategyGraph, decisionCollection, execCtx } = buildFullPlanningGraph();
    const layer = new PlanningLayer();
    const { graph: stored } = layer.planAndStore({
      organizationId: PEERGENT_DEMO_ORG_ID,
      campaignContext,
      strategyGraph,
      decisionCollection,
      researchGraph: execCtx.researchGraph ?? undefined,
      reasoningGraph: execCtx.reasoningGraph ?? undefined,
      locale: "en",
    });
    expect(stored.version).toBe(graph.version);
    expect(layer.getLatestGraph({ organizationId: PEERGENT_DEMO_ORG_ID, campaignId: campaignContext.projectId })?.version).toBe(
      graph.version
    );
  });

  it("extends executive briefing with execution plan section", () => {
    const { graph, campaignContext, execCtx } = buildFullPlanningGraph();
    const strategy = executeStrategy(execCtx);
    const briefing = buildExecutiveCampaignBriefing({
      campaignContext,
      strategy,
      planningGraph: graph,
      locale: "en",
    });
    expect(briefing.sections.some((s) => s.id === "execution-plan")).toBe(true);
    const planSection = briefing.sections.find((s) => s.id === "execution-plan");
    expect(planSection?.summary).toMatch(/Emma will run/i);
    expect(presentExecutionPlanSummary({ graph, locale: "en" })).toMatch(/business value/i);
  });

  it("does not generate creative assets", () => {
    const { graph } = buildFullPlanningGraph();
    const serialized = JSON.stringify(graph);
    expect(serialized).not.toMatch(/linkedin post copy|email body|ad creative/i);
    expect(graph.executionStages.some((s) => s.ownerBrain === "creative")).toBe(true);
  });
});
