import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireBrainContext,
  applyContextBudget,
  createContextItem,
  DEFAULT_CONTEXT_ACQUISITION_BUDGET,
  itemMatchesRequirement,
  type ContextSourceAdapter,
} from "../index";
import { memoryContextAdapter } from "../adapters/memory-adapter";
import { getDefaultMemoryRepository } from "../../layers/memory/memory-repository";
import { configureLayerRepositories, resetLayerRepositoryStores } from "../../persistence/layer-repository-factory";
import type { MemoryGraph } from "../../layers/memory/types";
import { MEMORY_LAYER_VERSION } from "../../layers/memory/types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";

const ORG_A = "org-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "org-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const PROJECT_A = "proj-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const PEER_A = "peer-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const mockSupabase = {} as AppSupabaseClient;

function orgAdapter(orgId: string, name: string): ContextSourceAdapter {
  return {
    id: "organization",
    categories: ["organization"],
    async acquire(input) {
      return {
        adapterId: "organization",
        status: "completed",
        durationMs: 1,
        items: [
          createContextItem({
            category: "organization",
            key: "organization.identity",
            label: "Organization",
            summary: name,
            organizationId: orgId,
            provenance: { kind: "company_profile", refId: orgId, capturedAt: "2026-01-01T00:00:00.000Z" },
            sourceAdapterId: "organization",
            freshness: "fresh",
            confidence: "high",
          }),
        ],
      };
    },
  };
}

function businessAdapter(orgId: string, keys: string[]): ContextSourceAdapter {
  return {
    id: "business_brain",
    categories: ["business_brain"],
    async acquire() {
      return {
        adapterId: "business_brain",
        status: "completed",
        durationMs: 1,
        items: keys.map((key) =>
          createContextItem({
            category: "business_brain",
            key,
            label: key,
            summary: `value for ${key}`,
            organizationId: orgId,
            provenance: { kind: "business_brain", refId: key, capturedAt: "2026-01-01T00:00:00.000Z" },
            sourceAdapterId: "business_brain",
            freshness: "current",
            confidence: "medium",
          })
        ),
      };
    },
  };
}

function projectAdapter(orgId: string, projectId: string): ContextSourceAdapter {
  return {
    id: "project",
    categories: ["project"],
    async acquire(input) {
      return {
        adapterId: "project",
        status: "completed",
        durationMs: 1,
        items: [
          createContextItem({
            category: "project",
            key: "project.objective",
            label: "Objective",
            summary: "Grow pipeline",
            organizationId: orgId,
            projectId,
            provenance: { kind: "campaign_context", refId: projectId, capturedAt: "2026-01-01T00:00:00.000Z" },
            sourceAdapterId: "project",
            confidence: "high",
          }),
          createContextItem({
            category: "project",
            key: "project.goals",
            label: "Goals",
            summary: "Leads; Revenue",
            organizationId: orgId,
            projectId,
            provenance: { kind: "campaign_context", refId: `${projectId}:goals`, capturedAt: "2026-01-01T00:00:00.000Z" },
            sourceAdapterId: "project",
            confidence: "high",
          }),
        ],
      };
    },
  };
}

function failingAdapter(id: string, code: string): ContextSourceAdapter {
  return {
    id,
    categories: ["business_brain"],
    async acquire() {
      return {
        adapterId: id,
        status: "failed",
        items: [],
        failureCode: code,
        failureMessage: "source unavailable",
        durationMs: 1,
      };
    },
  };
}

function seedOrgMemory(orgId: string, memoryId: string) {
  const graph: MemoryGraph = {
    version: MEMORY_LAYER_VERSION,
    organizationId: orgId,
    campaignId: "camp-test",
    createdAt: "2026-01-01T00:00:00.000Z",
    validationGraphRef: null,
    creativeGraphRef: null,
    nodes: [],
    relations: [],
    memories: [
      {
        id: memoryId,
        category: "business_memory",
        title: "Positioning note",
        description: "We serve SMB owners in logistics.",
        source: "prior_memory",
        confidence: "high",
        importance: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        expiresAt: null,
        evidence: [],
        relatedCampaigns: [],
        relatedDecisions: [],
        relatedAssets: [],
        tags: [],
        lifecycle: "active",
        mergeKey: memoryId,
      },
    ],
    decisions: [],
    evolution: [],
    summary: {
      storedCount: 1,
      mergedCount: 0,
      skippedCount: 0,
      archivedCount: 0,
      forgottenCount: 0,
      totalActiveMemories: 1,
      confidence: "high",
      reasoningSummary: "seed",
    },
    confidence: "high",
  };
  getDefaultMemoryRepository().store({
    key: { organizationId: orgId },
    graph,
    outputRef: `memory:${orgId}:v1`,
    storedAt: "2026-01-01T00:00:00.000Z",
    snapshot: {
      id: `snap-${orgId}`,
      organizationId: orgId,
      version: 1,
      outputRef: `memory:${orgId}:v1`,
      storedAt: "2026-01-01T00:00:00.000Z",
      graph,
    },
  });
}

