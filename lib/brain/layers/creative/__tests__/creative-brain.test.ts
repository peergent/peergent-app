import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCreativeGraph,
  collectCreativeGraph,
  createFromBrainInputs,
  creativeBrainContract,
  resetDefaultCreativeRepository,
  validateCreativeGraph,
  CREATIVE_LAYER_VERSION,
  CREATIVE_MODULE_SPECS,
} from "@/lib/brain/layers/creative";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
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
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
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

function pipelineCreativeInput() {
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
    locale: "en",
  });

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
  const decisions = buildDecisionsFromStrategyGraph({
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
  const planningGraph = buildPlanningGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    campaignId: project.id,
    campaignContext,
    strategyGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
    locale: "en",
  });

  return {
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en" as const,
    campaignContext,
    strategyGraph,
    planningGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
  };
}

describe("Creative Brain", () => {
  beforeEach(() => {
    resetDefaultCreativeRepository();
  });

  it("defines seven thinking module specs", () => {
    expect(CREATIVE_MODULE_SPECS).toHaveLength(7);
    expect(CREATIVE_LAYER_VERSION).toBe("1.0.0");
  });

  it("builds a creative graph through all seven phases", () => {
    const input = pipelineCreativeInput();
    const graph = buildCreativeGraph(input);

    expect(graph.phases).toHaveLength(7);
    expect(graph.direction).not.toBeNull();
    expect(graph.campaigns.length).toBeGreaterThan(0);
    expect(graph.messaging.length).toBeGreaterThan(0);
    expect(graph.channelPlans.length).toBeGreaterThan(0);
    expect(graph.deliverables.length).toBeGreaterThan(0);
    expect(graph.decisions.length).toBeGreaterThan(0);
    expect(graph.reasoning.length).toBeGreaterThan(0);
  });

  it("validates a complete creative graph", () => {
    const graph = buildCreativeGraph(pipelineCreativeInput());
    const validation = validateCreativeGraph(graph);
    expect(validation.valid).toBe(true);
    expect(validation.score).toBeGreaterThan(70);
  });

  it("produces structured brain output with creativeGraph", async () => {
    const output = await createFromBrainInputs(pipelineCreativeInput());
    expect(output.outputRef).toMatch(/^creative:/);
    expect(output.structuredOutput.creativeGraph).toBeDefined();
    expect(output.structuredOutput.findings.length).toBeGreaterThan(3);
    expect(output.structuredOutput.capabilityId).toBe("creative_generation");
  });

  it("implements ProjectBrainContract", async () => {
    const input = pipelineCreativeInput();
    const context: BrainContextPackage = {
      organizationId: input.organizationId,
      peerId: "demo",
      projectId: input.projectId,
      episodeId: "ep-test",
      locale: "en",
      contextVersion: 1,
      slices: { business: true, brand: true, website: true, products: false, competitors: true, goals: true, campaign: true },
      priorOutputs: [],
      priorDecisionIds: [],
      memoryRefs: [],
      assembledAt: new Date().toISOString(),
    };

    const result = await creativeBrainContract.execute({
      brainId: "creative",
      context,
      payload: input,
      idempotencyKey: "test-key",
      retryAttempt: 0,
    });

    expect(result.brainId).toBe("creative");
    expect(result.status).toBe("completed");
    expect(result.output?.capabilityIds).toContain("creative_generation");
    expect(result.requiresApproval).toBe(true);
    expect(result.approvalKind).toBe("deliverable_review");
    expect(result.events.length).toBe(7);
  });

  it("registers in default project brain registry", () => {
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.creative?.id).toBe("creative");
    expect(registry.creative?.requiredContextSlices).toContain("brand");
  });

  it("never returns plain text only — deliverables are structured", async () => {
    const graph = await collectCreativeGraph(pipelineCreativeInput());
    for (const del of graph.deliverables) {
      expect(del.headlineVariations.length).toBeGreaterThan(0);
      expect(del.ctaVariations.length).toBeGreaterThan(0);
      expect(del.hookVariations.length).toBeGreaterThan(0);
      expect(typeof del.type).toBe("string");
    }
  });
});
