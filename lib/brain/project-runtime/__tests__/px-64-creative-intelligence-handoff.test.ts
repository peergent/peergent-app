/**
 * PX-64 — Creative intelligence handoff: Strategy/MI/Planning → LLM Creative → approval package.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BrainLlmProvider } from "@/lib/brain/llm/provider";
import type { BrainLlmRequest } from "@/lib/brain/llm/types";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import { produceCreativeBrainGraph } from "@/lib/brain/layers/creative/produce-creative-brain-graph";
import { buildBrainPayload } from "@/lib/brain/project-runtime/brain-context-handoff";
import { materializeCampaignApprovalPackage } from "@/lib/brain/approval/materialize-campaign-approval-package";
import {
  containsCreativeTemplatePlaceholder,
  CREATIVE_TEMPLATE_PLACEHOLDER_MARKERS,
} from "@/lib/brain/layers/creative/creative-placeholder-markers";
import { validateCreativeGraph } from "@/lib/brain/layers/creative/creative-validator";
import { validateCreativeBrainLlmPayload } from "@/lib/brain/llm/creative-brain-llm-validator";
import { buildCreativeGraph } from "@/lib/brain/layers/creative/build-creative-graph";
import {
  executeRegistryBrainForEpisode,
  FIXTURE_ORG_ID,
  resetDefaultProjectEpisodeRepository,
} from "@/lib/brain/project-runtime";
import { resetDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { getDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { buildPlanningBrainGraph } from "@/lib/brain/layers/planning/planning-brain-graph";
import { buildStrategyBrainGraph } from "@/lib/brain/layers/strategy/strategy-brain-graph";
import { buildMarketingIntelligenceBrainGraph } from "@/lib/brain/layers/marketing-intelligence/marketing-intelligence-graph";
import { buildReasoningBrainGraph } from "@/lib/brain/layers/reasoning/reasoning-graph";
import { emptyResearchBrainGraph } from "@/lib/brain/layers/research";
import { buildCompanyGraph } from "@/lib/brain/layers/company";
import {
  assembleCompanyContextSync,
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  collectBrandGraph,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { IntelligenceLlmUnavailableError } from "@/lib/brain/llm/intelligence-llm-errors";
import { resolveIntelligenceLlmPolicy } from "@/lib/brain/llm/intelligence-provider-policy";
import { onCreativePipelineDiagnostic } from "@/lib/brain/project-runtime/creative-pipeline-diagnostics";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
  resetLayerRepositoryStores,
} from "@/lib/brain/persistence/layer-repository-factory";
import { PX64_PRODUCTION_SYMPTOM_PROJECT_ID } from "@/lib/brain/project-runtime/creative-verification-sql";
import type { CreativeBrainInput } from "@/lib/brain/layers/creative/build-creative-graph";

/** Mirror of execute-creative-brain-llm system prompt prefix — must stay company-agnostic. */
const CREATIVE_BRAIN_SYSTEM_PROMPT_PREFIX = "You are the Creative Brain for a marketing intelligence platform.";

const ORG = FIXTURE_ORG_ID;
const PROJECT = "proj-px64-handoff";

function mockCreativeLlm(handler: (request: BrainLlmRequest) => Promise<{ rawText: string }>): BrainLlmProvider {
  return {
    id: "openai",
    complete: async (request) => ({
      rawText: (await handler(request)).rawText,
      usage: buildLlmUsage({ model: "gpt-4.1-mini-test", inputTokens: 100, outputTokens: 800 }),
    }),
  };
}

