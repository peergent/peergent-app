import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeBrainForWorkflowStep } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import { createDeterministicBrainProvider } from "@/lib/brain/providers/deterministic-provider";
import { createDemoBrainProvider } from "@/lib/brain/demo/demo-provider";
import { InMemoryBrainCacheStore } from "@/lib/brain/cache/store";
import { createPersistentInMemoryRepositories } from "@/lib/brain/persistence/in-memory-persistent-repositories";
import { InMemoryBrainRunRepository } from "@/lib/brain/runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "@/lib/brain/runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "@/lib/brain/runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "@/lib/brain/runtime/repositories/in-memory-idempotency-repository";
import type { BrainRepositoryBundle } from "@/lib/brain/persistence/repository-factory";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import { mapStrategyPayloadToBrainOutput } from "@/lib/brain/llm/response-validator";
import { mapChannelPlanningPayloadToBrainOutput } from "@/lib/brain/llm/channel-response-validator";
import { mapCreativeGenerationPayloadToBrainOutput } from "@/lib/brain/llm/creative-generation-response-validator";
import { executeDeterministicCapability } from "@/lib/brain/providers/deterministic-provider";
import type { BrainCapabilityProvider } from "@/lib/brain/providers/provider-interface";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import { readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import { tryBuildCachedCampaignEvidence } from "@/lib/office/campaign/cached-campaign-evidence";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const peergentInput = {
  peerId: "emma" as const,
  ownerLabel: "Emma",
  name: "Peergent",
  goalLabel: "Demo requests",
  description: "More demo requests from SMB owners.",
  primaryGoalId: "generate_leads" as const,
  targetAudience: "SMB owners",
  setupMode: "automatic" as const,
  approvalMode: "approval_before_publication" as const,
};

function validStrategyPayload() {
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

function validChannelPayload() {
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
    actionProposals: [
      { id: "act-1", actionType: "generate_content", label: "Generate planning", requiresApproval: true },
    ],
    warnings: [],
  };
}

function mappedOutputs() {
  const generatedAt = "2026-08-01T00:00:00.000Z";
  return {
    strategy: mapStrategyPayloadToBrainOutput(validStrategyPayload(), {
      capabilityVersion: getBrainCapability("strategy").version,
      generatedAt,
      provenanceRef: "test",
    }),
    channel_planning: mapChannelPlanningPayloadToBrainOutput(validChannelPayload(), {
      capabilityVersion: getBrainCapability("channel_planning").version,
      generatedAt,
      provenanceRef: "test",
    }),
    creative_generation: mapCreativeGenerationPayloadToBrainOutput(validCreativePayload(), {
      capabilityVersion: getBrainCapability("creative_generation").version,
      generatedAt,
      provenanceRef: "test",
    }),
  };
}

function buildProject(overrides?: Partial<MarketingProject>): MarketingProject {
  const base = createMarketingCampaignProject(peergentInput);
  return {
    ...base,
    peerId: "emma",
    campaignSetup: {
      ...base.campaignSetup!,
      campaignContextVersion: 1,
      businessAnalyzedApproved: true,
      stepApprovals: {
        strategy_determined: "approved",
        channels_selected: "approved",
      },
    },
    ...overrides,
  };
}

function buildDomainInput(project: MarketingProject): MarketingPeerDomainInput {
  return {
    peerId: "emma",
    userName: "User",
    peerName: "Emma",
    campaignTitle: project.title,
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [],
    projects: [project],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

function mockServerRepositories(): BrainRepositoryBundle {
  return {
    storageMode: "persistent_in_memory",
    sync: {
      runs: new InMemoryBrainRunRepository(),
      outputs: new InMemoryBrainOutputRepository(),
      audit: new InMemoryBrainAuditRepository(),
      idempotency: new InMemoryBrainIdempotencyRepository(),
    },
    async: createPersistentInMemoryRepositories(),
    cache: new InMemoryBrainCacheStore(),
    providers: [createDeterministicBrainProvider(), createDemoBrainProvider()],
  };
}

function createTrackingLlmProvider(llmCalls: string[]): BrainCapabilityProvider & {
  consumeLastUsage: () => ReturnType<typeof buildLlmUsage> | undefined;
} {
  let lastUsage = buildLlmUsage({
    provider: "openai",
    model: "gpt-test",
    inputTokens: 100,
    outputTokens: 50,
    latencyMs: 12,
  });

  return {
    id: "llm",
    executeSync: (input) => executeDeterministicCapability(input),
    execute: async (input) => {
      if (
        input.capabilityId === "strategy" ||
        input.capabilityId === "channel_planning" ||
        input.capabilityId === "creative_generation"
      ) {
        llmCalls.push(input.capabilityId);
        lastUsage = buildLlmUsage({
          provider: "openai",
          model: "gpt-test",
          inputTokens: 100,
          outputTokens: 50,
          latencyMs: 12,
        });
        if (input.capabilityId === "strategy") {
          return mapStrategyPayloadToBrainOutput(validStrategyPayload(), {
            capabilityVersion: getBrainCapability("strategy").version,
            generatedAt: new Date().toISOString(),
            provenanceRef: "test",
          });
        }
        if (input.capabilityId === "channel_planning") {
          return mapChannelPlanningPayloadToBrainOutput(validChannelPayload(), {
            capabilityVersion: getBrainCapability("channel_planning").version,
            generatedAt: new Date().toISOString(),
            provenanceRef: "test",
          });
        }
        return mapCreativeGenerationPayloadToBrainOutput(validCreativePayload(), {
          capabilityVersion: getBrainCapability("creative_generation").version,
          generatedAt: new Date().toISOString(),
          provenanceRef: "test",
        });
      }
      return executeDeterministicCapability(input);
    },
    consumeLastUsage: () => {
      const usage = lastUsage;
      lastUsage = undefined;
      return usage;
    },
  };
}

describe("deliverables cache reuse", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("BRAIN_USE_OPENAI", "true");
  });

  it("executes creative_generation once when no stored output exists", async () => {
    const llmCalls: string[] = [];
    const repositories = mockServerRepositories();
    repositories.providers = [
      createTrackingLlmProvider(llmCalls),
      createDeterministicBrainProvider(),
      createDemoBrainProvider(),
    ];

    const outputs = mappedOutputs();
    const project = buildProject({
      campaignSetup: {
        ...buildProject().campaignSetup!,
        campaignBrainOutputs: {
          contextVersion: 1,
          strategy: outputs.strategy,
          channel_planning: outputs.channel_planning,
        },
      },
    });
    const domainInput = buildDomainInput(project);

    await executeBrainForWorkflowStep(
      {
        stepId: "deliverables_created",
        peerId: "emma",
        project,
        domainInput,
        locale: "en",
      },
      { repositories }
    );

    expect(llmCalls).toEqual(["creative_generation"]);
  });

  it("reuses stored creative_generation with zero LLM calls on reopen", async () => {
    const llmCalls: string[] = [];
    const repositories = mockServerRepositories();
    repositories.providers = [
      createTrackingLlmProvider(llmCalls),
      createDeterministicBrainProvider(),
      createDemoBrainProvider(),
    ];

    const outputs = mappedOutputs();
    const project = buildProject({
      campaignSetup: {
        ...buildProject().campaignSetup!,
        campaignBrainOutputs: {
          contextVersion: 1,
          strategy: outputs.strategy,
          channel_planning: outputs.channel_planning,
          creative_generation: outputs.creative_generation,
        },
      },
    });
    const domainInput = buildDomainInput(project);

    const workflowResult = await executeBrainForWorkflowStep(
      {
        stepId: "deliverables_created",
        peerId: "emma",
        project,
        domainInput,
        locale: "en",
      },
      { repositories }
    );

    expect(llmCalls).toEqual([]);
    expect(workflowResult?.result.cacheHit).toBe(true);
    expect(workflowResult?.result.run.usage.cacheHit).toBe(true);
    expect(workflowResult?.result.run.usage.inputTokens).toBe(0);
    expect(workflowResult?.result.run.usage.outputTokens).toBe(0);
  });

  it("invalidates stored outputs when campaign context version changes", () => {
    const outputs = mappedOutputs();
    const project = buildProject({
      campaignSetup: {
        ...buildProject().campaignSetup!,
        campaignContextVersion: 2,
        campaignBrainOutputs: {
          contextVersion: 1,
          creative_generation: outputs.creative_generation,
        },
      },
    });

    const seeded = readCampaignBrainOutputs(project);
    expect(seeded.creative_generation).toBeUndefined();
  });

  it("invalidates stored outputs when capability version changes", () => {
    const outputs = mappedOutputs();
    const project = buildProject({
      campaignSetup: {
        ...buildProject().campaignSetup!,
        campaignBrainOutputs: {
          contextVersion: 1,
          creative_generation: {
            ...outputs.creative_generation,
            capabilityVersion: "0.0.1",
          },
        },
      },
    });

    const seeded = readCampaignBrainOutputs(project);
    expect(seeded.creative_generation).toBeUndefined();
  });

  it("reuses stored channel_planning with zero LLM calls on reopen", async () => {
    const llmCalls: string[] = [];
    const repositories = mockServerRepositories();
    repositories.providers = [
      createTrackingLlmProvider(llmCalls),
      createDeterministicBrainProvider(),
      createDemoBrainProvider(),
    ];

    const outputs = mappedOutputs();
    const project = buildProject({
      campaignSetup: {
        ...buildProject().campaignSetup!,
        campaignBrainOutputs: {
          contextVersion: 1,
          strategy: outputs.strategy,
          channel_planning: outputs.channel_planning,
        },
      },
    });
    const domainInput = buildDomainInput(project);

    await executeBrainForWorkflowStep(
      {
        stepId: "channels_selected",
        peerId: "emma",
        project,
        domainInput,
        locale: "en",
      },
      { repositories }
    );

    expect(llmCalls).toEqual([]);
  });

  it("builds instant cached evidence for strategy, channels and deliverables", () => {
    const outputs = mappedOutputs();

    for (const stepId of ["strategy_determined", "channels_selected", "deliverables_created"] as const) {
      const capabilityKey =
        stepId === "strategy_determined"
          ? "strategy"
          : stepId === "channels_selected"
            ? "channel_planning"
            : "creative_generation";
      const project = buildProject({
        campaignSetup: {
          ...buildProject().campaignSetup!,
          campaignBrainOutputs: {
            contextVersion: 1,
            [capabilityKey]: outputs[capabilityKey],
          },
        },
      });
      const domainInput = buildDomainInput(project);
      const bundle = tryBuildCachedCampaignEvidence({
        stepId,
        peerId: "emma",
        project,
        domainInput,
        locale: "en",
      });
      expect(bundle).not.toBeNull();
      expect(bundle?.devDiagnostics?.outputSource).toBe("stored");
      expect(bundle?.devDiagnostics?.requestStarted).toBe(false);
      expect(bundle?.devDiagnostics?.inputTokens).toBe(0);
    }
  });
});
