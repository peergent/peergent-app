import { beforeEach, describe, expect, it } from "vitest";
import { buildCompanyGraph, resetDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  buildResearchBrainGraph,
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
} from "@/lib/brain/layers/research";
import {
  buildReasoningBrainGraph,
  resetDefaultReasoningBrainRepository,
} from "@/lib/brain/layers/reasoning";
import {
  buildMarketingIntelligenceBrainGraph,
  resetDefaultMarketingIntelligenceBrainRepository,
} from "@/lib/brain/layers/marketing-intelligence";
import {
  buildStrategyBrainGraph,
  resetDefaultStrategyBrainRepository,
} from "@/lib/brain/layers/strategy";
import {
  buildPlanningBrainGraph,
  buildPlanningBrainGraphOutput,
  validatePlanningBrainGraph,
  planningBrainContract,
  resetDefaultPlanningBrainRepository,
  resetPlanningBrainLayerCounters,
  getDefaultPlanningBrainRepository,
  assertNoCreativeGeneration,
  assertNoExecution,
  assertNoFabricatedProgress,
  assertNoPlanningCompanyMutation,
  assertNoStrategicDecision,
  assertNoInventedObjectives,
  enforcePlanningConfidenceCeiling,
  computeInvalidationScope,
  operationalizeBudget,
  containsCreativeLanguage,
} from "@/lib/brain/layers/planning";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
import type { CompanyGraph } from "@/lib/brain/layers/company/types";
import type { StrategyBrainGraph } from "@/lib/brain/layers/strategy/brain-types";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";

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
  selectedChannels: ["LinkedIn", "Google Search"] as const,
};

function pipelineCompanyGraph(): CompanyGraph {
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
  const brandGraph = collectBrandGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    websiteSnapshot: website,
    upstreamOutputs: {},
  });
  return buildCompanyGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en",
    companySnapshot: assembly.companySnapshot,
    brandGraph,
    author: "test",
    changeReason: "Planning brain test fixture",
  });
}

async function pipelineStrategyGraph(): Promise<{ companyGraph: CompanyGraph; strategyGraph: StrategyBrainGraph }> {
  const companyGraph = pipelineCompanyGraph();
  const researchGraph = await buildResearchBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
  });
  const reasoningGraph = buildReasoningBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
    researchGraph,
  });
  const miGraph = buildMarketingIntelligenceBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
    researchGraph,
    reasoningGraph,
    selectedChannels: ["LinkedIn", "Google Search"],
  });
  const strategyGraph = buildStrategyBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph: miGraph,
    availableBudget: { amount: 10000, currency: "EUR" },
    timeHorizon: "90 days",
  });
  return { companyGraph, strategyGraph };
}