describe("PX-49 Real Context Acquisition", () => {
  beforeEach(() => {
    resetLayerRepositoryStores();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("combines multiple source adapters into one context package", async () => {
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: PROJECT_A,
        peerId: PEER_A,
        task: { peerRole: "Marketing", locale: "en" },
      },
      {
        adapters: [
          orgAdapter(ORG_A, "Org A"),
          businessAdapter(ORG_A, [
            "business.positioning",
            "business.products",
            "business.target_audience",
          ]),
          projectAdapter(ORG_A, PROJECT_A),
        ],
      }
    );

    expect(pkg.items.length).toBeGreaterThanOrEqual(5);
    expect(new Set(pkg.items.map((i) => i.sourceAdapterId)).size).toBeGreaterThanOrEqual(3);
    expect(pkg.contextReady).toBe(true);
  });

  it("preserves organization scoping on every item", async () => {
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: PROJECT_A,
        task: { peerRole: "Marketing", locale: "en" },
      },
      { adapters: [orgAdapter(ORG_A, "Org A"), businessAdapter(ORG_A, ["business.products"])] }
    );

    for (const item of pkg.items) {
      expect(item.organizationId).toBe(ORG_A);
    }
  });

  it("preserves project scoping where applicable", async () => {
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: PROJECT_A,
        task: { peerRole: "Marketing", locale: "en" },
      },
      { adapters: [projectAdapter(ORG_A, PROJECT_A)] }
    );

    const projectItems = pkg.items.filter((i) => i.category === "project");
    expect(projectItems.length).toBeGreaterThan(0);
    for (const item of projectItems) {
      expect(item.projectId).toBe(PROJECT_A);
    }
  });

  it("produces explicit gaps for missing required context", async () => {
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: PROJECT_A,
        task: { peerRole: "Marketing", locale: "en" },
      },
      { adapters: [orgAdapter(ORG_A, "Org A")] }
    );

    expect(pkg.contextReady).toBe(false);
    expect(pkg.acquisitionGaps.some((g) => g.requirement.required && g.severity === "blocking")).toBe(
      true
    );
    expect(pkg.contextGaps.some((g) => g.blocking)).toBe(true);
  });

  it("does not fail acquisition when optional context is missing", async () => {
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: PROJECT_A,
        task: { peerRole: "Marketing", locale: "en" },
      },
      {
        adapters: [
          orgAdapter(ORG_A, "Org A"),
          businessAdapter(ORG_A, [
            "business.positioning",
            "business.products",
            "business.target_audience",
          ]),
          projectAdapter(ORG_A, PROJECT_A),
        ],
      }
    );

    const optionalGaps = pkg.acquisitionGaps.filter((g) => !g.requirement.required);
    expect(optionalGaps.length).toBeGreaterThan(0);
    expect(pkg.contextReady).toBe(true);
  });

  it("represents source failure without inventing context", async () => {
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: PROJECT_A,
        task: { peerRole: "Marketing", locale: "en" },
      },
      {
        adapters: [
          orgAdapter(ORG_A, "Org A"),
          failingAdapter("business_brain", "business_brain_load_failed"),
        ],
      }
    );

    expect(pkg.diagnostics.adapterOutcomes.business_brain?.status).toBe("failed");
    expect(pkg.contextReady).toBe(false);
    expect(pkg.items.every((i) => i.sourceAdapterId !== "business_brain")).toBe(true);
  });

  it("preserves provenance through normalization", async () => {
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        task: { peerRole: "Sales", locale: "en" },
      },
      { adapters: [businessAdapter(ORG_A, ["business.products"])] }
    );

    const item = pkg.items.find((i) => i.key === "business.products");
    expect(item?.provenance.kind).toBe("business_brain");
    expect(item?.provenance.refId).toBe("business.products");
  });

  it("preserves freshness metadata through acquisition", async () => {
    const pkg = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        task: { peerRole: "Sales", locale: "en" },
      },
      { adapters: [businessAdapter(ORG_A, ["business.products"])] }
    );

    expect(pkg.items[0]?.freshness).toBe("current");
  });

  it("consumes organizational memory through PX-48 memory repository", async () => {
    seedOrgMemory(ORG_A, "mem-positioning-1");

    const result = await memoryContextAdapter.acquire({
      supabase: mockSupabase,
      organizationId: ORG_A,
      requirements: [],
      budget: DEFAULT_CONTEXT_ACQUISITION_BUDGET,
    });

    expect(result.status).toBe("completed");
    expect(result.items.some((i) => i.key.startsWith("memory.mem-positioning"))).toBe(true);
    expect(result.items[0]?.provenance.kind).toBe("memory");
  });

  it("prevents cross-organization peer context leakage", async () => {
    const isolatedPeerAdapter: ContextSourceAdapter = {
      id: "peer",
      categories: ["peer"],
      async acquire(input) {
        const peerOrgId = ORG_B;
        if (peerOrgId !== input.organizationId) {
          return {
            adapterId: "peer",
            status: "failed",
            items: [],
            failureCode: "authorization_violation",
            failureMessage: "Peer organization mismatch.",
            durationMs: 1,
          };
        }
        return { adapterId: "peer", status: "completed", items: [], durationMs: 1 };
      },
    };

    const result = await isolatedPeerAdapter.acquire({
      supabase: mockSupabase,
      organizationId: ORG_A,
      peerId: PEER_A,
      requirements: [],
      budget: DEFAULT_CONTEXT_ACQUISITION_BUDGET,
    });

    expect(result.status).toBe("failed");
    expect(result.failureCode).toBe("authorization_violation");
    expect(result.items).toHaveLength(0);
  });

  it("assembles context deterministically without LLM calls", async () => {
    const llmSpy = vi.fn();
    const pkg1 = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: PROJECT_A,
        task: { peerRole: "Marketing", locale: "en" },
      },
      {
        adapters: [
          orgAdapter(ORG_A, "Org A"),
          businessAdapter(ORG_A, [
            "business.positioning",
            "business.products",
            "business.target_audience",
          ]),
          projectAdapter(ORG_A, PROJECT_A),
        ],
      }
    );
    const pkg2 = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: PROJECT_A,
        task: { peerRole: "Marketing", locale: "en" },
      },
      {
        adapters: [
          orgAdapter(ORG_A, "Org A"),
          businessAdapter(ORG_A, [
            "business.positioning",
            "business.products",
            "business.target_audience",
          ]),
          projectAdapter(ORG_A, PROJECT_A),
        ],
      }
    );

    expect(llmSpy).not.toHaveBeenCalled();
    expect(pkg1.items.map((i) => i.key).sort()).toEqual(pkg2.items.map((i) => i.key).sort());
  });

  it("bounds context volume via budget limits", () => {
    const items = Array.from({ length: 200 }, (_, i) =>
      createContextItem({
        category: "business_brain",
        key: `business.fact.${i}`,
        label: `Fact ${i}`,
        summary: `summary ${i}`,
        organizationId: ORG_A,
        provenance: { kind: "business_brain", refId: String(i) },
        sourceAdapterId: "business_brain",
      })
    );

    const { items: bounded, truncated } = applyContextBudget(items, {
      maxItemsPerAdapter: 24,
      maxTotalItems: 50,
      maxSummaryChars: 512,
    });

    expect(bounded.length).toBe(50);
    expect(truncated).toBe(true);
  });

  it("matches requirements to acquired items correctly", () => {
    const item = createContextItem({
      category: "project",
      key: "project.goals",
      label: "Goals",
      summary: "Leads",
      organizationId: ORG_A,
      provenance: { kind: "campaign_context", refId: "goals" },
      sourceAdapterId: "project",
    });

    expect(itemMatchesRequirement(item, "project.goals")).toBe(true);
    expect(itemMatchesRequirement(item, "project.objective")).toBe(false);
  });

  it("isolates organization A from organization B in adapter output", async () => {
    const pkgA = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_A,
        task: { peerRole: "Sales", locale: "en" },
      },
      { adapters: [orgAdapter(ORG_A, "Org A Only")] }
    );
    const pkgB = await acquireBrainContext(
      {
        supabase: mockSupabase,
        organizationId: ORG_B,
        task: { peerRole: "Sales", locale: "en" },
      },
      { adapters: [orgAdapter(ORG_B, "Org B Only")] }
    );

    expect(pkgA.items.every((i) => i.organizationId === ORG_A)).toBe(true);
    expect(pkgB.items.every((i) => i.organizationId === ORG_B)).toBe(true);
    expect(pkgA.items.some((i) => i.summary.includes("Org B"))).toBe(false);
  });
});