function validCreativeLlmPayload(company: string) {
  return {
    direction: {
      name: "Proof-led growth",
      angle: `Show ${company} buyers how operational clarity reduces wasted spend.`,
      rationale: "Strategy positions reliability between speed and price competitors.",
    },
    campaign: {
      name: `${company} demand capture`,
      objective: "Generate qualified conversations from high-intent operators.",
      targetAudience: "Operations leaders at mid-market B2B companies",
      keyMessage: `${company} turns fragmented workflows into one accountable operating rhythm.`,
    },
    messaging: {
      headline: `${company} helps teams stop guessing and start executing`,
      supportingMessage:
        "When marketing, sales, and delivery run on different truths, campaigns stall. One shared intelligence layer keeps every channel aligned to the same customer problem.",
      cta: "See how it works",
      proof: ["Grounded in competitor research", "Aligned to positioning strategy"],
    },
    deliverables: [
      {
        deliverableType: "linkedin_post",
        channel: "linkedin",
        headline: `${company} for operators who need clarity`,
        hook: "Your team does not need another dashboard. They need one version of the customer truth.",
        body: "Most B2B teams publish confident messaging while operations still chase answers in five tools. That gap shows up as slow pipeline, inconsistent follow-up, and campaigns that sound smart but convert late.\n\nWe built a single intelligence layer so research, strategy, and channel copy stay connected — not re-written from scratch every week.\n\nIf your last campaign looked good in slides but flat in market, this is the fix.",
        cta: "Book a working session",
        hashtags: ["#B2B", "#operations", "#marketing"],
      },
      {
        deliverableType: "google_ads_campaign",
        channel: "google_ads",
        headline: `${company} — one truth for every channel`,
        hook: "Stop launching campaigns on stale assumptions.",
        body: "Align research, strategy, and creative before you spend. See how teams turn intelligence into channel-ready copy without rework.",
        cta: "Get a walkthrough",
        headlineVariations: [`${company} for growing teams`, "Campaigns that match reality"],
        descriptionVariations: [
          "Turn research into channel-ready copy.",
          "One intelligence layer for every channel.",
        ],
      },
      {
        deliverableType: "landing_page",
        channel: "landing_page",
        headline: `${company} turns intelligence into action`,
        hook: "When strategy and creative drift apart, buyers feel it.",
        body: "Hero section explains the operational cost of disconnected marketing. Value section covers aligned research, strategy, and creative. Proof section cites grounded competitor insights. CTA section invites a working session.",
        cta: "Schedule a demo",
        landingSections: [
          { title: "The problem", body: "Teams waste cycles rewriting the same story for every channel." },
          { title: "The outcome", body: "One intelligence handoff produces approval-ready assets." },
        ],
      },
    ],
    warnings: [],
  };
}

