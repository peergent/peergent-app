import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { runLiveStrategyAction } from "@/lib/office/campaign/live-strategy-run-action";
import { OrgContextError } from "@/lib/intelligence/api/require-org-context";

const enqueueMock = vi.hoisted(() => vi.fn());
const requireAuthMock = vi.hoisted(() => vi.fn());
const fetchPeerMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/office/campaign/live-strategy-run-execution", () => ({
  enqueueLiveStrategyRunServer: enqueueMock,
}));

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
    id: "proj-1",
    peerId: "emma",
    title: "Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Grow leads",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Grow leads",
      primaryGoalId: "generate_leads",
      targetAudience: "SMB",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      websiteUrl: "https://example.com",
      campaignCompetitors: [{ name: "Competitor" }],
      campaignContextVersion: 1,
      campaignBrandContext: {
        brandName: "Example",
        targetAudience: "SMB",
      },
    },
  };
}

describe("runLiveStrategyAction", () => {
  beforeEach(() => {
    enqueueMock.mockReset();
    requireAuthMock.mockReset();
    fetchPeerMock.mockReset();
    requireAuthMock.mockResolvedValue({
      supabase: {},
      organizationId: "org-1",
      userId: "user-1",
    });
    fetchPeerMock.mockResolvedValue({ id: "emma", organization_id: "org-1" });
  });

  it("rejects unauthenticated callers", async () => {
    requireAuthMock.mockRejectedValue(new OrgContextError("unauthorized", "Unauthorized."));
    const result = await runLiveStrategyAction({
      peerId: "emma",
      projectId: "proj-1",
      project: readyProject(),
      understanding: null,
    });
    expect(result.error).toBe("unauthorized");
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it("rejects cross-org peer access", async () => {
    fetchPeerMock.mockResolvedValue(null);
    const result = await runLiveStrategyAction({
      peerId: "emma",
      projectId: "proj-1",
      project: readyProject(),
      understanding: null,
    });
    expect(result.error).toBe("not_found");
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it("returns llm usage metadata without secrets when server run succeeds", async () => {
    const project = readyProject();
    enqueueMock.mockResolvedValue({
      ok: true,
      status: "completed",
      project: {
        ...project,
        campaignSetup: {
          ...project.campaignSetup!,
          strategyGeneratedAt: "2026-08-01T01:00:00.000Z",
          strategyRun: {
            status: "completed",
            provider: "llm",
            fallbackUsed: false,
          },
        },
      },
      provider: "llm",
      model: "gpt-4.1-mini",
      inputTokens: 120,
      outputTokens: 45,
      fallbackUsed: false,
      runId: "run-1",
    });

    const result = await runLiveStrategyAction({
      peerId: "emma",
      projectId: "proj-1",
      project,
      understanding: null,
    });

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("llm");
    expect(result.model).toBe("gpt-4.1-mini");
    expect(result.inputTokens).toBe(120);
    expect(result.outputTokens).toBe(45);
    expect(result.fallbackUsed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("OPENAI_API_KEY");
    expect(JSON.stringify(result)).not.toContain("sk-");
  });

  it("passes verified organization id to server execution", async () => {
    enqueueMock.mockResolvedValue({ ok: true, status: "completed", project: readyProject() });
    await runLiveStrategyAction({
      peerId: "emma",
      projectId: "proj-1",
      project: readyProject(),
      understanding: null,
      locale: "nl",
    });
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        peerId: "emma",
        projectId: "proj-1",
        locale: "nl",
      })
    );
  });

  it("awaits enqueue promise through mocked Brain delay", async () => {
    const project = readyProject();
    enqueueMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: "completed",
                project: {
                  ...project,
                  campaignSetup: {
                    ...project.campaignSetup!,
                    strategyGeneratedAt: "2026-08-01T01:00:00.000Z",
                    strategyRun: { status: "completed", provider: "llm" },
                  },
                },
                provider: "llm",
                inputTokens: 665,
                outputTokens: 1085,
                fallbackUsed: false,
              }),
            60
          );
        })
    );

    const started = Date.now();
    const result = await runLiveStrategyAction({
      peerId: "emma",
      projectId: "proj-1",
      project,
      understanding: null,
    });
    const elapsed = Date.now() - started;

    expect(elapsed).toBeGreaterThanOrEqual(50);
    expect(result.status).toBe("completed");
    expect(result.status).not.toBe("gathering_context");
  });

  it("rejects demo peer ids", async () => {
    const result = await runLiveStrategyAction({
      peerId: "demo",
      projectId: "proj-1",
      project: { ...readyProject(), peerId: "demo" },
      understanding: null,
    });
    expect(result.error).toBe("invalid_input");
    expect(enqueueMock).not.toHaveBeenCalled();
  });
});
