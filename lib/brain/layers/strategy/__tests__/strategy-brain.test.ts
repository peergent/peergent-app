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
  buildStrategyBrainGraphOutput,
  validateStrategyBrainGraph,
  strategyBrainContract,
  resetDefaultStrategyBrainRepository,
  resetStrategyBrainLayerCounters,
  getDefaultStrategyBrainRepository,
  assertNoCreativeLanguage,
  assertNoPlanningLanguage,
  assertNoResearchCalls,
  assertNoCompanyMutation,
  enforceStrategyConfidenceCeiling,
  containsCreativeLanguage,
  containsPlanningLanguage,
} from "@/lib/brain/layers/strategy";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
import type { CompanyGraph } from "@/lib/brain/layers/company/types";
import type { ResearchBrainGraph } from "@/lib/brain/layers/research/brain-types";
import type { ReasoningBrainGraph } from "@/lib/brain/layers/reasoning/brain-types";
import type { MarketingIntelligenceBrainGraph } from "@/lib/brain/layers/marketing-intelligence/brain-types";
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
    changeReason: "Strategy brain test fixture",
  });
}

async function pipelineUpstream(): Promise<{
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  miGraph: MarketingIntelligenceBrainGraph;
}> {
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
  return { companyGraph, researchGraph, reasoningGraph, miGraph };
}

