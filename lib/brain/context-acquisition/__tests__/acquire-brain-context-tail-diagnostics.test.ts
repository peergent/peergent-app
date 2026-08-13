import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acquireBrainContext } from "../acquire-brain-context";
import * as brandLayer from "../../layers/brand/brand-layer";

const ORG = "org-tail-diag";
const mockSupabase = {} as import("@/lib/intelligence/api/org-context").AppSupabaseClient;

function parseContextLines(infoSpy: ReturnType<typeof vi.spyOn>): string[] {
  return infoSpy.mock.calls
    .map((call) => call[0])
    .filter((line): line is string => typeof line === "string" && line.includes("brain_context"))
    .map((line) => String((JSON.parse(line) as { event: string }).event));
}

describe("acquireBrainContext tail diagnostics", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubEnv("BRAIN_CONTEXT_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    infoSpy.mockRestore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("emits post-completed tail stages in order on success", async () => {
    const result = await acquireBrainContext({
      supabase: mockSupabase,
      organizationId: ORG,
      projectId: "proj-tail",
      peerId: "peer-tail",
      task: { peerRole: "Marketing", phase: "project_start", locale: "en" },
      campaignContext: {
        projectId: "proj-tail",
        goals: ["Leads"],
        description: "Objective",
      } as never,
    });

    const events = parseContextLines(infoSpy);
    const completedIdx = events.indexOf("context_acquisition_completed");
    expect(completedIdx).toBeGreaterThanOrEqual(0);
    expect(events.slice(completedIdx)).toEqual([
      "context_acquisition_completed",
      "context_acquisition_tail_started",
      "context_acquisition_brand_graph_started",
      "context_acquisition_brand_graph_completed",
      "context_acquisition_memories_load_started",
      "context_acquisition_memories_load_completed",
      "context_acquisition_package_returning",
    ]);
    expect(result.contextReady).toBeDefined();
  });

  it("rethrows when collectBrandGraph fails after context_acquisition_completed", async () => {
    const assemblyModule = await import("../assembly/assemble-from-sources");
    vi.spyOn(assemblyModule, "assembleContextFromSources").mockResolvedValue({
      companySnapshot: {
        organizationId: ORG,
        profile: {
          positioning: { value: null, source: "integration", lastUpdatedAt: "", freshness: "unknown", confidence: "low", customerConfirmed: false },
          tone: { value: null, source: "integration", lastUpdatedAt: "", freshness: "unknown", confidence: "low", customerConfirmed: false },
          brandPromises: { value: [], source: "integration", lastUpdatedAt: "", freshness: "unknown", confidence: "low", customerConfirmed: false },
          targetAudiences: { value: [], source: "integration", lastUpdatedAt: "", freshness: "unknown", confidence: "low", customerConfirmed: false },
        },
        website: null,
        unknowns: [],
        assembledAt: new Date().toISOString(),
        contextVersion: 0,
      },
      readiness: { scores: [], overallScore: 0 },
      audit: { unknowns: [], warnings: [] },
    } as never);

    vi.spyOn(brandLayer, "collectBrandGraph").mockImplementation(() => {
      throw new Error("collectBrandGraph_failed");
    });

    await expect(
      acquireBrainContext({
        supabase: mockSupabase,
        organizationId: ORG,
        projectId: "proj-brand-fail",
        peerId: "peer-tail",
        task: { peerRole: "Marketing", phase: "project_start", locale: "en" },
        campaignContext: {
          projectId: "proj-brand-fail",
          goals: ["Leads"],
          description: "Objective",
        } as never,
      })
    ).rejects.toThrow("collectBrandGraph_failed");

    const events = parseContextLines(infoSpy);
    expect(events).toContain("context_acquisition_completed");
    expect(events).toContain("context_acquisition_tail_started");
    expect(events).toContain("context_acquisition_brand_graph_started");
    expect(events).not.toContain("context_acquisition_brand_graph_completed");
  });
});
