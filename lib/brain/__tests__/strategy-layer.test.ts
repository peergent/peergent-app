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
  buildStrategyGraph,
  validateStrategyQuality,
  mapStrategyGraphToBrainOutput,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
  resetDefaultResearchRepository,
  resetDefaultReasoningRepository,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { validateStrategyLlmPayload } from "@/lib/brain/llm/response-validator";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { resolveCompanyIntelligence } from "@/lib/brain/integration/resolve-company-intelligence";
import { resolveStrategySources } from "@/lib/brain/strategy/strategy-sources";
import { executeStrategyWithLlmFallback } from "@/lib/brain/llm/execute-strategy-llm";
import { getBrainCapability, projectBrainContext } from "@/lib/brain";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import type { BrainLlmProvider } from "@/lib/brain/llm/provider";
import { BrainLlmBusinessValidationError } from "@/lib/brain/llm/errors";

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

function fullStrategyContext() {
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
    marketingUnderstanding: null,
    websiteSnapshot: website,
    campaignContext,
    assembledAt,
  });

  const companyOut = executeCompanyUnderstanding({ companySnapshot: assembly.companySnapshot, locale: "en" });
  const websiteOut = executeWebsiteUnderstanding({
    companySnapshot: assembly.companySnapshot,
    websiteSnapshot: website,
    locale: "en",
  });

  const baseCtx = buildCapabilityExecutionContext({
    assembly,
    request: {
      organizationId: PEERGENT_DEMO_ORG_ID,
      peerId: "demo",
      capabilityId: "strategy",
      actorId: "test",
      campaignContext,
    },
    campaignContext,
    upstreamOutputs: { company_understanding: companyOut, website_understanding: websiteOut },
  });

  const competitorOut = executeCompetitorUnderstanding(baseCtx);
  const brandOut = executeBrandUnderstanding({
    ...baseCtx,
    upstreamOutputs: { ...baseCtx.upstreamOutputs, competitor_understanding: competitorOut },
  });

  const upstreamOutputs = {
    company_understanding: companyOut,
    website_understanding: websiteOut,
    competitor_understanding: competitorOut,
    brand_understanding: brandOut,
  };

  const researchGraph = buildResearchGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    upstreamOutputs,
    campaignId: project.id,
  });

  const reasoningGraph = buildReasoningGraph({ researchGraph });

  const execCtx = buildCapabilityExecutionContext({
    assembly,
    request: {
      organizationId: PEERGENT_DEMO_ORG_ID,
      peerId: "demo",
      capabilityId: "strategy",
      actorId: "test",
      campaignContext,
      upstreamOutputs,
      researchGraph,
      reasoningGraph,
    },
    campaignContext,
    upstreamOutputs,
    researchGraph,
    reasoningGraph,
  });

  return { assembly, campaignContext, execCtx, researchGraph, reasoningGraph, upstreamOutputs };
}

