import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assembleCompanyContextSync,
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  clearDemoWebsiteSnapshots,
  createLlmBrainProvider,
  getBrainCapability,
  mapStrategyPayloadToBrainOutput,
  projectBrainContext,
  resetPromptContextCache,
} from "@/lib/brain";
import { mapChannelPlanningPayloadToBrainOutput } from "@/lib/brain/llm/channel-response-validator";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import type { BrainLlmProvider } from "@/lib/brain/llm/provider";
import type { BrainLlmRequest } from "@/lib/brain/llm/types";
import {
  extractApprovedChannelsForCreativePlanning,
  extractApprovedStrategyForCreativePlanning,
  validateCreativeGenerationUpstream,
} from "@/lib/brain/llm/creative-planning-upstream";
import { buildCreativeGenerationProjectedContext } from "@/lib/brain/prompts/projected-context";
import { readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

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

function strategyPayload() {
  return {
    findings: [
      { id: "strategy-1", label: "Campaign objective", value: "Grow demo requests.", confidence: "medium" },
    ],
    decisions: [{ id: "dec-1", label: "Direction", rationale: "Focus on clarity.", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Next: channels", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "approve_strategy", label: "Confirm", requiresApproval: true }],
    warnings: [],
  };
}

function channelPayloadSelected() {
  return {
    findings: [
      { id: "channel-linkedin", label: "Channel: linkedin", value: "Selected — strategy fit", confidence: "medium" },
    ],
    decisions: [{ id: "dec-1", label: "Mix", rationale: "LinkedIn + email.", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Priority linkedin", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "approve_channels", label: "Confirm", requiresApproval: true }],
    warnings: [],
  };
}

function channelPayloadRecommendedOnly() {
  return {
    findings: [
      {
        id: "channel-linkedin",
        label: "Kanaal: linkedin",
        value: "Primair kanaal — past bij B2B-doelgroep",
        confidence: "medium",
      },
      {
        id: "channel-email",
        label: "Kanaal: email",
        value: "Afgewezen — onvoldoende basis",
        confidence: "low",
      },
    ],
    decisions: [{ id: "dec-1", label: "Mix", rationale: "LinkedIn first.", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Priority linkedin", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "approve_channels", label: "Confirm", requiresApproval: true }],
    warnings: [],
  };
}

function validCreativePayload() {
  return {
    deliverables: [
      {
        id: "del-1",
        deliverableType: "linkedin_carousel",
        channel: "linkedin",
        purpose: "Build awareness among SMB owners",
        targetAudience: "SMB owners",
        objective: "Drive demo requests",
        messageAngle: "Clarity and proof over hype",
        keyPoints: ["AI workspace"],
        callToActionDirection: "Book a demo",
        format: "Carousel — 5 slides",
        reviewStatus: "planned",
        rationale: "LinkedIn fits B2B audience",
        dependencies: ["strategy"],
        assumptions: ["Audience on LinkedIn"],
        provenance: "Approved strategy and channels",
      },
    ],
    decisions: [{ id: "dec-1", label: "Lead with LinkedIn", rationale: "Primary B2B channel", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Start with carousel", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "generate_content", label: "Generate planning", requiresApproval: true }],
    warnings: [],
  };
}

function campaignContext(orgId: string) {
  const project = createMarketingCampaignProject(peergentInput);
  const base = buildCampaignContextFromCreateInput(project, peergentInput, "en");
  return {
    ...base,
    websiteUrl: "https://peergent.com",
    websiteSource: "supplied_by_customer" as const,
    websiteState: "available" as const,
    competitorsSkipped: true,
    competitorContextState: "skipped" as const,
    brandContext: {
      brandName: "Peergent",
      industry: "AI software",
      productsAndServices: ["AI marketing colleagues for SMB teams"],
      uniqueSellingPoints: ["Premium AI workspace with human-like colleagues"],
      targetAudience: "SMB owners",
    },
    stepApprovals: {
      strategy_determined: "approved" as const,
      channels_selected: "approved" as const,
    },
    contextVersion: 2,
  };
}

function assembly(orgId: string) {
  const profile = buildPeergentCompanyProfile("en");
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: orgId,
    url: "https://peergent.com",
  });
  return assembleCompanyContextSync({
    organizationId: orgId,
    companyProfile: { ...profile, organizationId: orgId },
    websiteSnapshot: website,
    campaignContext: campaignContext(orgId),
    marketingUnderstanding: null,
    corrections: [],
  });
}

function mappedOutputs(orgId: string, channelPayload = channelPayloadSelected()) {
  const strategyOutput = mapStrategyPayloadToBrainOutput(strategyPayload(), {
    capabilityVersion: getBrainCapability("strategy").version,
    generatedAt: "2026-08-01T00:00:00.000Z",
    provenanceRef: `test:strategy:${orgId}`,
  });
  const channelOutput = mapChannelPlanningPayloadToBrainOutput(channelPayload, {
    capabilityVersion: getBrainCapability("channel_planning").version,
    generatedAt: "2026-08-01T00:00:00.000Z",
    provenanceRef: `test:channels:${orgId}`,
  });
  return { strategy: strategyOutput, channel_planning: channelOutput };
}

function execCtx(orgId: string, upstream: ReturnType<typeof mappedOutputs>) {
  const asm = assembly(orgId);
  return buildCapabilityExecutionContext({
    assembly: asm,
    request: {
      organizationId: orgId,
      peerId: "demo",
      capabilityId: "creative_generation",
      actorId: "test",
      campaignContext: campaignContext(orgId),
      locale: "en",
    },
    upstreamOutputs: upstream,
  });
}

function mockLlm(handler: (request: BrainLlmRequest) => Promise<{ rawText: string; usage: ReturnType<typeof buildLlmUsage> }>): BrainLlmProvider {
  return { id: "openai", complete: handler };
}

describe("creative-planning upstream adapters", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    resetPromptContextCache();
  });

  it("extracts channels from recommended-only LLM wording without selected keyword", () => {
    const channelOut = mapChannelPlanningPayloadToBrainOutput(channelPayloadRecommendedOnly(), {
      capabilityVersion: getBrainCapability("channel_planning").version,
      generatedAt: "2026-08-01T00:00:00.000Z",
      provenanceRef: "test",
    });
    const channels = extractApprovedChannelsForCreativePlanning({
      channelOutput: channelOut,
      channelsStepApproved: true,
    });
    expect(channels).toContain("linkedin");
    expect(channels).not.toContain("email");
  });

  it("validates fresh strategy and channel outputs for LLM execution", () => {
    const upstream = mappedOutputs("org-valid");
    const validation = validateCreativeGenerationUpstream({
      executionContext: execCtx("org-valid", upstream),
      storedContextVersion: 2,
      channelsStepApproved: true,
    });
    expect(validation.ok).toBe(true);
    expect(validation.approvedChannelIds).toContain("linkedin");
  });

  it("blocks when strategy output is missing", () => {
    const upstream = mappedOutputs("org-no-strategy");
    const validation = validateCreativeGenerationUpstream({
      executionContext: execCtx("org-no-strategy", { channel_planning: upstream.channel_planning }),
      channelsStepApproved: true,
    });
    expect(validation.ok).toBe(false);
    expect(validation.category).toBe("missing_strategy_output");
  });

  it("blocks when channel output is missing", () => {
    const upstream = mappedOutputs("org-no-channel");
    const validation = validateCreativeGenerationUpstream({
      executionContext: execCtx("org-no-channel", { strategy: upstream.strategy }),
      channelsStepApproved: true,
    });
    expect(validation.ok).toBe(false);
    expect(validation.category).toBe("missing_channel_output");
  });

  it("blocks when no channels are selected", () => {
    const rejectedOnly = mapChannelPlanningPayloadToBrainOutput(
      {
        findings: [
          {
            id: "channel-linkedin",
            label: "Channel: linkedin",
            value: "Rejected — insufficient basis",
            confidence: "low",
          },
        ],
        decisions: [],
        recommendations: [],
        actionProposals: [],
        warnings: [],
      },
      {
        capabilityVersion: getBrainCapability("channel_planning").version,
        generatedAt: "2026-08-01T00:00:00.000Z",
        provenanceRef: "test",
      }
    );
    const validation = validateCreativeGenerationUpstream({
      executionContext: execCtx("org-no-selected", {
        ...mappedOutputs("org-no-selected"),
        channel_planning: rejectedOnly,
      }),
      channelsStepApproved: true,
    });
    expect(validation.ok).toBe(false);
    expect(validation.category).toBe("no_selected_channels");
  });

  it("rejects stale strategy capability version", () => {
    const upstream = mappedOutputs("org-stale-strategy");
    upstream.strategy = { ...upstream.strategy, capabilityVersion: "0.0.1" };
    const validation = validateCreativeGenerationUpstream({
      executionContext: execCtx("org-stale-strategy", upstream),
      channelsStepApproved: true,
    });
    expect(validation.ok).toBe(false);
    expect(validation.category).toBe("stale_strategy_output");
  });

  it("rejects approved UI state without actual outputs", () => {
    const validation = validateCreativeGenerationUpstream({
      executionContext: execCtx("org-approved-only", {}),
      channelsStepApproved: true,
    });
    expect(validation.ok).toBe(false);
    expect(validation.category).toBe("approved_without_output");
  });

  it("maps strategy and channel outputs into projected context", () => {
    const orgId = "org-projection-map";
    const asm = assembly(orgId);
    const def = getBrainCapability("creative_generation");
    const projected = projectBrainContext({
      fullSnapshot: asm.brainSnapshot,
      companySnapshot: asm.companySnapshot,
      requiredSlices: def.requiredContext,
      optionalSlices: def.optionalContext,
    });
    const ctx = buildCreativeGenerationProjectedContext({
      snapshot: projected.snapshot,
      companySnapshot: asm.companySnapshot,
      executionContext: execCtx(orgId, mappedOutputs(orgId, channelPayloadRecommendedOnly())),
      projection: projected.projection,
    });
    expect(ctx.strategySummary).toMatch(/Campaign objective/);
    expect(ctx.approvedChannels).toMatch(/linkedin/i);
  });
});

describe("creative_generation upstream LLM regression", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    resetPromptContextCache();
    vi.unstubAllEnvs();
  });

  it("calls OpenAI once when upstream outputs are valid", async () => {
    const orgId = "org-llm-once";
    const asm = assembly(orgId);
    const def = getBrainCapability("creative_generation");
    const projected = projectBrainContext({
      fullSnapshot: asm.brainSnapshot,
      companySnapshot: asm.companySnapshot,
      requiredSlices: def.requiredContext,
      optionalSlices: def.optionalContext,
    });
    const llmCalls: string[] = [];
    const llm = createLlmBrainProvider({
      useOpenAI: true,
      llmProvider: mockLlm(async (req) => {
        llmCalls.push(req.capabilityId);
        return {
          rawText: JSON.stringify(validCreativePayload()),
          usage: buildLlmUsage({ provider: "openai", model: "gpt-test", inputTokens: 100, outputTokens: 50, latencyMs: 12 }),
        };
      }),
    });

    await llm.execute({
      context: {
        organizationId: orgId,
        peerId: "demo",
        capabilityId: "creative_generation",
        actorId: "test",
        environment: "live",
      },
      snapshot: projected.snapshot,
      capabilityId: "creative_generation",
      companySnapshot: asm.companySnapshot,
      executionContext: execCtx(orgId, mappedOutputs(orgId, channelPayloadRecommendedOnly())),
      projection: projected.projection,
    });

    expect(llmCalls).toEqual(["creative_generation"]);
    const usage = llm.consumeLastUsage();
    expect(usage?.fallbackReason).toBeUndefined();
    expect(usage?.inputTokens).toBe(100);
  });

  it("reads persisted campaign brain outputs for reuse", () => {
    const upstream = mappedOutputs("org-persist");
    const project: MarketingProject = {
      id: "camp-persist",
      peerId: "emma",
      title: "Launch",
      goal: "Leads",
      campaignType: "product_launch",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      ownerLabel: "Pilot",
      rawRequest: "Grow leads",
      campaignSetup: {
        description: "Grow leads",
        primaryGoalId: "generate_leads",
        targetAudience: "SMB owners",
        campaignContextVersion: 2,
        campaignBrainOutputs: {
          contextVersion: 2,
          strategy: upstream.strategy,
          channel_planning: upstream.channel_planning,
        },
      },
    };

    const seeded = readCampaignBrainOutputs(project);
    expect(seeded.strategy?.findings.length).toBeGreaterThan(0);
    expect(seeded.channel_planning?.findings.length).toBeGreaterThan(0);
    expect(extractApprovedStrategyForCreativePlanning(seeded.strategy)).not.toBeNull();
  });
});