describe("Strategy Brain", () => {
  beforeEach(() => {
    resetDefaultCompanyRepository();
    resetDefaultResearchBrainRepository();
    resetDefaultResearchProviderRegistry();
    resetDefaultReasoningBrainRepository();
    resetDefaultMarketingIntelligenceBrainRepository();
    resetDefaultStrategyBrainRepository();
    resetStrategyBrainLayerCounters();
  });

  it("consumes MarketingStrategyInput via marketing intelligence graph", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    expect(miGraph.strategyInputs.topOpportunities.length).toBeGreaterThanOrEqual(0);

    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
      marketingStrategyInput: miGraph.strategyInputs,
    });

    expect(graph.marketingIntelligenceVersion).toBe(miGraph.version);
    expect(graph.strategicProblems.length).toBeGreaterThan(0);
  });

  it("selects opportunities and preserves rejected alternatives", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    const selected = graph.opportunitySelections.filter((o) => o.status === "selected");
    const rejected = graph.opportunitySelections.filter((o) => o.status === "rejected");
    expect(selected.length).toBeGreaterThan(0);
    expect(selected.length).toBeLessThanOrEqual(3);
    if (miGraph.opportunitySignals.length > 3) {
      expect(rejected.length + graph.rejectedAlternatives.length).toBeGreaterThan(0);
    }
  });

  it("prioritizes audience", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    const primary = graph.audienceStrategy.find((a) => a.priority === "primary");
    expect(primary).toBeDefined();
    expect(primary?.whySelected).toBeTruthy();
  });

  it("chooses positioning direction", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    expect(graph.positioningStrategy.strategicAngle).toBeTruthy();
    expect(graph.positioningStrategy.positioningStatement).not.toMatch(/headline|ad copy/i);
  });

  it("chooses channels without creating campaigns", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    const selected = graph.channelStrategy.filter((c) => c.selected);
    expect(selected.length).toBeGreaterThan(0);
    for (const ch of selected) {
      expect(ch.role).toBeTruthy();
      expect(ch.objective).not.toMatch(/campaign id|publish date|creative concept/i);
    }
  });

  it("builds budget strategy with known budget", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
      availableBudget: { amount: 10000, currency: "EUR" },
    });

    expect(graph.budgetStrategy.budgetRequired).toBe(false);
    expect(graph.budgetStrategy.totalBudget).toBe(10000);
    expect(graph.budgetStrategy.allocation.length).toBeGreaterThan(0);
  });

  it("returns budget missing state without fabrication", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    expect(graph.budgetStrategy.budgetRequired).toBe(true);
    expect(graph.budgetStrategy.totalBudget).toBeNull();
    expect(graph.escalations.some((e) => e.kind === "budget_missing")).toBe(true);
  });

  it("builds funnel strategy", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    expect(graph.funnelStrategy.primaryFunnelModel).toBeTruthy();
    expect(graph.funnelStrategy.stageObjectives.length).toBeGreaterThan(0);
  });

  it("produces messaging direction without final copy", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    expect(graph.messagingStrategyDirection.primaryMessageTerritory).toBeTruthy();
    expect(JSON.stringify(graph.messagingStrategyDirection)).not.toMatch(/subject line:|hook:/i);
    assertNoCreativeLanguage(graph);
  });

  it("KPI framework without fake numerical targets", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    expect(graph.kpiFramework.length).toBeGreaterThan(0);
    for (const kpi of graph.kpiFramework) {
      expect(kpi.target).toBeNull();
      expect(kpi.baseline).toBeNull();
    }
  });

  it("defines campaign objectives", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
      timeHorizon: "90 days",
    });

    expect(graph.campaignObjectives.length).toBeGreaterThan(0);
    expect(graph.campaignObjectives[0]?.timeHorizon).toBe("90 days");
  });

  it("stores strategic trade-offs", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    expect(graph.strategicTradeoffs.length).toBeGreaterThan(0);
    expect(graph.strategicTradeoffs[0]?.benefit).toBeTruthy();
    expect(graph.strategicTradeoffs[0]?.cost).toBeTruthy();
  });

  it("tracks strategic assumptions", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    for (const assumption of graph.strategicAssumptions) {
      expect(assumption.statement).toBeTruthy();
      expect(assumption.validationMethod).toBeTruthy();
    }
  });

  it("creates strategic risks", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    expect(graph.strategicRisks.length).toBeGreaterThan(0);
    expect(graph.strategicRisks[0]?.mitigationDirection).toBeTruthy();
  });

  it("enforces confidence ceiling from upstream", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const lowMi: MarketingIntelligenceBrainGraph = { ...miGraph, confidence: "low" };
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: lowMi,
    });

    expect(graph.confidence).toBe("low");
    expect(enforceStrategyConfidenceCeiling("high", ["low"])).toBe("low");
  });

  it("creates blocking escalation when critical input missing", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const reasoningWithEscalation: ReasoningBrainGraph = {
      ...reasoningGraph,
      escalations: [
        {
          id: "esc-1",
          kind: "customer_confirmation_required",
          title: "Confirm target market",
          reason: "Audience conflict requires customer input",
          relatedContradictionId: null,
          relatedEvidence: [],
          priority: "high",
          requiresCustomerInput: true,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph: reasoningWithEscalation,
      marketingIntelligenceGraph: miGraph,
    });

    expect(graph.escalations.some((e) => e.blocking)).toBe(true);
  });

  it("requires approval for major strategic decisions", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
      approvalPolicy: "major_only",
    });

    expect(graph.approval.requiresApproval).toBe(true);
    expect(graph.approval.approvalKind).toBe("strategy_review");
  });

  it("PlanningStrategyInput completeness", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
      timeHorizon: "Q3",
    });

    const p = graph.planningInputs;
    expect(p.selectedChannels.length).toBeGreaterThan(0);
    expect(p.positioningDirection).toBeTruthy();
    expect(p.messagingDirection).toBeTruthy();
    expect(p.funnelStrategy).toBeTruthy();
    expect(p.offerDirection).toBeTruthy();
    expect(p.kpis.length).toBeGreaterThan(0);
    expect(p.timeHorizon).toBe("Q3");
  });

  it("does not generate planning artifacts", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    assertNoPlanningLanguage(graph);
    expect(containsPlanningLanguage("content calendar week 1")).toBe(true);
  });

  it("does not generate creative output", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    assertNoCreativeLanguage(graph);
    expect(containsCreativeLanguage("hook: Buy now today")).toBe(true);
  });

  it("does not perform research", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    assertNoResearchCalls(graph);
  });

  it("does not mutate CompanyGraph", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const versionBefore = companyGraph.version;
    buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });
    assertNoCompanyMutation(versionBefore, companyGraph.version);
  });

  it("persists repository version history", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const output1 = await buildStrategyBrainGraphOutput({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });
    const output2 = await buildStrategyBrainGraphOutput({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
    });

    const repo = getDefaultStrategyBrainRepository();
    const history = repo.getHistory({ organizationId: PEERGENT_DEMO_ORG_ID });
    expect(history.entries.length).toBe(2);
    expect(output1.snapshot.id).not.toBe(output2.snapshot.id);
  });

  it("integrates with ProjectBrainContract", async () => {
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.strategy).toBeDefined();
    expect(registry.strategy?.id).toBe("strategy");

    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const context: BrainContextPackage = {
      organizationId: PEERGENT_DEMO_ORG_ID,
      projectId: "proj-1",
      episodeId: "ep-1",
      locale: "en",
      slices: {},
    };

    const result = await strategyBrainContract.execute({
      context,
      payload: {
        companyGraph,
        researchBrainGraph: researchGraph,
        reasoningBrainGraph: reasoningGraph,
        marketingIntelligenceBrainGraph: miGraph,
      },
    });

    expect(result.status).toMatch(/completed|waiting_approval/);
    expect(result.output?.decisionIds.length).toBeGreaterThan(0);
  });

  it("avoids fabricated strategic certainty", async () => {
    const { companyGraph, researchGraph, reasoningGraph, miGraph } = await pipelineUpstream();
    const graph = buildStrategyBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: { ...miGraph, confidence: "low" },
    });

    const validation = validateStrategyBrainGraph(graph);
    expect(validation.valid).toBe(true);
    for (const d of graph.strategicDecisions) {
      expect(d.confidence).not.toBe("high");
    }
  });
});