describe("Strategy Layer — Sprint 9 Phase 2", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    seedPeergentDemoWebsiteSnapshotSync();
    resetDefaultResearchRepository();
    resetDefaultReasoningRepository();
  });

  it("builds StrategyGraph from ReasoningGraph", () => {
    const { execCtx, campaignContext } = fullStrategyContext();
    const graph = buildStrategyGraph({
      sources: resolveStrategySources(execCtx),
      companySnapshot: execCtx.companySnapshot,
      campaignContext,
      locale: "en",
    });

    expect(graph.businessSummary.description).toMatch(/Peergent/i);
    expect(graph.rejectedAlternatives.length).toBeGreaterThanOrEqual(2);
    expect(graph.strategicRisks.length).toBeGreaterThan(0);
    expect(graph.unknowns.length).toBeGreaterThan(0);
  });

  it("executeStrategy uses ReasoningGraph and mentions company name", () => {
    const { execCtx } = fullStrategyContext();
    const out = executeStrategy(execCtx);
    const text = out.findings.map((f) => f.value).join(" ");
    expect(text).toMatch(/Peergent/i);
    expect(out.decisions[0]?.rationale).toMatch(/Rejected alternatives|Afgewezen alternatieven/i);
  });

  it("preserves evidence chain in findings provenance", () => {
    const { execCtx } = fullStrategyContext();
    const out = executeStrategy(execCtx);
    const withReasoning = out.findings.filter((f) =>
      f.provenance.some((p) => p.refId.startsWith("reasoning:") || p.kind === "capability_output")
    );
    expect(withReasoning.length).toBeGreaterThan(0);
  });

  it("legacy-only context still produces strategy output", () => {
    const { assembly, campaignContext, upstreamOutputs } = fullStrategyContext();
    const legacyCtx = buildCapabilityExecutionContext({
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
      researchGraph: null,
      reasoningGraph: null,
    });

    const out = executeStrategy(legacyCtx);
    expect(out.findings.length).toBe(19);
    expect(out.actionProposals.length).toBeGreaterThan(0);
  });

  it("rejects generic strategy in quality validator", () => {
    const { execCtx, campaignContext } = fullStrategyContext();
    const genericGraph = buildStrategyGraph({
      sources: { reasoning: null, research: null, legacy: {} },
      companySnapshot: execCtx.companySnapshot,
      campaignContext,
      locale: "en",
    });
    genericGraph.businessSummary = {
      ...genericGraph.businessSummary,
      description: "Increase brand awareness and reach more customers with best practices.",
    };

    const result = validateStrategyQuality(genericGraph, {
      companyName: campaignContext.companyName,
      minOverall: 50,
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "generic_marketing_advice" || i.code === "business_name_absent")).toBe(true);
  });

  it("accepts company-specific strategy from reasoning", () => {
    const { execCtx, campaignContext } = fullStrategyContext();
    const graph = buildStrategyGraph({
      sources: resolveStrategySources(execCtx),
      companySnapshot: execCtx.companySnapshot,
      campaignContext,
      locale: "en",
    });

    const result = validateStrategyQuality(graph, {
      companyName: campaignContext.companyName,
      minOverall: 35,
    });
    expect(result.scores.businessSpecificity).toBeGreaterThan(40);
    expect(graph.decisionRationales[0]?.alternativesRejected.length).toBeGreaterThanOrEqual(2);
  });

  it("maps StrategyGraph to BrainStructuredOutput with stable labels", () => {
    const { execCtx, campaignContext } = fullStrategyContext();
    const graph = buildStrategyGraph({
      sources: resolveStrategySources(execCtx),
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
    expect(output.findings).toHaveLength(19);
    expect(output.findings.some((f) => f.label === "Business objective")).toBe(true);
  });

  it("accepts office LLM mock payload when quality check is required", () => {
    const project = {
      id: "office-llm-proj",
      peerId: "emma",
      title: "Office LLM Launch",
      goal: "Leads",
      campaignType: "product_launch" as const,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      ownerLabel: "Pilot",
      rawRequest: "Grow leads",
      origin: "campaign_wizard" as const,
      campaignSetup: {
        description: "Grow qualified demo requests",
        primaryGoalId: "generate_leads" as const,
        targetAudience: "SMB owners",
        setupMode: "automatic" as const,
        approvalMode: "approval_before_publication" as const,
        websiteUrl: "https://example.com",
        campaignCompetitors: [{ name: "Rival Co" }],
        campaignContextVersion: 2,
        campaignBrandContext: {
          brandName: "Example Co",
          industry: "B2B software",
          productsAndServices: ["AI workforce platform"],
          uniqueSellingPoints: ["Premium AI workspace"],
          targetAudience: "SMB owners",
        },
      },
    };
    const ctx = buildCampaignContext({ project, domainInput: { peerId: "emma" } as never });
    const assembly = resolveCompanyIntelligence({ peerId: "emma", organizationId: "org-1", project, domainInput: { peerId: "emma" } as never, campaignContext: ctx });
    const companyName =
      assembly.companySnapshot.profile.companyName.value ?? ctx.companyName;

    const payload = {
      findings: [
        { id: "strategy-1", label: "Business objective", value: "Example Co helps SMB owners adopt an AI workforce platform with premium positioning.", confidence: "medium" },
        { id: "strategy-2", label: "Campaign objective", value: "Grow qualified demo requests from SMB owners for Example Co.", confidence: "medium" },
        { id: "strategy-3", label: "Target audience", value: "SMB owners evaluating AI workforce tools.", confidence: "medium" },
        { id: "strategy-4", label: "Audience problem", value: "SMB owners need clarity on ROI before adopting AI workforce software.", confidence: "medium" },
        { id: "strategy-6", label: "Positioning", value: "Premium AI workspace specialist for SMB teams.", confidence: "medium" },
        { id: "strategy-7", label: "Value proposition", value: "Example Co delivers a calm, outcome-first AI workspace for SMB owners.", confidence: "medium" },
        { id: "strategy-9", label: "Supporting messages", value: "Premium AI workspace, unique selling points validated in campaign input.", confidence: "medium" },
        { id: "strategy-10", label: "Campaign concept", value: "Example Co focuses on proof-led clarity for SMB decision makers.", confidence: "medium" },
        { id: "strategy-17", label: "Risks", value: "Limited competitor proof may weaken differentiation claims.", confidence: "medium" },
        { id: "strategy-18", label: "Assumptions", value: "Campaign audience matches Example Co ICP from setup input.", confidence: "medium" },
        { id: "strategy-19", label: "Unknowns", value: "Conversion benchmarks, full competitor pricing.", confidence: "low" },
      ],
      decisions: [{
        id: "dec-strategy-1",
        label: "Recommended direction",
        rationale: "Focus on clarity and proof for SMB decision makers. Rejected alternatives: Compete on price (No evidence for structural price advantage); Generic broad-reach campaign (Reasoning indicates a specific audience).",
        confidence: "medium",
      }],
      recommendations: [{ id: "rec-strategy-1", label: "Next step: select channels", priority: "high" }],
      actionProposals: [{ id: "act-strategy-1", actionType: "approve_strategy", label: "Confirm strategy", requiresApproval: true }],
      warnings: [],
    };

    expect(() =>
      validateStrategyLlmPayload(payload, {
        capabilityVersion: "1.0.0",
        knownCompetitors: ["Rival Co"],
        companyName,
        organizationId: "org-1",
        campaignId: project.id,
        requireQualityCheck: true,
      })
    ).not.toThrow();
  });

  it("throws BrainLlmBusinessValidationError for quality failures", () => {
    const payload = {
      findings: [
        { id: "strategy-1", label: "Business objective", value: "Increase brand awareness.", confidence: "medium" },
        { id: "strategy-2", label: "Campaign objective", value: "Reach more customers.", confidence: "medium" },
        { id: "strategy-17", label: "Risks", value: "None", confidence: "low" },
        { id: "strategy-19", label: "Unknowns", value: "None", confidence: "low" },
      ],
      decisions: [{ id: "dec-1", label: "Recommended direction", rationale: "Use social media.", confidence: "medium" }],
      recommendations: [{ id: "rec-1", label: "Next step", priority: "high" }],
      actionProposals: [{ id: "act-1", actionType: "approve_strategy", label: "Confirm", requiresApproval: true }],
      warnings: [],
    };

    expect(() =>
      validateStrategyLlmPayload(payload, {
        capabilityVersion: "1.0.0",
        knownCompetitors: [],
        companyName: "Example Co",
        organizationId: "org-1",
        requireQualityCheck: true,
      })
    ).toThrow(BrainLlmBusinessValidationError);
  });

  it("preserves tokens and requestStarted when LLM validation fails after fetch", async () => {
    const { execCtx, assembly, campaignContext } = fullStrategyContext();
    const def = getBrainCapability("strategy");
    const projected = projectBrainContext({
      fullSnapshot: assembly.brainSnapshot,
      companySnapshot: assembly.companySnapshot,
      requiredSlices: def.requiredContext,
      optionalSlices: def.optionalContext,
    });

    let calls = 0;
    const provider: BrainLlmProvider = {
      id: "openai",
      complete: async () => {
        calls += 1;
        return {
          rawText: JSON.stringify({
            findings: [{ id: "strategy-1", label: "Business objective", value: "Generic advice.", confidence: "medium" }],
            recommendations: [],
            actionProposals: [],
            warnings: [],
          }),
          usage: buildLlmUsage({
            provider: "openai",
            model: "gpt-test",
            inputTokens: 240,
            outputTokens: 90,
            latencyMs: 18,
          }),
        };
      },
    };

    const result = await executeStrategyWithLlmFallback({
      context: {
        organizationId: PEERGENT_DEMO_ORG_ID,
        peerId: "demo",
        capabilityId: "strategy",
        actorId: "test",
        environment: "live",
      },
      snapshot: projected.snapshot,
      capabilityId: "strategy",
      companySnapshot: assembly.companySnapshot,
      executionContext: execCtx,
      projection: projected.projection,
      llmProvider: provider,
    });

    expect(calls).toBe(2);
    expect(result.fallbackReason).toBe("schema_validation_failed");
    expect(result.usage?.requestStarted).toBe(true);
    expect(result.usage?.inputTokens).toBe(240);
    expect(result.usage?.outputTokens).toBe(90);
    expect(result.diagnostics?.requestStarted).toBe(true);
    expect(result.output.findings.length).toBeGreaterThan(0);
    expect(campaignContext.companyName).toBeTruthy();
  });
});