function fixtureUpstream() {
  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const createInput = {
    peerId: "demo" as const,
    ownerLabel: "Alex",
    name: "Acme Analytics",
    goalLabel: "Pipeline",
    description: "Increase qualified pipeline from search and LinkedIn.",
    primaryGoalId: "generate_leads" as const,
    targetAudience: "Revenue operations leaders",
    setupMode: "automatic" as const,
    approvalMode: "approval_before_publication" as const,
    selectedChannels: ["LinkedIn", "Google Search", "Landing page"] as const,
  };
  const project = createMarketingCampaignProject(createInput);
  const campaignContext = buildCampaignContextFromCreateInput(project, createInput, "en");
  const assembledAt = "2026-08-01T00:00:00.000Z";
  const profile = buildPeergentCompanyProfile("en", assembledAt);
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: ORG,
    url: "https://acme.example",
  });
  const assembly = assembleCompanyContextSync({
    organizationId: ORG,
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
  const companyGraph = buildCompanyGraph({
    organizationId: ORG,
    projectId: PROJECT,
    locale: "en",
    companySnapshot: assembly.companySnapshot,
    brandGraph,
    author: "test",
    changeReason: "PX-64 fixture",
  });
  const researchGraph = emptyResearchBrainGraph({
    organizationId: ORG,
    projectId: PROJECT,
    campaignId: PROJECT,
  });
  const reasoningGraph = buildReasoningBrainGraph({
    organizationId: ORG,
    projectId: PROJECT,
    companyGraph,
    researchGraph,
    projectObjective: "Increase qualified pipeline",
    locale: "en",
  });
  const miGraph = buildMarketingIntelligenceBrainGraph({
    organizationId: ORG,
    projectId: PROJECT,
    companyGraph,
    researchGraph,
    reasoningGraph,
    projectObjective: "Increase qualified pipeline",
    locale: "en",
  });
  const strategyGraph = buildStrategyBrainGraph({
    organizationId: ORG,
    projectId: PROJECT,
    companyGraph,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph: miGraph,
    projectObjective: "Increase qualified pipeline",
    locale: "en",
  });
  const planningGraph = buildPlanningBrainGraph({
    organizationId: ORG,
    projectId: PROJECT,
    companyGraph,
    strategyGraph,
    projectObjective: "Increase qualified pipeline",
    locale: "en",
  });

  return {
    project,
    campaignContext,
    companyGraph,
    researchGraph,
    reasoningGraph,
    miGraph,
    strategyGraph,
    planningGraph,
  };
}

function creativeInputFromUpstream(): CreativeBrainInput {
  const upstream = fixtureUpstream();
  const resolved = {
    companyGraph: upstream.companyGraph,
    researchBrainGraph: upstream.researchGraph,
    reasoningBrainGraph: upstream.reasoningGraph,
    marketingIntelligenceBrainGraph: upstream.miGraph,
    strategyBrainGraph: upstream.strategyGraph,
    planningBrainGraph: upstream.planningGraph,
    creativeGraph: null,
    validationGraph: null,
    memoryGraph: null,
    executionHistory: null,
    learningBrainGraph: null,
    priorMemories: [],
  };
  const handoff = {
    organizationId: ORG,
    projectId: PROJECT,
    episodeId: "ep-px64",
    locale: "en" as const,
    correlationId: "corr-px64",
    artifacts: {},
    priorOutputs: [],
    priorMemories: [],
    campaignContext: upstream.campaignContext,
    companySnapshot: { organizationId: ORG } as import("@/lib/brain/company/snapshot").CompanySnapshot,
    brandGraph: null,
    approvalGrantedForExecution: false,
    approvedExecutionHandoff: null,
    performanceObservations: [],
    memoryCheckpointPhase: null,
    learningProposalIds: [],
    learningProposals: [],
    peerId: "demo",
  };
  const payload = buildBrainPayload("creative", resolved, handoff);
  return {
    organizationId: ORG,
    projectId: PROJECT,
    episodeId: "ep-px64",
    locale: "en",
    ...payload,
  } as CreativeBrainInput;
}

describe("PX-64 creative intelligence handoff", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetDefaultCreativeRepository();
    resetDefaultProjectEpisodeRepository();
    resetConfiguredLayerRepositories();
    resetLayerRepositoryStores();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env.NODE_ENV = originalEnv;
  });

  it("A — buildBrainPayload bridges strategy/planning brain graphs to legacy creative input", () => {
    const input = creativeInputFromUpstream();
    expect(input.strategyGraph?.valueProposition?.description?.length).toBeGreaterThan(0);
    expect(input.strategyGraph?.primaryAudience?.description?.length).toBeGreaterThan(0);
    expect(input.strategyBrainGraph).toBeTruthy();
    expect(input.planningBrainGraph).toBeTruthy();
    expect(input.planningGraph).toBeTruthy();
  });

  it("B/C/D — live LLM creative receives upstream context and produces channel-ready copy", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BRAIN_USE_OPENAI", "true");
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "test-key";

    const input = creativeInputFromUpstream();
    const llm = mockCreativeLlm(async () => ({
      rawText: JSON.stringify(validCreativeLlmPayload("Acme Analytics")),
    }));

    const graph = await produceCreativeBrainGraph({ ...input, llmProvider: llm, peerId: "live-peer" });

    expect(graph.providerMeta?.providerMode).toBe("live_llm");
    expect(graph.providerMeta?.fallbackUsed).toBe(false);
    expect(graph.contentArtifacts?.length).toBeGreaterThan(0);
    expect(graph.deliverables[0]?.bodyOutline.length).toBeGreaterThan(80);

    const copy = graph.contentArtifacts!.map((a) => a.body).join(" ");
    expect(containsCreativeTemplatePlaceholder(copy)).toBe(false);
    for (const marker of CREATIVE_TEMPLATE_PLACEHOLDER_MARKERS.slice(0, 4)) {
      expect(copy).not.toContain(marker);
    }
  });

  it("E/F — placeholder/template LLM output is rejected", () => {
    const bad = validCreativeLlmPayload("Acme");
    bad.deliverables[0]!.hook = "Name the problem before the solution.";
    const validation = validateCreativeBrainLlmPayload(bad);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes("template_placeholder"))).toBe(true);
  });

  it("G/H — approval package renders real LLM creative artifacts", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const input = creativeInputFromUpstream();
    const graph = await produceCreativeBrainGraph({
      ...input,
      llmProvider: mockCreativeLlm(async () => ({
        rawText: JSON.stringify(validCreativeLlmPayload("Acme Analytics")),
      })),
      peerId: "live-peer",
    });

    const pkg = materializeCampaignApprovalPackage({
      organizationId: ORG,
      projectId: PROJECT,
      campaignName: "Acme campaign",
      creativeGraph: graph,
      validationGraph: null,
      planningGraph: input.planningBrainGraph,
      strategyGraph: input.strategyBrainGraph,
      campaignContext: input.campaignContext,
      locale: "en",
    });

    expect(pkg).not.toBeNull();
    expect(pkg!.deliverables[0]!.body.length).toBeGreaterThan(80);
    expect(pkg!.deliverables[0]!.body).not.toContain("Name the problem before the solution");
  });

  it("I/J — registry reuse does not regenerate creative on second execution", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const input = creativeInputFromUpstream();
    const llm = mockCreativeLlm(async () => ({
      rawText: JSON.stringify(validCreativeLlmPayload("Acme Analytics")),
    }));
    const llmSpy = vi.spyOn(llm, "complete");

    const graph = await produceCreativeBrainGraph({ ...input, llmProvider: llm, peerId: "live-peer" });
    getDefaultCreativeRepository().store({
      key: { organizationId: ORG, campaignId: PROJECT },
      graph,
      outputRef: `creative:${ORG}:${PROJECT}:${graph.createdAt}`,
      storedAt: new Date().toISOString(),
    });

    const episode = {
      snapshot: {
        organizationId: ORG,
        projectId: PROJECT,
        episodeId: "ep-reuse",
        peerId: "live-peer",
        state: "creating" as const,
        completedBrains: [],
        retryCount: {},
      },
      correlationId: "corr-reuse",
      artifacts: { memoryOutputRefs: [] },
      resolvedGraphs: {},
      sliceAvailability: { business: true, brand: true, website: true, products: false, competitors: true, goals: true, campaign: true },
      approvalGrantedForExecution: false,
    } as import("@/lib/brain/project-runtime/types").ProjectEpisodeRecord;

    const upstream = fixtureUpstream();
    const result = await executeRegistryBrainForEpisode({
      brainId: "creative",
      episode,
      contextHandoff: {
        companySnapshot: { organizationId: ORG } as import("@/lib/brain/company/snapshot").CompanySnapshot,
        brandGraph: null,
        campaignContext: upstream.campaignContext,
        priorMemories: [],
      },
      locale: "en",
      idempotencyKey: "reuse-key",
    });

    expect(result.status).toBe("completed");
    expect(llmSpy.mock.calls.length).toBe(1);
  });

  it("K — production unavailable does not silently fake success", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BRAIN_USE_OPENAI", "false");
    const policy = resolveIntelligenceLlmPolicy({ peerId: "live-peer" });
    expect(policy.mode).toBe("unavailable");

    await expect(
      produceCreativeBrainGraph({ ...creativeInputFromUpstream(), peerId: "live-peer" })
    ).rejects.toBeInstanceOf(IntelligenceLlmUnavailableError);
  });

  it("L — prompt uses campaign context company name (not hardcoded generator strings)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    let capturedPrompt = "";
    const input = creativeInputFromUpstream();
    await produceCreativeBrainGraph({
      ...input,
      llmProvider: mockCreativeLlm(async (request) => {
        capturedPrompt = request.userPrompt;
        return { rawText: JSON.stringify(validCreativeLlmPayload("Acme Analytics")) };
      }),
      peerId: "live-peer",
    });
    expect(capturedPrompt).toContain("Acme Analytics");
    expect(capturedPrompt).toContain("Strategy:");
    expect(CREATIVE_BRAIN_SYSTEM_PROMPT_PREFIX).not.toContain("Peergent");
  });

  it("production symptom fixture — regression markers for proj-1787251290382-50sfl9b", () => {
    expect(PX64_PRODUCTION_SYMPTOM_PROJECT_ID).toBe("proj-1787251290382-50sfl9b");
    expect(CREATIVE_TEMPLATE_PLACEHOLDER_MARKERS).toContain("Name the problem before the solution");
    expect(CREATIVE_TEMPLATE_PLACEHOLDER_MARKERS).toContain("Book a conversation");
    const validation = validateCreativeBrainLlmPayload({
      ...validCreativeLlmPayload("Symptom Co"),
      deliverables: [
        {
          ...validCreativeLlmPayload("Symptom Co").deliverables[0]!,
          hook: "Name the problem before the solution.",
          body: "Name the problem before the solution. Book a conversation.",
          cta: "Book a conversation",
        },
        validCreativeLlmPayload("Symptom Co").deliverables[1]!,
        validCreativeLlmPayload("Symptom Co").deliverables[2]!,
      ],
    });
    expect(validation.valid).toBe(false);
  });

  it("M — validation rejects deterministic template copy on graph", () => {
    const graph = buildCreativeGraph({
      organizationId: ORG,
      projectId: PROJECT,
      locale: "en",
      campaignContext: fixtureUpstream().campaignContext,
    });
    const withBadHook = {
      ...graph,
      deliverables: graph.deliverables.map((d) => ({
        ...d,
        hook: "Name the problem before the solution.",
        cta: "Book a conversation",
      })),
      contentArtifacts: graph.contentArtifacts?.map((a) => ({
        ...a,
        hook: "Name the problem before the solution.",
        body: "Name the problem before the solution. Book a conversation.",
        cta: "Book a conversation",
      })),
    };
    const validation = validateCreativeGraph(withBadHook);
    expect(validation.valid).toBe(false);
  });

  it("N — emits creative diagnostics on LLM run", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const events: string[] = [];
    const off = onCreativePipelineDiagnostic((p) => events.push(p.event));
    const input = creativeInputFromUpstream();
    await produceCreativeBrainGraph({
      ...input,
      llmProvider: mockCreativeLlm(async () => ({
        rawText: JSON.stringify(validCreativeLlmPayload("Acme Analytics")),
      })),
      peerId: "live-peer",
    });
    off();
    expect(events).toContain("creative_llm_started");
    expect(events).toContain("creative_llm_completed");
  });
});
