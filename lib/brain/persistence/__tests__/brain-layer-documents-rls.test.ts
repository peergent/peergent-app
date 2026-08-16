/**
 * PX-55 — brain_layer_documents RLS + upsert + hydration regression tests.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
  resetLayerRepositoryStores,
} from "../layer-repository-factory";
import { upsertLayerDocument, type LayerDocumentRow } from "../layer/supabase-sync";
import { applyHydratedLayerDocumentToL1Cache } from "../layer/hydrate-l1-cache";
import { createSupabaseLayerRepositories } from "../layer/supabase-layer-repositories";
import { getDefaultCreativeRepository, resetDefaultCreativeRepository } from "../../layers/creative/creative-repository";
import { resetDefaultValidationRepository } from "../../layers/validation/validation-repository";
import { createSimulatedDurablePersistence } from "../layer/simulated-durable-persistence";
import {
  resetActiveDurablePersistence,
  setActiveDurablePersistence,
} from "../layer/active-durable-persistence";
import {
  createProjectEpisodeRunner,
  FIXTURE_ORG_ID,
  getDefaultProjectEpisodeRepository,
  resolveEpisodeStepBudgetForEpisode,
} from "../../project-runtime";
import { createProductionBrainExecutionAdapter } from "../../project-runtime/production-brain-adapter";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const ORG_A = FIXTURE_ORG_ID;
const ORG_B = "org-tenant-b-px55";
const PROJECT = "proj-px55-rls";

type StoredRow = LayerDocumentRow;

function sampleCreativeRow(organizationId: string, projectId: string, outputRef: string): LayerDocumentRow {
  return {
    organization_id: organizationId,
    brain_id: "creative",
    document_kind: "creative_record",
    document_id: outputRef,
    scope_key: `${organizationId}:${projectId}`,
    project_id: projectId,
    campaign_id: projectId,
    output_ref: outputRef,
    version: 1,
    schema_version: "1",
    payload: {
      key: { organizationId, campaignId: projectId },
      outputRef,
      graph: { versionMeta: { version: 1 } },
    },
  };
}

function sampleValidationRow(organizationId: string, projectId: string, outputRef: string): LayerDocumentRow {
  return {
    organization_id: organizationId,
    brain_id: "validation",
    document_kind: "validation_record",
    document_id: outputRef,
    scope_key: `${organizationId}:${projectId}`,
    project_id: projectId,
    campaign_id: projectId,
    output_ref: outputRef,
    version: 1,
    schema_version: "1",
    payload: {
      key: { organizationId, campaignId: projectId },
      outputRef,
      graph: { report: { overallScore: 90 } },
    },
  };
}

function conflictKey(row: LayerDocumentRow): string {
  return `${row.organization_id}:${row.brain_id}:${row.document_kind}:${row.document_id}`;
}

/** Simulates Postgres RLS: INSERT allowed when memberOrg matches; UPDATE denied without UPDATE policy. */
function createRlsMockSupabase(input: {
  memberOrgId: string;
  allowUpdate?: boolean;
}) {
  const table = new Map<string, StoredRow>();

  const upsert = vi.fn(async (row: StoredRow) => {
    const key = conflictKey(row);
    const exists = table.has(key);
    const sameTenant = row.organization_id === input.memberOrgId;

    if (!sameTenant) {
      return {
        error: {
          message:
            'new row violates row-level security policy (WITH CHECK expression) for table "brain_layer_documents"',
        },
      };
    }

    if (exists && !input.allowUpdate) {
      return {
        error: {
          message:
            'new row violates row-level security policy (USING expression) for table "brain_layer_documents"',
        },
      };
    }

    table.set(key, row);
    return { error: null };
  });

  const from = vi.fn(() => ({
    upsert,
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [...table.values()], error: null }),
  }));

  return {
    client: { from } as unknown as AppSupabaseClient,
    upsert,
    table,
  };
}

