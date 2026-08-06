import { beforeEach, describe, expect, it, vi } from "vitest";
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
  planFromBrainInputs,
  validatePlanningGraph,
  scorePlanningQuality,
  presentExecutionPlanSummary,
  buildExecutiveCampaignBriefing,
  collectBrandGraph,
  ensureCampaignPlanning,
  mergeCampaignOutputsWithPlanning,
  computePlanningCacheIdentity,
  isStoredCampaignPlanningCompatible,
  mapPlanningGraphToBrainOutput,
  CAMPAIGN_PLANNING_CAPABILITY_ID,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
  resetDefaultResearchRepository,
  resetDefaultReasoningRepository,
  resetDefaultMarketingIntelligenceRepository,
  resetDefaultPlanningRepository,
} from "@/lib/brain";
import { isGenericTaskListPlanning } from "@/lib/brain/layers/planning/planning-presenter";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { resolveStrategySources } from "@/lib/brain/strategy/strategy-sources";
import {
  readCampaignBrainOutputs,
  mergeCampaignBrainOutputs,
} from "@/lib/office/campaign/campaign-brain-outputs";
import { persistCampaignBrainOutputs } from "@/lib/office/campaign/live-campaign-context-store";
import {
  loadMarketingWorkspaceState,
  saveMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import { buildCampaignExecutiveBriefing } from "@/lib/peer-experience/marketing/campaign-review/build-campaign-executive-briefing";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review/campaign-review-types";

const PEER = "emma";
const peergentInput = {
  peerId: PEER as const,
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

function installSessionStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
}

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
      peerId: PEER,
      capabilityId: "strategy",
      actorId: "test",
      campaignContext,
      upstreamOutputs,
    },
    campaignContext,
    upstreamOutputs,
  });

  return { execCtx, campaignContext, assembly, upstreamOutputs, website, project };
}

function buildStrategyAndPlanning() {
  const { execCtx, campaignContext, assembly, website, project } = fullPipelineContext();
  const researchGraph = buildResearchGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    upstreamOutputs: execCtx.upstreamOutputs,
  });
  const reasoningGraph = buildReasoningGraph({ researchGraph, campaignContext });
  const miGraph = buildMarketingIntelligenceGraph({
    reasoningGraph,
    researchGraph,
    campaignContext,
    locale: "en",
  });
  const sources = resolveStrategySources({
    ...execCtx,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph: miGraph,
  });
  const strategyGraph = buildStrategyGraph({
    sources,
    companySnapshot: execCtx.companySnapshot,
    campaignContext,
    locale: "en",
  });
  const decisionCollection = buildDecisionsFromStrategyGraph({
    graph: strategyGraph,
    campaignContext,
    locale: "en",
  });
  const brandGraph = collectBrandGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    websiteSnapshot: website,
    upstreamOutputs: execCtx.upstreamOutputs,
  });
  const strategy = executeStrategy(execCtx);
  const graph = planFromBrainInputs({
    organizationId: PEERGENT_DEMO_ORG_ID,
    campaignContext,
    strategyGraph,
    decisionCollection,
    brandGraph,
    locale: "en",
  });
  return { strategy, graph, campaignContext, project, brandGraph, strategyGraph, decisionCollection };
}

function liveProjectWithSetup(project: MarketingProject): MarketingProject {
  return {
    ...project,
    peerId: PEER,
    campaignSetup: {
      ...project.campaignSetup!,
      campaignContextVersion: 1,
    },
  };
}

function reviewItemsReady(): CampaignReviewItem[] {
  return [
    {
      id: "strategy-1",
      artifactType: "campaign_strategy",
      status: "prepared",
      preview: "Strategy ready",
      title: "Strategy",
    },
  ];
}

