import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  enqueueLiveStrategyRunServer,
  resetLiveStrategyRunServerInFlightForTests,
} from "@/lib/office/campaign/live-strategy-run-execution";
import { createBrainRepositoriesForServer } from "@/lib/brain/persistence/repository-factory-server";
import { selectBrainProvider } from "@/lib/brain/runtime/provider-selector";
import { classifyPreLlmSkip } from "@/lib/brain/llm/failure-categories";
import { buildLiveCampaignEvidenceAction } from "@/lib/office/campaign/live-campaign-evidence-action";

const requireAuthMock = vi.hoisted(() => vi.fn());
const fetchPeerMock = vi.hoisted(() => vi.fn());
const fetchMock = vi.hoisted(() => vi.fn());

/** Canonical tenant for peer `emma` — matches resolveOrganizationId("emma", undefined). */
const TEST_ORG_ID = "org-emma";

vi.mock("@/lib/intelligence/api/require-org-context", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/intelligence/api/require-org-context")
  >();
  return {
    ...actual,
    requireAuthenticatedOrgContext: requireAuthMock,
  };
});

vi.mock("@/lib/peers/server-queries", () => ({
  fetchOrganizationPeerByIdServer: fetchPeerMock,
}));

function readyProject(): MarketingProject {
  return {
    id: "office-llm-proj",
    peerId: "emma",
    title: "Office LLM Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Grow leads",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Grow qualified demo requests",
      primaryGoalId: "generate_leads",
      targetAudience: "SMB owners",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
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
}

function validStrategyPayload() {
  return {
    findings: [
      {
        id: "strategy-1",
        label: "Business objective",
        value: "Example Co helps SMB owners adopt an AI workforce platform with premium positioning.",
        confidence: "medium",
      },
      {
        id: "strategy-2",
        label: "Campaign objective",
        value: "Grow qualified demo requests from SMB owners for Example Co.",
        confidence: "medium",
      },
      {
        id: "strategy-3",
        label: "Target audience",
        value: "SMB owners evaluating AI workforce tools.",
        confidence: "medium",
      },
      {
        id: "strategy-4",
        label: "Audience problem",
        value: "SMB owners need clarity on ROI before adopting AI workforce software.",
        confidence: "medium",
      },
      {
        id: "strategy-6",
        label: "Positioning",
        value: "Premium AI workspace specialist for SMB teams.",
        confidence: "medium",
      },
      {
        id: "strategy-7",
        label: "Value proposition",
        value: "Example Co delivers a calm, outcome-first AI workspace for SMB owners.",
        confidence: "medium",
      },
      {
        id: "strategy-9",
        label: "Supporting messages",
        value: "Premium AI workspace, unique selling points validated in campaign input.",
        confidence: "medium",
      },
      {
        id: "strategy-10",
        label: "Campaign concept",
        value: "Example Co focuses on proof-led clarity for SMB decision makers.",
        confidence: "medium",
      },
      {
        id: "strategy-17",
        label: "Risks",
        value: "Limited competitor proof may weaken differentiation claims.",
        confidence: "medium",
      },
      {
        id: "strategy-18",
        label: "Assumptions",
        value: "Campaign audience matches Example Co ICP from setup input.",
        confidence: "medium",
      },
      {
        id: "strategy-19",
        label: "Unknowns",
        value: "Conversion benchmarks, full competitor pricing.",
        confidence: "low",
      },
    ],
    decisions: [
      {
        id: "dec-strategy-1",
        label: "Recommended direction",
        rationale:
          "Focus on clarity and proof for SMB decision makers. Rejected alternatives: Compete on price (No evidence for structural price advantage); Generic broad-reach campaign (Reasoning indicates a specific audience).",
        confidence: "medium",
      },
    ],
    recommendations: [
      {
        id: "rec-strategy-1",
        label: "Next step: select channels",
        priority: "high",
      },
    ],
    actionProposals: [
      {
        id: "act-strategy-1",
        actionType: "approve_strategy",
        label: "Confirm strategy",
        requiresApproval: true,
      },
    ],
    warnings: [],
  };
}

function validChannelPayload() {
  return {
    findings: [
      {
        id: "channel-linkedin",
        label: "Channel: linkedin",
        value: "Selected — role: strategy fit for B2B audience.",
        confidence: "medium",
      },
      {
        id: "channel-email",
        label: "Channel: email",
        value: "Selected — role: nurture and conversion.",
        confidence: "medium",
      },
    ],
    decisions: [
      {
        id: "dec-channel-1",
        label: "Primary channel mix",
        rationale: "LinkedIn and email align with SMB owner targeting.",
        confidence: "medium",
      },
    ],
    recommendations: [
      {
        id: "rec-channel-1",
        label: "Channel priority: linkedin",
        priority: "high",
      },
    ],
    actionProposals: [
      {
        id: "act-channel-1",
        actionType: "approve_channels",
        label: "Confirm channels",
        requiresApproval: true,
      },
    ],
    warnings: [],
  };
}

function buildDomainInput(project: MarketingProject) {
  return {
    peerId: "emma",
    organizationId: TEST_ORG_ID,
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

function createOfficeLlmSupabaseMock(orgName = "Example Co"): AppSupabaseClient {
  const brainRuns = new Map<string, Record<string, unknown>>();
  const brainOutputs = new Map<string, Record<string, unknown>>();
  const BUSINESS_BRAIN_ID = "bb-office-llm-emma";
  const businessBrainRow = {
    id: BUSINESS_BRAIN_ID,
    organization_id: TEST_ORG_ID,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  };
  const businessBrainProducts = [
    {
      id: "bb-prod-1",
      business_brain_id: BUSINESS_BRAIN_ID,
      name: "AI workforce platform",
      description: "Premium AI workspace",
      category: "software",
      pricing_model: "subscription",
      metadata: {},
      graph_external_id: null,
      sort_order: 0,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    },
  ];
  const businessBrainSegments = [
    {
      id: "bb-seg-1",
      business_brain_id: BUSINESS_BRAIN_ID,
      name: "SMB owners",
      description: "Small business decision makers",
      segments: [],
      pain_points: [],
      buying_triggers: [],
      metadata: {},
      graph_external_id: null,
      sort_order: 0,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    },
  ];
  const companyDnaRow = {
    id: "dna-office-llm-emma",
    organization_id: TEST_ORG_ID,
    mission: "Help SMB owners adopt AI workforce software",
    values: [{ name: "Clarity", description: "Outcome-first communication" }],
    tone_of_voice: {
      summary: "Premium, calm, and editorial",
      personality: ["clear", "confident"],
      examples: [],
    },
    risk_profile: {},
    decision_principles: [],
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  };
  const websiteAssessmentRow = {
    organization_id: TEST_ORG_ID,
    source_url: "https://example.com",
    analyzed_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    assessment: {
      meta: {
        url: "https://example.com",
        companyName: "Example Co",
        industry: "B2B software",
        analyzedAt: "2026-08-01T00:00:00.000Z",
        analysisVersion: "1",
      },
      confidenceSnapshot: {
        observed: 1,
        likely: 0,
        unknown: 0,
        requiresMoreData: 0,
        overall: "high",
        overallReason: "Observed website content",
      },
      executiveSummary: {
        conclusion: "Example Co positions an AI workforce platform for SMB owners.",
        rationale: "Homepage hero states the value proposition clearly.",
        confidence: { level: "high", reason: "Direct observation" },
      },
      companyDna: {
        businessType: "B2B SaaS",
        targetCustomers: "SMB owners",
        brandPresentation: "Premium",
        findings: [],
        confidence: { level: "moderate", reason: "Partial" },
      },
      customerJourney: {
        frictionPoints: [],
        opportunities: [],
        confidence: { level: "moderate", reason: "Partial" },
      },
      marketingGrowth: {
        observed: [],
        likely: [],
        unknown: [],
        enrichmentSlots: [],
        confidence: { level: "moderate", reason: "Partial" },
      },
      operations: {
        areas: [],
        enrichmentSlots: [],
        confidence: { level: "low", reason: "Limited" },
      },
      workforceRecommendations: {
        recommendations: [],
        confidence: { level: "low", reason: "Limited" },
      },
      businessBrainConclusion: {
        statement: "Ready for marketing",
        primaryAction: { label: "Continue" },
        confidence: { level: "moderate", reason: "Partial" },
      },
    },
  };
  const businessBrainCompetitors = [
    {
      id: "bb-comp-1",
      business_brain_id: BUSINESS_BRAIN_ID,
      name: "Rival Co",
      description: "Competing AI workspace",
      metadata: {},
      graph_external_id: null,
      sort_order: 0,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-01T00:00:00.000Z",
    },
  ];

  const runStoreKey = (orgId: string, id: string) => `${orgId}:${id}`;

  type TableFilters = {
    orgId?: string;
    id?: string;
    businessBrainId?: string;
  };

  function createTableBuilder(handlers: {
    onInsert?: (row: Record<string, unknown>) => Record<string, unknown>;
    onSelectOne?: (filters: TableFilters) => Record<string, unknown> | null;
    onSelectMany?: (filters: TableFilters) => readonly Record<string, unknown>[];
    onUpdate?: (
      filters: TableFilters,
      patch: Record<string, unknown>
    ) => Record<string, unknown> | null;
  }) {
    let filters: TableFilters = {};
    let pendingInsert: Record<string, unknown> | null = null;
    let pendingUpdate: Record<string, unknown> | null = null;

    const builder: Record<string, unknown> = {};
    const self = () => builder;

    builder.insert = vi.fn((payload: Record<string, unknown> | Record<string, unknown>[]) => {
      const row = Array.isArray(payload) ? payload[0]! : payload;
      pendingInsert = handlers.onInsert?.(row) ?? row;
      return builder;
    });
    builder.update = vi.fn((payload: Record<string, unknown>) => {
      pendingUpdate = payload;
      return builder;
    });
    builder.select = vi.fn(self);
    builder.eq = vi.fn((column: string, value: string) => {
      if (column === "organization_id") filters = { ...filters, orgId: value };
      if (column === "id") filters = { ...filters, id: value };
      if (column === "run_id") filters = { ...filters, id: value };
      if (column === "business_brain_id") filters = { ...filters, businessBrainId: value };
      return builder;
    });
    builder.order = vi.fn(self);
    builder.limit = vi.fn(self);
    builder.single = vi.fn(async () => {
      if (pendingInsert) {
        const row = pendingInsert;
        pendingInsert = null;
        return { data: row, error: null };
      }
      if (pendingUpdate && handlers.onUpdate) {
        const row = handlers.onUpdate(filters, pendingUpdate);
        pendingUpdate = null;
        return row ? { data: row, error: null } : { data: null, error: { message: "not found" } };
      }
      const row = handlers.onSelectOne?.(filters) ?? null;
      return row ? { data: row, error: null } : { data: null, error: { message: "not found" } };
    });
    builder.maybeSingle = vi.fn(async () => {
      const row = handlers.onSelectOne?.(filters) ?? null;
      return { data: row, error: null };
    });
    builder.upsert = vi.fn(async () => ({ data: null, error: null }));
    builder.delete = vi.fn(self);
    builder.then = (
      onFulfilled?: (value: { data: unknown; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => {
      const rows = handlers.onSelectMany?.(filters) ?? [];
      const result = { data: rows, error: null as null };
      try {
        return Promise.resolve(onFulfilled ? onFulfilled(result) : result);
      } catch (error) {
        return onRejected ? Promise.resolve(onRejected(error)) : Promise.reject(error);
      }
    };
    return builder;
  }

  return {
    from: vi.fn((table: string) => {
      if (table === "organizations") {
        return createTableBuilder({
          onSelectOne: () => ({
            id: TEST_ORG_ID,
            name: orgName,
            slug: "example-co",
          }),
        });
      }

      if (table === "brain_runs") {
        return createTableBuilder({
          onInsert: (row) => {
            const id = String(row.id ?? `run-${brainRuns.size + 1}`);
            const stored = {
              ...row,
              id,
              organization_id: row.organization_id ?? TEST_ORG_ID,
              usage: row.usage ?? {},
              budget: row.budget ?? {},
              version: row.version ?? 1,
            };
            brainRuns.set(runStoreKey(String(stored.organization_id), id), stored);
            return stored;
          },
          onSelectOne: ({ orgId, id }) => {
            if (!orgId || !id) return null;
            return brainRuns.get(runStoreKey(orgId, id)) ?? null;
          },
          onSelectMany: ({ orgId }) =>
            [...brainRuns.values()].filter((row) => !orgId || row.organization_id === orgId),
          onUpdate: ({ orgId, id }, patch) => {
            if (!orgId || !id) return null;
            const key = runStoreKey(orgId, id);
            const existing = brainRuns.get(key);
            if (!existing) return null;
            const next = {
              ...existing,
              ...patch,
              version: Number(existing.version ?? 1) + 1,
            };
            brainRuns.set(key, next);
            return next;
          },
        });
      }

      if (table === "brain_outputs") {
        return createTableBuilder({
          onInsert: (row) => {
            const id = String(row.id ?? `output-${brainOutputs.size + 1}`);
            const stored = { ...row, id, organization_id: row.organization_id ?? TEST_ORG_ID };
            brainOutputs.set(`${stored.organization_id}:${id}`, stored);
            return stored;
          },
          onSelectOne: ({ orgId, id }) => {
            if (!orgId || !id) return null;
            return brainOutputs.get(`${orgId}:${id}`) ?? null;
          },
        });
      }

      if (table === "brain_project_episodes") {
        return createTableBuilder({
          onSelectOne: () => null,
        });
      }

      if (table === "business_brains") {
        return createTableBuilder({
          onInsert: (row) => ({
            ...businessBrainRow,
            ...row,
            id: String(row.id ?? BUSINESS_BRAIN_ID),
          }),
          onSelectOne: ({ orgId }) =>
            !orgId || orgId === TEST_ORG_ID ? businessBrainRow : null,
        });
      }

      if (table === "business_brain_products") {
        return createTableBuilder({
          onSelectMany: ({ businessBrainId }) =>
            !businessBrainId || businessBrainId === BUSINESS_BRAIN_ID
              ? businessBrainProducts
              : [],
        });
      }

      if (table === "business_brain_customer_segments") {
        return createTableBuilder({
          onSelectMany: ({ businessBrainId }) =>
            !businessBrainId || businessBrainId === BUSINESS_BRAIN_ID
              ? businessBrainSegments
              : [],
        });
      }

      if (table === "business_brain_competitors") {
        return createTableBuilder({
          onSelectMany: ({ businessBrainId }) =>
            !businessBrainId || businessBrainId === BUSINESS_BRAIN_ID
              ? businessBrainCompetitors
              : [],
        });
      }

      if (table === "company_dna") {
        return createTableBuilder({
          onInsert: (row) => ({
            ...companyDnaRow,
            ...row,
            id: String(row.id ?? companyDnaRow.id),
          }),
          onSelectOne: ({ orgId }) => (!orgId || orgId === TEST_ORG_ID ? companyDnaRow : null),
        });
      }

      if (table === "website_intelligence_assessments") {
        return createTableBuilder({
          onSelectOne: ({ orgId }) =>
            !orgId || orgId === TEST_ORG_ID ? websiteAssessmentRow : null,
        });
      }

      if (
        table === "business_brain_services" ||
        table === "business_brain_facts" ||
        table === "business_brain_internal_processes" ||
        table === "business_brain_knowledge_sources"
      ) {
        return createTableBuilder({
          onSelectMany: () => [],
        });
      }

      return createTableBuilder({
        onSelectMany: () => [],
        onSelectOne: () => null,
      });
    }),
    rpc: vi.fn(async (fnName: string) => {
      if (fnName === "upsert_brain_project_episode_versioned") {
        return { data: { new_version: 1, conflict: false }, error: null };
      }
      return { data: null, error: null };
    }),
  } as unknown as AppSupabaseClient;
}

function openAiResponse(payload: unknown = validStrategyPayload()) {
  return {
    model: "gpt-4.1-mini",
    output_text: JSON.stringify(payload),
    usage: { input_tokens: 665, output_tokens: 1085 },
  };
}

describe("Office server LLM integration", () => {
  beforeEach(() => {
    resetLiveStrategyRunServerInFlightForTests();
    requireAuthMock.mockReset();
    fetchPeerMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("BRAIN_USE_OPENAI", "true");
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => openAiResponse(),
    });
    requireAuthMock.mockResolvedValue({
      supabase: createOfficeLlmSupabaseMock(),
      organizationId: TEST_ORG_ID,
      userId: "user-1",
    });
    fetchPeerMock.mockResolvedValue({ id: "emma", organization_id: TEST_ORG_ID });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetLiveStrategyRunServerInFlightForTests();
  });

  it("registers llm first in the Office server repository bundle", () => {
    const bundle = createBrainRepositoriesForServer({ environment: "live", peerId: "emma" });
    expect(bundle.providers.map((provider) => provider.id)).toEqual(["llm", "deterministic", "demo"]);
    const selected = selectBrainProvider({
      environment: "live",
      capabilityId: "strategy",
      providers: bundle.providers,
    });
    expect(selected.provider.id).toBe("llm");
  });

  it("runLiveStrategyRunServer executes one OpenAI fetch and returns llm usage", async () => {
    const project = readyProject();
    const supabase = createOfficeLlmSupabaseMock();
    const result = await enqueueLiveStrategyRunServer({
      peerId: "emma",
      projectId: project.id,
      project,
      understanding: null,
      organizationId: TEST_ORG_ID,
      supabase,
      locale: "en",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("llm");
    expect(result.inputTokens).toBe(665);
    expect(result.outputTokens).toBe(1085);
    expect(result.fallbackUsed).toBe(false);
    expect(result.project?.campaignSetup?.strategyGeneratedAt).toBeTruthy();
    expect(result.project?.campaignSetup?.strategyRun?.provider).toBe("llm");
    expect(result.project?.campaignSetup?.strategyRun?.fallbackUsed).toBe(false);
  });

  it("buildLiveCampaignEvidenceAction uses server llm path for strategy evidence", async () => {
    const project = readyProject();
    const result = await buildLiveCampaignEvidenceAction({
      peerId: "emma",
      projectId: project.id,
      stepId: "strategy_determined",
      project,
      domainInput: buildDomainInput(project),
      locale: "en",
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.bundle?.devDiagnostics?.provider).toBe("llm");
    expect(result.bundle?.devDiagnostics?.fallbackUsed).toBe(false);
    expect(result.bundle?.devDiagnostics?.inputTokens).toBeGreaterThan(0);
    expect(result.bundle?.devDiagnostics?.llmRegistered).toBe(true);
  });

  it("buildLiveCampaignEvidenceAction uses server llm path for channels evidence", async () => {
    let callCount = 0;
    fetchMock.mockImplementation(async () => {
      callCount += 1;
      const payload = callCount === 1 ? validStrategyPayload() : validChannelPayload();
      return {
        ok: true,
        status: 200,
        json: async () => openAiResponse(payload),
      };
    });

    const project = readyProject();
    const result = await buildLiveCampaignEvidenceAction({
      peerId: "emma",
      projectId: project.id,
      stepId: "channels_selected",
      project,
      domainInput: buildDomainInput(project),
      locale: "en",
    });

    expect(result.ok).toBe(true);
    expect(callCount).toBe(2);
    expect(result.bundle?.devDiagnostics?.provider).toBe("llm");
    expect(result.bundle?.devDiagnostics?.fallbackUsed).toBe(false);
    expect(result.bundle?.devDiagnostics?.inputTokens).toBeGreaterThan(0);
    expect(result.bundle?.devDiagnostics?.fallbackReason).toBeUndefined();
  });

  it("buildLiveCampaignEvidenceAction uses server llm path for deliverables evidence", async () => {
    let callCount = 0;
    fetchMock.mockImplementation(async () => {
      callCount += 1;
      let payload = validStrategyPayload();
      if (callCount === 2) payload = validChannelPayload();
      if (callCount === 3) payload = validCreativeGenerationPayload();
      return {
        ok: true,
        status: 200,
        json: async () => openAiResponse(payload),
      };
    });

    function validCreativeGenerationPayload() {
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
        decisions: [
          {
            id: "dec-1",
            label: "Lead with LinkedIn",
            rationale: "Primary B2B channel",
            confidence: "medium",
          },
        ],
        recommendations: [{ id: "rec-1", label: "Start with carousel", priority: "high" }],
        actionProposals: [
          {
            id: "act-1",
            actionType: "generate_content",
            label: "Generate planning",
            requiresApproval: true,
          },
        ],
        warnings: [],
      };
    }

    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        stepApprovals: {
          strategy_determined: "approved",
          channels_selected: "approved",
        },
      },
    });
    const result = await buildLiveCampaignEvidenceAction({
      peerId: "emma",
      projectId: project.id,
      stepId: "deliverables_created",
      project,
      domainInput: buildDomainInput(project),
      locale: "en",
    });

    expect(result.ok).toBe(true);
    expect(callCount).toBe(3);
    expect(result.bundle?.devDiagnostics?.provider).toBe("llm");
    expect(result.bundle?.devDiagnostics?.fallbackUsed).toBe(false);
    expect(result.bundle?.devDiagnostics?.inputTokens).toBeGreaterThan(0);
    const sectionText = result.bundle?.sections.flatMap((s) => s.items).join("\n") ?? "";
    expect(sectionText).not.toMatch(/\| type:/);
    expect(sectionText).toMatch(/LinkedIn carousel/i);
  });

  it("classifies missing API key without starting OpenAI fetch", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(
      classifyPreLlmSkip({
        useOpenAI: true,
        hasProjection: true,
        hasExecutionContext: true,
        llmRegistered: true,
        providerInitiallySelected: "llm",
        hasCustomLlmProvider: false,
      })
    ).toBe("missing_api_key");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("classifies disabled feature flag without OpenAI fetch", async () => {
    vi.stubEnv("BRAIN_USE_OPENAI", "false");
    const bundle = createBrainRepositoriesForServer({ environment: "live", peerId: "emma" });
    expect(bundle.providers.some((provider) => provider.id === "llm")).toBe(false);
    expect(bundle.providers[0]?.id).toBe("deterministic");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