describe("PX-55 brain_layer_documents RLS + persistence", () => {
  beforeEach(() => {
    resetLayerRepositoryStores();
    resetConfiguredLayerRepositories();
    resetDefaultCreativeRepository();
    resetDefaultValidationRepository();
    resetActiveDurablePersistence();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetLayerRepositoryStores();
    resetConfiguredLayerRepositories();
    resetActiveDurablePersistence();
  });

  it("A — migration adds UPDATE policy for brain_layer_documents", () => {
    const sql = readFileSync(
      resolve(
        __dirname,
        "../../../../supabase/migrations/20250816100000_brain_layer_documents_update_rls.sql"
      ),
      "utf8"
    );
    expect(sql).toContain("Brain layer documents updatable by organization members");
    expect(sql).toContain("FOR UPDATE");
    expect(sql).toContain("is_org_member(organization_id)");
    expect(sql).not.toMatch(/disable row level security/i);
  });

  it("B — upsert existing same-tenant document fails without UPDATE policy (production regression)", async () => {
    const mock = createRlsMockSupabase({ memberOrgId: ORG_A, allowUpdate: false });
    const row = sampleCreativeRow(ORG_A, PROJECT, "creative:org:proj:1");

    await upsertLayerDocument(mock.client, row);
    await expect(upsertLayerDocument(mock.client, row)).rejects.toThrow(/USING expression/);
    expect(mock.upsert).toHaveBeenCalledTimes(2);
  });

  it("C — upsert existing same-tenant document succeeds when UPDATE allowed (post-migration)", async () => {
    const mock = createRlsMockSupabase({ memberOrgId: ORG_A, allowUpdate: true });
    const row = sampleCreativeRow(ORG_A, PROJECT, "creative:org:proj:2");

    await upsertLayerDocument(mock.client, row);
    await expect(upsertLayerDocument(mock.client, row)).resolves.toBeUndefined();
  });

  it("D — cross-tenant upsert fails", async () => {
    const mock = createRlsMockSupabase({ memberOrgId: ORG_A, allowUpdate: true });
    const row = sampleCreativeRow(ORG_B, PROJECT, "creative:cross:1");

    await expect(upsertLayerDocument(mock.client, row)).rejects.toThrow(/WITH CHECK expression/);
  });

  it("E — validation_record upsert succeeds for same tenant when UPDATE allowed", async () => {
    const mock = createRlsMockSupabase({ memberOrgId: ORG_A, allowUpdate: true });
    const row = sampleValidationRow(ORG_A, PROJECT, "validation:org:proj:1");

    await upsertLayerDocument(mock.client, row);
    await expect(upsertLayerDocument(mock.client, row)).resolves.toBeUndefined();
  });

  it("F — hydration applies L1 cache without Supabase upsert", async () => {
    const mock = createRlsMockSupabase({ memberOrgId: ORG_A, allowUpdate: false });
    configureLayerRepositories({ mode: "supabase", supabase: mock.client });

    applyHydratedLayerDocumentToL1Cache(sampleCreativeRow(ORG_A, PROJECT, "creative:hydrate:1"));

    expect(mock.upsert).not.toHaveBeenCalled();
    expect(
      getDefaultCreativeRepository().getLatest({ organizationId: ORG_A, campaignId: PROJECT })
    ).toBeTruthy();
  });

  it("G — write-through store uses upsert (autonomous orchestration path)", async () => {
    const mock = createRlsMockSupabase({ memberOrgId: ORG_A, allowUpdate: true });
    const repos = createSupabaseLayerRepositories(mock.client);

    repos.creative.store({
      key: { organizationId: ORG_A, campaignId: PROJECT },
      outputRef: "creative:write-through:1",
      storedAt: new Date().toISOString(),
      graph: {
        versionMeta: { version: 1 },
        messaging: [],
        deliverables: [],
        channelPlans: [],
      },
    } as never);

    await vi.waitFor(() => {
      expect(mock.upsert).toHaveBeenCalled();
    });
  });
});

describe("PX-55 production-like commit after validation", () => {
  beforeEach(() => {
    resetLayerRepositoryStores();
    resetConfiguredLayerRepositories();
    resetDefaultCreativeRepository();
    resetDefaultValidationRepository();
    resetActiveDurablePersistence();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    setActiveDurablePersistence(createSimulatedDurablePersistence());
  });

  it("H — validation completion persists via episode commit sync (simulated durable)", async () => {
    const project: MarketingProject = createMarketingCampaignProject({
      peerId: "emma",
      ownerLabel: "Emma",
      name: "PX-55 Commit",
      goalLabel: "Leads",
      description: "Persistence commit after validation.",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      selectedChannels: ["linkedin"],
    });

    const adapter = createProductionBrainExecutionAdapter({
      peerId: "demo",
      project,
      domainInput: {
        peerId: "demo",
        organizationId: ORG_A,
        userName: "",
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
      },
    });

    const runner = createProjectEpisodeRunner(undefined, undefined, adapter);
    const projectId = project.id;
    const repo = getDefaultProjectEpisodeRepository();

    await runner.startEpisode({
      organizationId: ORG_A,
      projectId,
      peerId: "demo",
      sliceAvailability: {
        business: true,
        brand: true,
        website: true,
        products: true,
        competitors: true,
        goals: true,
        campaign: true,
      },
    });

    repo.save({
      ...repo.get({ organizationId: ORG_A, projectId })!,
      campaignApprovalMode: "approval_before_publication",
    });

    await runner.runUntilPause({
      organizationId: ORG_A,
      projectId,
      peerId: "demo",
      target: { targetBrain: "creative" },
    });

    const stalled = repo.get({ organizationId: ORG_A, projectId })!;
    const continuation = await runner.runUntilPause({
      organizationId: ORG_A,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudgetForEpisode(stalled),
    });

    expect(continuation.episode.snapshot.completedBrains).toContain("validation");
    expect(
      continuation.status === "waiting_for_approval" ||
        continuation.episode.snapshot.state === "waiting_for_approval"
    ).toBe(true);
    expect(continuation.episode.durableVersion).toBeGreaterThan(0);
  });
});
