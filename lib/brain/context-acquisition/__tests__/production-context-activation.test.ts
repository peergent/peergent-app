import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getAuthenticatedOrgContext: vi.fn(),
  isAuthContext: vi.fn(),
}));

const serverMocks = vi.hoisted(() => ({
  ensureServerBrainRuntime: vi.fn(async () => ({ mode: "supabase", durable: { mode: "supabase" } })),
  prepareBrainServerContext: vi.fn(async () => ({
    realContext: true as const,
    assembly: {
      organizationId: "org-health-test",
      state: "partial" as const,
      companySnapshot: { organizationId: "org-health-test" },
      missingInformation: [],
      readiness: { scores: [], overall: 0 },
    },
    package: {
      organizationId: "org-health-test",
      contextReady: true,
      items: [{ id: "1", summary: "SECRET SHOULD NOT LEAK" }],
      acquisitionGaps: [],
      diagnostics: {
        adapterOutcomes: { organization: { status: "completed" as const, itemCount: 1, durationMs: 1 } },
        blockingGapCount: 0,
        gapCount: 0,
        totalItems: 1,
        durationMs: 12,
        startedAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-01-01T00:00:00.000Z",
        truncated: false,
      },
    },
  })),
}));

vi.mock("@/lib/intelligence/api/org-context", () => authMocks);
vi.mock("@/lib/brain/persistence/server/ensure-server-brain-runtime", () => ({
  ensureServerBrainRuntime: serverMocks.ensureServerBrainRuntime,
}));
vi.mock("@/lib/brain/context-acquisition/server/prepare-brain-server-context", () => ({
  prepareBrainServerContext: serverMocks.prepareBrainServerContext,
}));

import {
  assertLiveBrainServerContext,
  assertProductionEpisodeRealContext,
  ContextAcquisitionConfigurationError,
  ContextAcquisitionInfrastructureError,
} from "../server/context-acquisition-config";
import { executeBrainForWorkflowStep } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { ContextAssemblyResult } from "@/lib/brain/context/assembly-types";
import { assembleCompanyContextSync } from "@/lib/brain/context/company-context-assembler";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { GET } from "@/app/api/brain/context/health/route";

const mockSupabase = {} as import("@/lib/intelligence/api/org-context").AppSupabaseClient;

const peerInput = {
  peerId: "emma" as const,
  ownerLabel: "Emma",
  name: "Acme Campaign",
  goalLabel: "Leads",
  description: "Generate qualified leads.",
  primaryGoalId: "generate_leads" as const,
  targetAudience: "SMB owners",
  setupMode: "automatic" as const,
  approvalMode: "approval_before_publication" as const,
  selectedChannels: ["linkedin"] as const,
};

function sampleAssembly(organizationId: string): ContextAssemblyResult {
  return assembleCompanyContextSync({
    organizationId,
    companyProfile: null,
    marketingUnderstanding: null,
    websiteSnapshot: null,
    locale: "en",
  });
}

describe("PX-49.1 Production Context Activation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fails closed in production when live path lacks authenticated supabase", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertLiveBrainServerContext({ peerId: "emma", supabase: null })
    ).toThrow(ContextAcquisitionInfrastructureError);
    vi.unstubAllEnvs();
  });

  it("allows demo peers without supabase", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertLiveBrainServerContext({ peerId: "demo", supabase: null })
    ).not.toThrow();
    vi.unstubAllEnvs();
  });

  it("requires production episode real context configuration", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionEpisodeRealContext({
        peerId: "emma",
        useRealContext: false,
        supabase: mockSupabase,
        campaignContext: {},
      })
    ).toThrow(ContextAcquisitionConfigurationError);
    vi.unstubAllEnvs();
  });

  it("live workflow execution cannot silently use fixture context when real context required", async () => {
    const project = createMarketingCampaignProject(peerInput);
    const domainInput = {
      peerId: peerInput.peerId,
      organizationId: "org-live-test",
      userName: "Test",
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

    await expect(
      executeBrainForWorkflowStep(
        {
          stepId: "strategy_determined",
          peerId: "emma",
          project,
          domainInput,
          locale: "en",
        },
        { requireRealContext: true }
      )
    ).rejects.toThrow(ContextAcquisitionConfigurationError);
  });

  it("uses pre-acquired context assembly for live workflow execution", async () => {
    vi.mock("@/lib/brain/integration/resolve-company-intelligence", () => ({
      resolveCompanyIntelligence: vi.fn(() => {
        throw new Error("resolveCompanyIntelligence must not run when contextAssembly is provided");
      }),
      resolveOrganizationId: vi.fn((_peerId: string, orgId?: string) => orgId ?? "org-test"),
    }));

    const project = createMarketingCampaignProject(peerInput);
    const domainInput = {
      peerId: peerInput.peerId,
      organizationId: "org-acquired-test",
      userName: "Test",
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

    const acquired = sampleAssembly("org-acquired-test");

    const result = await executeBrainForWorkflowStep(
      {
        stepId: "strategy_determined",
        peerId: "emma",
        project,
        domainInput,
        locale: "en",
      },
      {
        contextAssembly: acquired,
        requireRealContext: true,
      }
    );

    expect(result).not.toBeNull();
    expect(result?.result.assembly.organizationId).toBe("org-acquired-test");

    vi.unmock("@/lib/brain/integration/resolve-company-intelligence");
  });

  it("health endpoint requires authentication", async () => {
    authMocks.getAuthenticatedOrgContext.mockResolvedValue(
      Response.json({ error: "Unauthorized" }, { status: 401 })
    );
    authMocks.isAuthContext.mockReturnValue(false);

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("health endpoint returns metadata only without context contents", async () => {
    authMocks.getAuthenticatedOrgContext.mockResolvedValue({
      organizationId: "org-health-test",
      supabase: mockSupabase,
    });
    authMocks.isAuthContext.mockReturnValue(true);

    vi.stubEnv("BRAIN_PERSISTENCE_MODE", "persistent_in_memory");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.realContext).toBe(true);
    expect(body.organizationScoped).toBe(true);
    expect(body.itemCount).toBeTypeOf("number");
    expect(JSON.stringify(body)).not.toContain("SECRET SHOULD NOT LEAK");
    expect(body.items).toBeUndefined();
    expect(body.summary).toBeUndefined();

    vi.unstubAllEnvs();
  });

  it("health endpoint invokes real context preparation", async () => {
    authMocks.getAuthenticatedOrgContext.mockResolvedValue({
      organizationId: "org-health-test",
      supabase: mockSupabase,
    });
    authMocks.isAuthContext.mockReturnValue(true);
    serverMocks.prepareBrainServerContext.mockClear();

    vi.stubEnv("BRAIN_PERSISTENCE_MODE", "persistent_in_memory");
    await GET();
    vi.unstubAllEnvs();

    expect(serverMocks.prepareBrainServerContext).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-health-test",
        supabase: mockSupabase,
      })
    );
  });
});

describe("PX-49.1 campaign context propagation", () => {
  it("buildCampaignContext produces project-scoped context for acquisition", () => {
    const project = createMarketingCampaignProject(peerInput);
    const ctx = buildCampaignContextFromCreateInput(project, peerInput, "en");
    expect(ctx.projectId).toBe(project.id);
    expect(ctx.goals.length).toBeGreaterThan(0);
  });
});