describe("Campaign Planning Integration — Sprint 11.1", () => {
  beforeEach(() => {
    resetDefaultResearchRepository();
    resetDefaultReasoningRepository();
    resetDefaultMarketingIntelligenceRepository();
    resetDefaultPlanningRepository();
    installSessionStorageMock();
    saveMarketingWorkspaceState(PEER, { projects: [] });
  });

  it("builds PlanningGraph from valid StrategyGraph + DecisionCollection", () => {
    const { graph } = buildStrategyAndPlanning();
    expect(validatePlanningGraph(graph).valid).toBe(true);
    expect(graph.planningDecisions.length).toBeGreaterThan(0);
  });

  it("auto-builds planning after valid strategy decisions via ensureCampaignPlanning", () => {
    const { strategy, campaignContext, project } = buildStrategyAndPlanning();
    const result = ensureCampaignPlanning({
      project,
      campaignContext,
      strategyOutput: strategy,
      organizationId: PEERGENT_DEMO_ORG_ID,
      locale: "en",
    });
    expect(result.status).toBe("completed");
    expect(result.graph).toBeDefined();
    expect(result.output?.capabilityId).toBe(CAMPAIGN_PLANNING_CAPABILITY_ID);
  });

  it("does not build planning before strategy output exists", () => {
    const { campaignContext, project } = buildStrategyAndPlanning();
    const result = ensureCampaignPlanning({
      project,
      campaignContext,
      strategyOutput: undefined as unknown as BrainStructuredOutput,
      organizationId: PEERGENT_DEMO_ORG_ID,
    });
    expect(result.status).toBe("waiting_for_input");
    expect(result.graph).toBeUndefined();
  });

  it("persists PlanningGraph with campaign via mergeCampaignOutputsWithPlanning", () => {
    const { strategy, project } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    const merged = mergeCampaignOutputsWithPlanning({
      project: liveProject,
      peerId: PEER,
      outputs: { strategy },
    });
    expect(merged.campaign_planning?.planningGraph).toBeDefined();
    expect(merged.campaign_planning?.planningMetadata?.planningCapabilityId).toBe(
      CAMPAIGN_PLANNING_CAPABILITY_ID
    );
  });

  it("reopens briefing and reuses stored PlanningGraph", () => {
    const { strategy, project, campaignContext } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    const contextVersion = liveProject.campaignSetup!.campaignContextVersion!;
    const planningResult = ensureCampaignPlanning({
      project: liveProject,
      campaignContext,
      strategyOutput: strategy,
      organizationId: PEERGENT_DEMO_ORG_ID,
    });
    const storedProject: MarketingProject = {
      ...liveProject,
      campaignSetup: {
        ...liveProject.campaignSetup!,
        campaignBrainOutputs: mergeCampaignBrainOutputs(
          undefined,
          { strategy, campaign_planning: planningResult.output! },
          contextVersion
        ),
      },
    };
    const reopen = ensureCampaignPlanning({
      project: storedProject,
      campaignContext,
      strategyOutput: strategy,
      organizationId: PEERGENT_DEMO_ORG_ID,
    });
    expect(reopen.reused).toBe(true);
    expect(reopen.output?.planningMetadata?.cacheReused).toBe(true);
  });

  it("cache reuse does not rebuild decisions or call provider (deterministic)", () => {
    const { strategy, project, campaignContext } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    const first = ensureCampaignPlanning({
      project: liveProject,
      campaignContext,
      strategyOutput: strategy,
      organizationId: PEERGENT_DEMO_ORG_ID,
    });
    const storedProject: MarketingProject = {
      ...liveProject,
      campaignSetup: {
        ...liveProject.campaignSetup!,
        campaignBrainOutputs: mergeCampaignBrainOutputs(undefined, {
          strategy,
          campaign_planning: first.output!,
        }, 1),
      },
    };
    const second = ensureCampaignPlanning({
      project: storedProject,
      campaignContext,
      strategyOutput: strategy,
      organizationId: PEERGENT_DEMO_ORG_ID,
    });
    expect(second.reused).toBe(true);
    expect(second.output?.planningMetadata?.planningSource).toBe("stored");
    expect(second.graph?.createdAt).toBe(first.graph?.createdAt);
  });

  it("strategy version change invalidates stored PlanningGraph", () => {
    const { strategy, project, campaignContext } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    const first = ensureCampaignPlanning({
      project: liveProject,
      campaignContext,
      strategyOutput: strategy,
      organizationId: PEERGENT_DEMO_ORG_ID,
    });
    const storedProject: MarketingProject = {
      ...liveProject,
      campaignSetup: {
        ...liveProject.campaignSetup!,
        campaignBrainOutputs: mergeCampaignBrainOutputs(undefined, {
          strategy,
          campaign_planning: first.output!,
        }, 1),
      },
    };
    const changedStrategy = { ...strategy, generatedAt: "2026-09-01T00:00:00.000Z" };
    expect(
      isStoredCampaignPlanningCompatible(storedProject, changedStrategy)
    ).toBe(false);
  });

  it("decision count change invalidates stored PlanningGraph", () => {
    const { strategy, project } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    const expected = computePlanningCacheIdentity({ project: liveProject, strategyOutput: strategy });
    const mutatedStrategy = {
      ...strategy,
      decisionRecords: strategy.decisionRecords?.slice(0, 1),
    };
    const mutatedExpected = computePlanningCacheIdentity({
      project: liveProject,
      strategyOutput: mutatedStrategy,
    });
    expect(expected.decisionCount).not.toBe(mutatedExpected.decisionCount);
  });

  it("context version mismatch clears brain outputs on read", () => {
    const { strategy, project } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    const stored: MarketingProject = {
      ...liveProject,
      campaignSetup: {
        ...liveProject.campaignSetup!,
        campaignContextVersion: 2,
        campaignBrainOutputs: mergeCampaignBrainOutputs(undefined, { strategy }, 1),
      },
    };
    expect(readCampaignBrainOutputs(stored).strategy).toBeUndefined();
  });

  it("planning remains distinct from campaignSchedule", () => {
    const { strategy, graph, project, campaignContext } = buildStrategyAndPlanning();
    const scheduledProject: MarketingProject = {
      ...liveProjectWithSetup(project),
      campaignSetup: {
        ...liveProjectWithSetup(project).campaignSetup!,
        campaignSchedule: {
          scheduledAt: "2026-09-01T09:00:00.000Z",
          scheduledDate: "2026-09-01",
          scheduledTime: "09:00",
          timezone: "Europe/Amsterdam",
          scheduledDecisionAt: "2026-08-15T00:00:00.000Z",
          source: "customer_scheduled",
          contextVersion: 1,
        },
      },
    };
    const result = ensureCampaignPlanning({
      project: scheduledProject,
      campaignContext,
      strategyOutput: strategy,
      organizationId: PEERGENT_DEMO_ORG_ID,
    });
    expect(result.graph?.estimatedTimeline).toBeDefined();
    expect(scheduledProject.campaignSetup?.campaignSchedule?.scheduledAt).toBe(
      "2026-09-01T09:00:00.000Z"
    );
    expect(JSON.stringify(graph)).not.toContain("scheduledAt");
  });

  it("PlanningGraph existence does not mark campaign scheduled, published, or active", () => {
    const { strategy, project, campaignContext } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    const result = ensureCampaignPlanning({
      project: liveProject,
      campaignContext,
      strategyOutput: strategy,
      organizationId: PEERGENT_DEMO_ORG_ID,
    });
    expect(result.status).toBe("completed");
    expect(liveProject.campaignSetup?.campaignSchedule).toBeUndefined();
    expect(liveProject.campaignSetup?.stepApprovals?.scheduled).toBeUndefined();
    expect(liveProject.campaignSetup?.campaignPublication).toBeUndefined();
  });

  it("execution plan section appears in executive briefing when planningGraph provided", () => {
    const { strategy, graph, campaignContext } = buildStrategyAndPlanning();
    const briefing = buildExecutiveCampaignBriefing({
      campaignContext,
      strategy,
      planningGraph: graph,
      locale: "en",
    });
    expect(briefing.sections.some((s) => s.id === "execution-plan")).toBe(true);
    expect(briefing.executionPlan).toBeDefined();
  });

  it("execution plan uses customer-facing language", () => {
    const { graph } = buildStrategyAndPlanning();
    const summary = presentExecutionPlanSummary({ graph, locale: "en" });
    expect(summary).not.toMatch(/PlanningGraph|topological|critical path algorithm/i);
    expect(summary).toMatch(/Emma will run/i);
  });

  it("planning nodes contain business purpose and dependencies are acyclic", () => {
    const { graph } = buildStrategyAndPlanning();
    for (const stage of graph.executionStages) {
      expect(stage.businessPurpose.length).toBeGreaterThan(10);
    }
    expect(graph.dependencyAnalysis.circularDependencies).toHaveLength(0);
    expect(graph.criticalPath.length).toBeGreaterThan(0);
  });

  it("consolidates missing customer input in briefing", () => {
    const { strategy, graph, campaignContext } = buildStrategyAndPlanning();
    const briefing = buildExecutiveCampaignBriefing({
      campaignContext,
      strategy,
      planningGraph: graph,
      locale: "en",
    });
    const needsSection = briefing.sections.find((s) => s.id === "customer-needs");
    expect(needsSection).toBeDefined();
    expect(briefing.executionPlan?.whatEmmaNeeds.length).toBeGreaterThan(0);
  });

  it("rejects generic task-list planning in validation", () => {
    const { graph } = buildStrategyAndPlanning();
    expect(isGenericTaskListPlanning(graph)).toBe(false);
    const badGraph = {
      ...graph,
      executionStages: graph.executionStages.map((s, i) =>
        i < 3
          ? { ...s, title: "Create LinkedIn post", businessPurpose: "post", reason: "" }
          : s
      ),
    };
    expect(validatePlanningGraph(badGraph).valid).toBe(false);
  });

  it("includes review moments and meaningful risks", () => {
    const { graph } = buildStrategyAndPlanning();
    expect(graph.reviewMoments.length).toBeGreaterThan(0);
    expect(graph.risks.length).toBeGreaterThan(0);
  });

  it("persistCampaignBrainOutputs auto-persists campaign_planning", () => {
    const { strategy, project } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    saveMarketingWorkspaceState(PEER, { projects: [liveProject] });
    const updated = persistCampaignBrainOutputs(PEER, project.id, { strategy });
    expect(updated?.campaignSetup?.campaignBrainOutputs?.campaign_planning?.planningGraph).toBeDefined();
    const reloaded = loadMarketingWorkspaceState(PEER).projects?.[0];
    expect(reloaded?.campaignSetup?.campaignBrainOutputs?.campaign_planning).toBeDefined();
  });

  it("buildCampaignExecutiveBriefing resolves planning from stored outputs", () => {
    const { strategy, project } = buildStrategyAndPlanning();
    const liveProject = liveProjectWithSetup(project);
    saveMarketingWorkspaceState(PEER, { projects: [liveProject] });
    persistCampaignBrainOutputs(PEER, project.id, { strategy });
    const stored = loadMarketingWorkspaceState(PEER).projects![0]!;
    const briefing = buildCampaignExecutiveBriefing({
      project: stored,
      allReviewItems: reviewItemsReady(),
      locale: "en",
    });
    expect(briefing?.sections.some((s) => s.id === "execution-plan")).toBe(true);
    expect(briefing?.planningGraph).toBeDefined();
  });

  it("quality score validates outcome-oriented planning", () => {
    const { graph, campaignContext } = buildStrategyAndPlanning();
    const quality = scorePlanningQuality(graph, campaignContext);
    expect(quality.valid).toBe(true);
    expect(quality.scores.overallQuality).toBeGreaterThanOrEqual(55);
  });

  it("maps planning graph to brain output with metadata", () => {
    const { graph, campaignContext, strategy } = buildStrategyAndPlanning();
    const validation = validatePlanningGraph(graph);
    const metadata = computePlanningCacheIdentity({
      project: liveProjectWithSetup(createMarketingCampaignProject(peergentInput)),
      strategyOutput: strategy,
    });
    const output = mapPlanningGraphToBrainOutput({
      graph,
      campaignContext,
      validation,
      metadata,
      locale: "en",
    });
    expect(output.planningGraph?.version).toBe(graph.version);
    expect(output.planningMetadata?.validationStatus).toBe("valid");
  });
});
