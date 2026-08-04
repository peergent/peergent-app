import { afterEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { STRATEGY_SERVER_ACTION_TIMEOUT_MS } from "@/lib/office/campaign/strategy-run-types";

const enqueueMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/office/campaign/live-strategy-run-execution", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/office/campaign/live-strategy-run-execution")
  >();
  return {
    ...actual,
    enqueueLiveStrategyRunServer: enqueueMock,
  };
});

vi.mock("@/lib/intelligence/api/require-org-context", () => ({
  OrgContextError: class OrgContextError extends Error {
    code = "unauthorized";
  },
  requireAuthenticatedOrgContext: vi.fn().mockResolvedValue({
    supabase: {},
    organizationId: "org-1",
    userId: "user-1",
  }),
}));

vi.mock("@/lib/peers/server-queries", () => ({
  fetchOrganizationPeerByIdServer: vi.fn().mockResolvedValue({ id: "emma" }),
}));

function readyProject(): MarketingProject {
  return {
    id: "proj-hang-1",
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

describe("runLiveStrategyAction timeout", () => {
  afterEach(() => {
    vi.useRealTimers();
    enqueueMock.mockReset();
  });

  it("returns failed project patch when enqueue hangs", async () => {
    const { runLiveStrategyAction } = await import(
      "@/lib/office/campaign/live-strategy-run-action"
    );
    enqueueMock.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    vi.useFakeTimers();
    const promise = runLiveStrategyAction({
      peerId: "emma",
      projectId: "proj-hang-1",
      project: readyProject(),
      understanding: null,
    });

    await vi.advanceTimersByTimeAsync(STRATEGY_SERVER_ACTION_TIMEOUT_MS + 1);
    const result = await promise;

    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("server_action_timeout");
    expect(result.project?.campaignSetup?.strategyRun?.status).toBe("failed");
  });
});