describe("Planning Brain", () => {
  beforeEach(() => {
    resetDefaultCompanyRepository();
    resetDefaultResearchBrainRepository();
    resetDefaultResearchProviderRegistry();
    resetDefaultReasoningBrainRepository();
    resetDefaultMarketingIntelligenceBrainRepository();
    resetDefaultStrategyBrainRepository();
    resetDefaultPlanningBrainRepository();
    resetPlanningBrainLayerCounters();
  });

  it("consumes PlanningStrategyInput", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      strategyGraph,
    });
    expect(graph.strategyInput.selectedChannels.length).toBeGreaterThan(0);
    expect(graph.strategyVersionRef).toBe(strategyGraph.version);
  });

  it("cannot invent strategic objectives", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      strategyGraph,
    });
    expect(() =>
      assertNoInventedObjectives(
        graph.planningObjectives,
        graph.strategyInput.selectedObjectives,
        graph.planningObjectives.map((o) => o.strategyObjectiveId)
      )
    ).not.toThrow();
  });

  it("creates campaign decomposition", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.campaignPlans.length).toBeGreaterThan(0);
    expect(graph.campaignPlans[0]?.objective).toBeTruthy();
  });

  it("creates workstreams", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.workstreams.length).toBeGreaterThan(0);
    expect(graph.workstreams.some((w) => w.name.includes("Creative"))).toBe(true);
  });

  it("creates work packages", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.workPackages.length).toBeGreaterThan(0);
    expect(graph.workPackages[0]?.assignedBrain).toBeTruthy();
  });

  it("generates milestones", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.milestones.some((m) => m.title.includes("Strategy approved"))).toBe(true);
  });

  it("plans deliverables", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.deliverables.length).toBeGreaterThan(0);
    expect(graph.deliverables[0]?.validationRequired).toBe(true);
  });

  it("CreativeBriefInput completeness", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.creativeBriefInputs.length).toBeGreaterThan(0);
    const brief = graph.creativeBriefInputs[0]!;
    expect(brief.positioningDirection).toBeTruthy();
    expect(brief.messagingDirection).toBeTruthy();
    expect(brief.targetAudience.length).toBeGreaterThan(0);
  });

  it("builds dependency graph", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.dependencies.length).toBeGreaterThan(0);
    expect(graph.dependencies.some((d) => d.blocking)).toBe(true);
  });

  it("calculates critical path", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.criticalPath.criticalPathWorkPackages.length).toBeGreaterThan(0);
    expect(graph.criticalPath.scheduleRisk).toBeTruthy();
  });

  it("identifies parallel work", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.parallelGroups).toBeDefined();
  });

  it("creates approval gates", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.approvalGates.some((g) => g.kind === "strategy_review" || g.kind === "creative_review")).toBe(true);
  });

  it("creates review checkpoints", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.reviewCheckpoints.length).toBeGreaterThan(0);
  });

  it("tracks resource assumptions", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.resourceAssumptions.some((r) => r.statement.includes("Budget"))).toBe(true);
  });

  it("missing integration becomes context gap", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.contextGaps.some((g) => g.missingContext.toLowerCase().includes("tracking"))).toBe(true);
  });

  it("operationalizes budget without reallocating Strategy", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const result = operationalizeBudget({
      ctx: {
        planningInput: strategyGraph.planningInputs,
        decisions: strategyGraph.strategicDecisions,
        campaignObjectives: strategyGraph.campaignObjectives,
        audienceStrategy: strategyGraph.audienceStrategy,
        channelStrategy: strategyGraph.channelStrategy,
        positioningStrategy: strategyGraph.positioningStrategy,
        messagingDirection: strategyGraph.messagingStrategyDirection,
        funnelStrategy: strategyGraph.funnelStrategy,
        offerDirection: strategyGraph.offerStrategyDirection,
        budgetStrategy: strategyGraph.budgetStrategy,
        kpis: strategyGraph.kpiFramework.map((k) => k.name),
        tradeoffs: strategyGraph.strategicTradeoffs,
        risks: strategyGraph.strategicRisks,
        assumptions: strategyGraph.strategicAssumptions,
        approval: strategyGraph.approval,
      },
      campaignIds: ["camp-1"],
    });
    expect(result.escalation).toBe(false);
    expect(result.labels.length).toBeGreaterThan(0);
    expect(result.labels.join(" ")).not.toMatch(/reallocate/i);
  });

  it("schedules with real deadline", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      strategyGraph,
      customerDeadline: "2026-12-31",
    });
    expect(graph.scheduleWindows.some((w) => w.source === "customer_deadline")).toBe(true);
    expect(graph.campaignPlans[0]?.endWindow).toBe("2026-12-31");
  });

  it("does not fabricate date when deadline missing", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.campaignPlans[0]?.startWindow).toBeNull();
    expect(graph.scheduleWindows.every((w) => w.type !== "fixed" || w.source === "customer_deadline")).toBe(true);
  });

  it("generates planning risks", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.planningRisks.length).toBeGreaterThan(0);
  });

  it("allows operational decisions", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.planningDecisions.some((d) => d.decision.includes("approval"))).toBe(true);
  });

  it("blocks strategic decisions", () => {
    expect(() => assertNoStrategicDecision("reposition the brand for a new target audience")).toThrow();
  });

  it("marks Validation handoff on deliverables", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.deliverables.every((d) => d.validationRequired === true || d.type === "Landing page")).toBe(true);
  });

  it("produces execution preparation", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.executionPreparations.length).toBeGreaterThan(0);
    expect(graph.executionPreparations[0]?.requiredValidation).toBe(true);
  });

  it("supports plan versioning", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const o1 = buildPlanningBrainGraphOutput({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    const o2 = buildPlanningBrainGraphOutput({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      strategyGraph,
      supersedesSnapshotId: o1.snapshot.id,
    });
    expect(o2.graph.supersedes).toBe(o1.snapshot.id);
    expect(getDefaultPlanningBrainRepository().getHistory({ organizationId: PEERGENT_DEMO_ORG_ID }).entries.length).toBe(2);
  });

  it("supports targeted invalidation", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      strategyGraph,
      invalidationTrigger: "budget_change",
      changeReason: "Budget updated",
    });
    const scope = computeInvalidationScope({
      trigger: "budget_change",
      reason: "Budget updated",
      graph,
    });
    expect(scope.workPackageIds.length).toBeGreaterThan(0);
    expect(graph.invalidationScopes.length).toBe(1);
  });

  it("enforces confidence ceiling", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const lowStrategy = { ...strategyGraph, confidence: "low" as const, planningInputs: { ...strategyGraph.planningInputs, confidence: "low" as const } };
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph: lowStrategy });
    expect(graph.confidence).toBe("low");
    expect(enforcePlanningConfidenceCeiling("high", ["low"])).toBe("low");
  });

  it("does not generate Creative content", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    assertNoCreativeGeneration(graph);
    expect(containsCreativeLanguage("hook: buy now")).toBe(true);
  });

  it("does not execute", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    assertNoExecution(graph);
  });

  it("does not write Memory", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    expect(graph.memoryCheckpointRecommendations.length).toBeGreaterThan(0);
    // Planning only recommends checkpoints — no memory graph mutation in output
    expect(graph).not.toHaveProperty("memoryWrites");
  });

  it("persists repository history", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    buildPlanningBrainGraphOutput({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    const repo = getDefaultPlanningBrainRepository();
    expect(repo.getLatestSnapshot({ organizationId: PEERGENT_DEMO_ORG_ID })).not.toBeNull();
  });

  it("integrates with ProjectBrainContract", async () => {
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.planning?.id).toBe("planning");
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const context: BrainContextPackage = {
      organizationId: PEERGENT_DEMO_ORG_ID,
      projectId: "proj-1",
      episodeId: "ep-1",
      locale: "en",
      slices: {},
    };
    const result = await planningBrainContract.execute({
      context,
      payload: { companyGraph, strategyBrainGraph: strategyGraph },
    });
    expect(result.status).toMatch(/completed|waiting_approval/);
    expect(result.output?.decisionIds.length).toBeGreaterThan(0);
  });

  it("does not fabricate progress", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const graph = buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    assertNoFabricatedProgress(graph);
    const validation = validatePlanningBrainGraph(graph);
    expect(validation.valid).toBe(true);
  });

  it("does not mutate CompanyGraph", async () => {
    const { companyGraph, strategyGraph } = await pipelineStrategyGraph();
    const versionBefore = companyGraph.version;
    buildPlanningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, strategyGraph });
    assertNoPlanningCompanyMutation(versionBefore, companyGraph.version);
  });
});
